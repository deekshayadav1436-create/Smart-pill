/**
 * AuthPage.jsx
 * ============
 * SmartPill – Sign In & Create Account Page
 *
 * This component renders the authentication interface with two tabs:
 *   1. Sign In   – login with username/email + password
 *   2. Create Account – register with full name, username, email, password
 *
 * Features:
 *   - Client-side validation with inline error messages
 *   - Show/hide password toggle
 *   - Loading spinner while API request is in progress
 *   - Prevents duplicate form submissions
 *   - Connects to the backend /api/auth/register & /api/auth/login endpoints
 *   - On successful login → calls onLoginSuccess(userData)
 *
 * Design: Matches the existing SmartPill blue-and-white healthcare theme.
 */

import { useState, useEffect } from "react";

// In development, Vite reverse-proxies /api to the backend, enabling a single URL (http://127.0.0.1:5173)
const API_URL = import.meta.env.VITE_API_URL || "";

function AuthPage({ onLoginSuccess }) {
  // ─── Tab State ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("signin"); // "signin" | "register"

  // ─── Database health status ──────────────────────────────────
  // "checking" | "online" | "offline"
  const [dbStatus, setDbStatus] = useState("checking");

  // On mount: ping /api/health to detect if DB is configured and connected
  useEffect(() => {
    const checkDbHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout
        const res = await fetch(`${API_URL}/api/health`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (data?.database?.status === "connected") {
          setDbStatus("online");
        } else {
          setDbStatus("offline");
        }
      } catch (err) {
        setDbStatus("offline");
      }
    };
    checkDbHealth();
  }, []);

  // ─── Sign In Form State ─────────────────────────────────────
  const [loginData, setLoginData] = useState({
    identifier: "", // username or email
    password: "",
  });

  // ─── Create Account Form State ──────────────────────────────
  const [registerData, setRegisterData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ─── UI State ───────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});       // field-level errors
  const [message, setMessage] = useState(null);    // { type: "success"|"error", text: "..." }

  // ═══════════════════════════════════════════════════════════
  //  VALIDATION HELPERS
  // ═══════════════════════════════════════════════════════════

  /** Validate the Sign In form and return an errors object */
  const validateLogin = () => {
    const errs = {};

    if (!loginData.identifier.trim()) {
      errs.identifier = "Username or email is required";
    }

    if (!loginData.password) {
      errs.password = "Password is required";
    }

    return errs;
  };

  /** Validate the Create Account form and return an errors object */
  const validateRegister = () => {
    const errs = {};

    // Full Name
    if (!registerData.fullName.trim()) {
      errs.fullName = "Full name is required";
    }

    // Username
    if (!registerData.username.trim()) {
      errs.username = "Username is required";
    } else if (registerData.username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (registerData.username.trim().length > 30) {
      errs.username = "Username must not exceed 30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerData.username.trim())) {
      errs.username = "Only letters, numbers, and underscores allowed";
    }

    // Email
    if (!registerData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email.trim())) {
      errs.email = "Please enter a valid email address";
    }

    // Password
    if (!registerData.password) {
      errs.password = "Password is required";
    } else if (registerData.password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }

    // Confirm Password
    if (!registerData.confirmPassword) {
      errs.confirmPassword = "Please confirm your password";
    } else if (registerData.password !== registerData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }

    return errs;
  };

  // ═══════════════════════════════════════════════════════════
  //  FORM HANDLERS
  // ═══════════════════════════════════════════════════════════

  /** Handle Sign In form submission */
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Client-side validation
    const errs = validateLogin();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // send/receive cookies
        body: JSON.stringify({
          identifier: loginData.identifier.trim(),
          password: loginData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Server returned an error
        if (data.errors && data.errors.length > 0) {
          const fieldErrors = {};
          let generalMsg = data.message;
          data.errors.forEach((err) => {
            const key = err.path || err.param || err.field;
            if (key === "database" || key === "server" || key === "route") {
              generalMsg = err.msg || err.message || data.message;
            } else {
              fieldErrors[key] = err.msg || err.message;
            }
          });
          setErrors(fieldErrors);
          if (generalMsg || Object.keys(fieldErrors).length === 0) {
            setMessage({ type: "error", text: generalMsg || data.message || "Login failed" });
          }
        } else {
          setMessage({ type: "error", text: data.message || "Login failed" });
        }
        return;
      }

      // Persist session token and user info
      if (data.token) {
        localStorage.setItem("smartpill_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("smartpill_user", JSON.stringify(data.user));
      }

      // Success – pass user data to App
      setMessage({ type: "success", text: "Login successful! Redirecting to Dashboard..." });

      // Brief delay so the user sees the success message
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 500);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Cannot connect to the server. Please check if the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Handle Create Account form submission */
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Client-side validation
    const errs = validateRegister();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: registerData.fullName.trim(),
          username: registerData.username.trim().toLowerCase(),
          email: registerData.email.trim().toLowerCase(),
          password: registerData.password,
          confirmPassword: registerData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && data.errors.length > 0) {
          const fieldErrors = {};
          let generalMsg = data.message;
          data.errors.forEach((err) => {
            const key = err.path || err.param || err.field;
            if (key === "database" || key === "server" || key === "route") {
              generalMsg = err.msg || err.message || data.message;
            } else {
              fieldErrors[key] = err.msg || err.message;
            }
          });
          setErrors(fieldErrors);
          if (generalMsg || Object.keys(fieldErrors).length === 0) {
            setMessage({ type: "error", text: generalMsg || data.message || "Registration failed" });
          }
        } else {
          setMessage({ type: "error", text: data.message || "Registration failed" });
        }
        return;
      }

      // Registration successful!
      setMessage({
        type: "success",
        text: "Account created successfully! You can now sign in.",
      });

      // Reset form and switch to Sign In tab after a brief pause
      setRegisterData({
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setActiveTab("signin");
        setMessage({
          type: "success",
          text: "Registration complete. Please sign in with your credentials.",
        });
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Cannot connect to the server. Please check if the backend is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  /** Switch between tabs and clear all state */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setErrors({});
    setMessage(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="auth-container">
      {/* Login Card */}
      <div className="auth-card">
        {/* Brand / Logo */}
        <div className="auth-brand">
          <div className="brand-icon">✚</div>
          <div>
            <h2>SmartPill</h2>
            <span>Health Management System</span>
          </div>
        </div>

        {/* DB Status Banner */}
        {dbStatus === "checking" && (
          <div style={{
            background: "#f0f4ff", border: "1px solid #c3d0f0",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
            fontSize: "13px", color: "#4a6fa5", display: "flex",
            alignItems: "center", gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>⏳</span>
            <span>Connecting to database…</span>
          </div>
        )}
        {dbStatus === "online" && (
          <div style={{
            background: "#f0faf4", border: "1px solid #a8d5b5",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "12px",
            fontSize: "13px", color: "#2e7d52", display: "flex",
            alignItems: "center", gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>✅</span>
            <span>Database connected — ready to use.</span>
          </div>
        )}
        {dbStatus === "offline" && (
          <div style={{
            background: "#fff8f0", border: "1px solid #f5c6a0",
            borderRadius: "10px", padding: "14px 16px", marginBottom: "16px",
            fontSize: "13px", color: "#7a3a00"
          }}>
            <div style={{ fontWeight: "700", fontSize: "14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️</span> Database Not Connected
            </div>
            <p style={{ margin: "0 0 10px 0", lineHeight: "1.5" }}>
              The database is offline. This is because{" "}
              <strong>MONGODB_URI</strong> is not set in your Vercel project settings.
            </p>
            <p style={{ margin: "0 0 10px 0", lineHeight: "1.5", fontWeight: "600" }}>
              Fix in 2 minutes:
            </p>
            <ol style={{ margin: "0 0 10px 0", paddingLeft: "20px", lineHeight: "1.8" }}>
              <li>Go to <a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8" }}>mongodb.com/atlas</a> → create a <strong>free M0 cluster</strong></li>
              <li>Create a database user, set Network Access → <strong>0.0.0.0/0</strong></li>
              <li>Copy the connection string: <code style={{ background: "#f5e6d8", padding: "2px 5px", borderRadius: "4px", fontSize: "11px" }}>mongodb+srv://user:pass@cluster.mongodb.net/smartpill</code></li>
              <li>Go to your <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8" }}>Vercel Dashboard</a> → Project → <strong>Settings → Environment Variables</strong></li>
              <li>Add: <code style={{ background: "#f5e6d8", padding: "2px 5px", borderRadius: "4px", fontSize: "11px" }}>MONGODB_URI</code> = your Atlas connection string</li>
              <li>Also add: <code style={{ background: "#f5e6d8", padding: "2px 5px", borderRadius: "4px", fontSize: "11px" }}>JWT_SECRET</code> = any random 32+ char string</li>
              <li>Also add: <code style={{ background: "#f5e6d8", padding: "2px 5px", borderRadius: "4px", fontSize: "11px" }}>NODE_ENV</code> = <code style={{ background: "#f5e6d8", padding: "2px 5px", borderRadius: "4px", fontSize: "11px" }}>production</code></li>
              <li><strong>Redeploy</strong> in Vercel (Deployments → ⋯ → Redeploy)</li>
            </ol>
            <button
              type="button"
              onClick={() => { setDbStatus("checking"); fetch(`${API_URL}/api/health`).then(r => r.json()).then(d => setDbStatus(d?.database?.status === "connected" ? "online" : "offline")).catch(() => setDbStatus("offline")); }}
              style={{
                background: "#e8703a", color: "white", border: "none",
                borderRadius: "6px", padding: "7px 14px", fontSize: "12px",
                cursor: "pointer", fontWeight: "600"
              }}
            >
              🔄 Retry Connection
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => switchTab("signin")}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
          >
            Create Account
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`auth-alert ${message.type}`}>
            <span>{message.type === "success" ? "✓" : "⚠"}</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* ───── SIGN IN FORM ───── */}
        {activeTab === "signin" && (
          <form onSubmit={handleLogin} noValidate className="auth-form">
            <div>
              <label htmlFor="login-identifier">User ID / Username or Email Address</label>
              <input
                id="login-identifier"
                type="text"
                placeholder="Enter your username or email address"
                value={loginData.identifier}
                onChange={(e) =>
                  setLoginData({ ...loginData, identifier: e.target.value })
                }
                className={errors.identifier ? "input-error" : ""}
                autoComplete="username"
              />
              {errors.identifier && (
                <span className="field-error">{errors.identifier}</span>
              )}
            </div>

            <div>
              <label htmlFor="login-password">Password</label>
              <div className="password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  className={errors.password ? "input-error" : ""}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="primary-button auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span>
                  Signing In...
                </span>
              ) : (
                "Sign In to Dashboard"
              )}
            </button>
          </form>
        )}

        {/* ───── CREATE ACCOUNT FORM ───── */}
        {activeTab === "register" && (
          <form onSubmit={handleRegister} noValidate className="auth-form">
            <div>
              <label htmlFor="reg-fullname">Full Name</label>
              <input
                id="reg-fullname"
                type="text"
                placeholder="Enter your full name"
                value={registerData.fullName}
                onChange={(e) =>
                  setRegisterData({ ...registerData, fullName: e.target.value })
                }
                className={errors.fullName ? "input-error" : ""}
                autoComplete="name"
              />
              {errors.fullName && (
                <span className="field-error">{errors.fullName}</span>
              )}
            </div>

            <div>
              <label htmlFor="reg-username">User ID / Username</label>
              <input
                id="reg-username"
                type="text"
                placeholder="Choose a unique username"
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData({ ...registerData, username: e.target.value })
                }
                className={errors.username ? "input-error" : ""}
                autoComplete="username"
              />
              {errors.username && (
                <span className="field-error">{errors.username}</span>
              )}
            </div>

            <div>
              <label htmlFor="reg-email">Email Address</label>
              <input
                id="reg-email"
                type="email"
                placeholder="Enter your email address"
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData({ ...registerData, email: e.target.value })
                }
                className={errors.email ? "input-error" : ""}
                autoComplete="email"
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div>
              <label htmlFor="reg-password">Create Password</label>
              <div className="password-wrapper">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  className={errors.password ? "input-error" : ""}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

            <div>
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className={errors.confirmPassword ? "input-error" : ""}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="field-error">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="primary-button auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-wrapper">
                  <span className="spinner"></span>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <p className="auth-footer-note">
          {activeTab === "signin" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => switchTab("register")}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => switchTab("signin")}
              >
                Sign In
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
