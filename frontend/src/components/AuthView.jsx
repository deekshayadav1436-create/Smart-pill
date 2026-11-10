import { useState } from "react";
import { loginUser, registerUser, DEFAULT_USERS } from "../utils/storage";

function AuthView({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (isSignUp) {
      if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
        setErrorMessage("Please fill in all required fields.");
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match. Please recheck.");
        return;
      }

      const result = registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        setSuccessMessage("Account created successfully! Logging you in...");
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 300);
      } else {
        setErrorMessage(result.message);
      }
    } else {
      if (!formData.email.trim() || !formData.password) {
        setErrorMessage("Please enter both email and password.");
        return;
      }

      const result = loginUser(formData.email, formData.password);
      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message);
      }
    }
  };

  const handleQuickDemoLogin = (user) => {
    const result = loginUser(user.email, user.password);
    if (result.success) {
      onLoginSuccess(result.user);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* BRAND HEADER */}
        <div className="auth-brand">
          <div className="brand-icon">✚</div>
          <div>
            <h2>SmartPill</h2>
            <span>Health Management System</span>
          </div>
        </div>

        {/* TITLE & TOGGLE */}
        <div className="auth-header-text">
          <h3>{isSignUp ? "Create Patient Account" : "Patient Portal Login"}</h3>
          <p>
            {isSignUp
              ? "Register to start tracking your medications and schedules"
              : "Sign in to access your personal prescriptions and adherence dashboard"}
          </p>
        </div>

        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => {
              setIsSignUp(false);
              setErrorMessage("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isSignUp ? "active" : ""}`}
            onClick={() => {
              setIsSignUp(true);
              setErrorMessage("");
            }}
          >
            Create Account
          </button>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMessage && (
          <div className="auth-alert error">
            <span>⚠</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-alert success">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* AUTH FORM */}
        <form onSubmit={handleFormSubmit} className="auth-form">
          {isSignUp && (
            <div>
              <label>Full Patient Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. patient@smartpill.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                required
              />
            </div>
          )}

          <button type="submit" className="primary-button auth-submit-btn">
            {isSignUp ? "Register & Sign In" : "Sign In to Dashboard"}
          </button>
        </form>

        {/* DEMO ACCOUNTS QUICK LOGIN (VIVA HELPER) */}
        {!isSignUp && (
          <div className="demo-accounts-box">
            <span className="demo-badge-title">Quick Demo Login (For Viva Examination)</span>
            <p>Select any registered demo patient to inspect isolated records:</p>
            <div className="demo-buttons-group">
              {DEFAULT_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="demo-user-btn"
                  onClick={() => handleQuickDemoLogin(user)}
                >
                  <span className="demo-avatar">
                    {user.name.split(" ")[0].charAt(0)}
                  </span>
                  <div className="demo-user-info">
                    <strong>{user.name}</strong>
                    <small>{user.patientId} • {user.email}</small>
                  </div>
                  <span className="demo-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="auth-footer-note">
          <small>
            Smart Pill Reminder System • Multi-User LocalStorage Prototype
          </small>
        </div>
      </div>
    </div>
  );
}

export default AuthView;
