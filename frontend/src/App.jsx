/**
 * App.jsx
 * =======
 * SmartPill – Health Management System
 *
 * Root component that handles:
 *   1. Authentication state management
 *   2. Protected dashboard routing
 *   3. Auto-login via /api/auth/me cookie check
 *   4. All existing medication management features
 *
 * Architecture:
 *   - If user is NOT authenticated → show AuthPage
 *   - If user IS authenticated → show existing Dashboard with sidebar
 */

import { useState, useEffect } from "react";
import "./App.css";
import MedicationCard from "./components/MedicationCard";
import AuthPage from "./components/AuthPage";
import MedicationsView from "./components/MedicationsView";
import MedicationHistoryView from "./components/MedicationHistoryView";

// In development, Vite reverse-proxies /api to the backend, enabling a single URL (http://127.0.0.1:5173)
const API_URL = import.meta.env.VITE_API_URL || "";

function App() {
  // ═══════════════════════════════════════════════════════════
  //  AUTHENTICATION STATE
  // ═══════════════════════════════════════════════════════════

  const [user, setUser] = useState(null);        // Logged-in user data
  const [authLoading, setAuthLoading] = useState(true); // Checking auth on mount

  // ═══════════════════════════════════════════════════════════
  //  CHECK IF USER IS ALREADY LOGGED IN (on page load)
  // ═══════════════════════════════════════════════════════════

  // Helper to obtain authorization headers with fallback token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("smartpill_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("smartpill_token");
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include", // send cookies
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem("smartpill_user", JSON.stringify(data.user));
        } else {
          localStorage.removeItem("smartpill_token");
          localStorage.removeItem("smartpill_user");
        }
      } catch (err) {
        console.log("Auth check: backend not reachable, checking local session");
        const cached = localStorage.getItem("smartpill_user");
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch (e) {}
        }
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  AUTH HANDLERS
  // ═══════════════════════════════════════════════════════════

  /** Called by AuthPage after successful login */
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  /** Log out – clear cookie via backend and reset state */
  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }

    localStorage.removeItem("smartpill_token");
    localStorage.removeItem("smartpill_user");
    setUser(null);
  };

  // ═══════════════════════════════════════════════════════════
  //  DASHBOARD & MEDICATION STATE
  // ═══════════════════════════════════════════════════════════

  const [activePage, setActivePage] = useState("Dashboard");
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [medications, setMedications] = useState([]);

  // Fetch medications on user login (API first with offline fallback)
  useEffect(() => {
    if (!user) return;

    const userKey = `smartpill_meds_${user._id || user.username || user.id || "default"}`;

    const fetchMedications = async () => {
      try {
        const res = await fetch(`${API_URL}/api/medications`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.medications) && data.medications.length > 0) {
            setMedications(data.medications);
            localStorage.setItem(userKey, JSON.stringify(data.medications));
            return;
          }
        }
      } catch (err) {
        console.warn("API unavailable, loading local medications:", err);
      }

      // Check user-scoped local storage
      const saved = localStorage.getItem(userKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMedications(parsed);
            return;
          }
        } catch (e) {}
      }

      // Default initial demonstration medications
      const seedMeds = [
        {
          id: "seed_1",
          name: "Metformin",
          dose: "500 mg",
          time: "08:00",
          frequency: "Daily",
          type: "Tablet",
          status: "Active",
          startDate: "2026-01-15",
          prescribedBy: "Dr. Ananya Roy",
          instructions: "Take with breakfast",
          adherenceStatus: "Taken",
        },
        {
          id: "seed_2",
          name: "Vitamin D3",
          dose: "1000 IU",
          time: "13:00",
          frequency: "Daily",
          type: "Capsule",
          status: "Active",
          startDate: "2026-02-01",
          prescribedBy: "General Physician",
          instructions: "Take after lunch with water",
          adherenceStatus: "Upcoming",
        },
        {
          id: "seed_3",
          name: "Atorvastatin",
          dose: "20 mg",
          time: "20:30",
          frequency: "Daily",
          type: "Tablet",
          status: "Active",
          startDate: "2026-01-10",
          prescribedBy: "Dr. Ananya Roy",
          instructions: "Take before bedtime",
          adherenceStatus: "Upcoming",
        },
        {
          id: "seed_4",
          name: "Amoxicillin",
          dose: "500 mg",
          time: "14:00",
          frequency: "Twice Daily",
          type: "Capsule",
          status: "Completed",
          startDate: "2025-11-01",
          endDate: "2025-11-15",
          prescribedBy: "ENT Specialist",
          discontinueReason: "Complete 14-day antibiotic course finished",
          instructions: "Course completed for throat infection",
          adherenceStatus: "Taken",
        },
      ];
      setMedications(seedMeds);
      localStorage.setItem(userKey, JSON.stringify(seedMeds));
    };

    fetchMedications();
  }, [user]);

  // Sync state to local storage as backup
  useEffect(() => {
    if (!user) return;
    const userKey = `smartpill_meds_${user._id || user.username || user.id || "default"}`;
    if (medications.length > 0) {
      localStorage.setItem(userKey, JSON.stringify(medications));
    }
  }, [medications, user]);

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    dose: "",
    time: "",
    type: "Tablet",
  });

  // ─── ADD MEDICATION ─────────────────────────────────────────
  const handleAddMedication = async (medData) => {
    try {
      const res = await fetch(`${API_URL}/api/medications`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(medData),
      });
      if (res.ok) {
        const data = await res.json();
        setMedications((prev) => [data.medication, ...prev]);
        setShowAddMedicine(false);
        return;
      }
    } catch (err) {
      console.warn("Backend unavailable, adding locally:", err);
    }

    const localMed = {
      ...medData,
      id: "med_" + Date.now(),
      status: medData.status || "Active",
      adherenceStatus: "Upcoming",
    };
    setMedications((prev) => [localMed, ...prev]);
    setShowAddMedicine(false);
  };

  // ─── UPDATE MEDICATION ──────────────────────────────────────
  const handleUpdateMedication = async (id, updates) => {
    try {
      await fetch(`${API_URL}/api/medications/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.warn("Backend unavailable, updating locally:", err);
    }

    setMedications((prev) =>
      prev.map((m) =>
        m.id === id || m._id === id ? { ...m, ...updates } : m
      )
    );
  };

  // ─── DELETE MEDICATION ──────────────────────────────────────
  const handleDeleteMedication = async (id) => {
    try {
      await fetch(`${API_URL}/api/medications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
    } catch (err) {
      console.warn("Backend unavailable, deleting locally:", err);
    }

    setMedications((prev) => prev.filter((m) => m.id !== id && m._id !== id));
  };

  const addMedication = (e) => {
    e.preventDefault();

    if (!newMedicine.name || !newMedicine.dose || !newMedicine.time) {
      alert("Please fill all medication details.");
      return;
    }

    handleAddMedication({
      name: newMedicine.name,
      dose: newMedicine.dose,
      time: newMedicine.time,
      type: newMedicine.type,
      frequency: "Daily",
      status: "Active",
      startDate: new Date().toISOString().split("T")[0],
      prescribedBy: "General Physician",
    });

    setNewMedicine({
      name: "",
      dose: "",
      time: "",
      type: "Tablet",
    });
  };

  const showMedicationNotification = (medicine) => {
    alert(
      `💊 Medication Reminder\n\nTime to take ${medicine.name} (${medicine.dose || medicine.dosage})`
    );
  };

  const takeMedication = (id) => {
    handleUpdateMedication(id, { adherenceStatus: "Taken", status: "Active" });
  };

  // Only currently active medications count towards today's schedule
  const activeMedications = medications.filter(
    (m) => m.status === "Active" || !m.status
  );

  const takenCount = activeMedications.filter(
    (medicine) => medicine.adherenceStatus === "Taken" || medicine.status === "Taken"
  ).length;

  const adherence =
    activeMedications.length > 0
      ? Math.round((takenCount / activeMedications.length) * 100)
      : 0;

  const formatTime = (time) => {
    if (!time) return "";

    const [hour, minute] = time.split(":");
    let h = Number(hour);
    const ampm = h >= 12 ? "PM" : "AM";

    h = h % 12 || 12;

    return `${String(h).padStart(2, "0")}:${minute} ${ampm}`;
  };

  useEffect(() => {
  const checkReminders = () => {
    const now = new Date();

    const currentTime =
      String(now.getHours()).padStart(2, "0") +
      ":" +
      String(now.getMinutes()).padStart(2, "0");

    medications.forEach((medicine) => {
      if (
        medicine.time === currentTime &&
        medicine.status !== "Taken"
      ) {
       showMedicationNotification(medicine);
      }
    });
  };

  const reminderTimer = setInterval(
    checkReminders,
    30000
  );

  return () => clearInterval(reminderTimer);
}, [medications]);

  // ═══════════════════════════════════════════════════════════
  //  HELPER: Generate user initials for avatar
  // ═══════════════════════════════════════════════════════════

  const getUserInitials = () => {
    if (!user || !user.fullName) return "SP";
    const parts = user.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // ═══════════════════════════════════════════════════════════
  //  LOADING SCREEN (while checking auth cookie)
  // ═══════════════════════════════════════════════════════════

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center", padding: "60px 40px" }}>
          <div className="auth-brand">
            <div className="brand-icon">✚</div>
            <div>
              <h2>SmartPill</h2>
              <span>Health Management System</span>
            </div>
          </div>
          <div className="spinner" style={{ margin: "30px auto" }}></div>
          <p style={{ color: "#8a94a5", fontSize: "13px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  IF NOT AUTHENTICATED → SHOW AUTH PAGE
  // ═══════════════════════════════════════════════════════════

  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ═══════════════════════════════════════════════════════════
  //  AUTHENTICATED → SHOW DASHBOARD (existing code preserved)
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="app">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">✚</div>

          <div>
            <h2>SmartPill</h2>
            <span>Health Management</span>
          </div>
        </div>

        <div className="profile-card">

          <div className="avatar">
            {getUserInitials()}
          </div>

          <div>
            <strong>{user.fullName}</strong>
            <span>Patient</span>
          </div>

          <span className="online-dot"></span>

        </div>

        <nav className="navigation">

          <p className="nav-title">
            MAIN MENU
          </p>

          {[
            ["Dashboard", "⌂"],
            ["Medications", "💊"],
            ["Medication History", "📋"],
            ["Schedule", "◷"],
            ["Adherence", "▥"],
            ["Health Records", "▤"],
          ].map(([name, icon]) => (

            <button
              key={name}
              className={`nav-item ${
                activePage === name ? "active" : ""
              }`}
              onClick={() => setActivePage(name)}
            >
              <span>{icon}</span>
              {name}
            </button>

          ))}

          <p className="nav-title settings-title">
            SYSTEM
          </p>

          <button
            className={`nav-item ${
              activePage === "Notifications"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Notifications")
            }
          >
            <span>◉</span>
            Notifications
            <b className="notification-count">
              3
            </b>
          </button>

          <button
            className={`nav-item ${
              activePage === "Settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage("Settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="support-box">

            <div className="support-icon">
              ?
            </div>

            <div>
              <strong>Need help?</strong>
              <span>Contact support</span>
            </div>

          </div>

          <button className="logout" onClick={handleLogout}>
            ⇥ &nbsp; Sign out
          </button>

        </div>

      </aside>

      {/* MAIN */}
      <main className="main">

        {/* TOPBAR */}
        <header className="topbar">

          <div>
            <p className="breadcrumb">
              Workspace / {activePage}
            </p>

            <h1>{activePage}</h1>
          </div>

          <div className="top-actions">

            <button className="icon-button">
              ⌕
            </button>

            <button className="notification-button">
              ♧
              <span></span>
            </button>

            <div className="user-mini">

              <div className="mini-avatar">
                {getUserInitials()}
              </div>

              <div>
                <strong>
                  {user.fullName}
                </strong>

                <small>
                  @{user.username}
                </small>
              </div>

              <span>⌄</span>

            </div>

          </div>

        </header>

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (

          <div className="content">

            <section className="welcome">

              <div>

                <span className="welcome-label">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).toUpperCase()}
                </span>

                <h2>
                  Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user.fullName}👋
                </h2>

                <p>
                  Here's your medication overview
                  for today.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={() =>
                  setShowAddMedicine(true)
                }
              >
                + Add Medication
              </button>

            </section>

            {/* STATS */}

            <section className="stats-grid">

              <div className="stat-card">

                <div className="stat-top">

                  <span className="stat-icon blue">
                    💊
                  </span>

                  <span className="trend">
                    Today
                  </span>

                </div>

                <h3>
                  {activeMedications.length}
                </h3>

                <p>
                  Scheduled Medications
                </p>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span className="stat-icon green">
                    ✓
                  </span>

                  <span className="trend green-text">
                    Live
                  </span>

                </div>

                <h3>
                  {adherence}%
                </h3>

                <p>
                  Medication Adherence
                </p>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span className="stat-icon orange">
                    ◷
                  </span>

                  <span className="trend">
                    Next
                  </span>

                </div>

                <h3>
                  {activeMedications.length > 0
                    ? formatTime(
                        activeMedications.find(
                          (m) =>
                            (m.adherenceStatus || m.status) !==
                            "Taken"
                        )?.time
                      ) || "--:--"
                    : "--:--"}
                </h3>

                <p>
                  Next Medication
                </p>

              </div>

              <div className="stat-card">

                <div className="stat-top">

                  <span className="stat-icon purple">
                    ▣
                  </span>

                  <span className="trend">
                    Active
                  </span>

                </div>

                <h3>
                  {activeMedications.length}
                </h3>

                <p>
                  Active Prescriptions
                </p>

              </div>

            </section>

            {/* MEDICATION + ADHERENCE */}

            <section className="dashboard-grid">

              <div className="panel medication-panel">

                <div className="panel-header">

                  <div>
                    <h3>
                      Today's Medications
                    </h3>

                    <p>
                      Track your medication
                      schedule
                    </p>
                  </div>

                  <button
                    className="view-button"
                    onClick={() =>
                      setActivePage(
                        "Medications"
                      )
                    }
                  >
                    View all →
                  </button>

                </div>

                <div className="medication-list">

                  {activeMedications.length === 0 && (
                    <div
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "#8a94a5",
                      }}
                    >
                      No active medications scheduled for today.
                    </div>
                  )}

                  {activeMedications.map((medicine) => (
                    <MedicationCard
                      key={medicine.id || medicine._id}
                      medication={{
                        ...medicine,
                        id: medicine.id || medicine._id,
                        dosage: medicine.dose || medicine.dosage,
                        time: formatTime(medicine.time),
                        status: medicine.adherenceStatus || (medicine.status === "Active" ? "Upcoming" : medicine.status),
                      }}
                      onTaken={takeMedication}
                      onDelete={handleDeleteMedication}
                    />
                  ))}
                </div>

              </div>

              {/* ADHERENCE */}

              <div className="panel adherence-panel">

                <div className="panel-header">

                  <div>
                    <h3>
                      Adherence
                    </h3>

                    <p>
                      Today's progress
                    </p>
                  </div>

                </div>

                <div className="circle-container">

                  <div
                    className="progress-circle"
                    style={{
                      background: `conic-gradient(
                        #2563eb 0deg ${
                          adherence * 3.6
                        }deg,
                        #e9eef5 ${
                          adherence * 3.6
                        }deg 360deg
                      )`,
                    }}
                  >

                    <div>

                      <strong>
                        {adherence}%
                      </strong>

                      <span>
                        Adherence
                      </span>

                    </div>

                  </div>

                </div>

                <div className="adherence-info">

                  <div>
                    <span className="legend-dot taken-dot"></span>
                    Taken
                    <strong>
                      {takenCount}
                    </strong>
                  </div>

                  <div>
                    <span className="legend-dot missed-dot"></span>
                    Remaining
                    <strong>
                      {medications.length -
                        takenCount}
                    </strong>
                  </div>

                </div>

                <div className="adherence-message">

                  <span>✓</span>

                  {adherence >= 80
                    ? "Excellent consistency today"
                    : "Keep taking your medications on time"}

                </div>

              </div>

            </section>

            {/* LOWER */}

            <section className="lower-grid">

              <div className="panel">

                <div className="panel-header">

                  <div>
                    <h3>
                      Upcoming Reminders
                    </h3>

                    <p>
                      Your next medication alerts
                    </p>
                  </div>

                </div>

                <div className="reminder-list">

                  {activeMedications
                    .filter(
                      (medicine) =>
                        (medicine.adherenceStatus || medicine.status) !==
                        "Taken"
                    )
                    .map((medicine) => (
                      <div
                        className="reminder"
                        key={medicine.id || medicine._id}
                      >
                        <div className="reminder-time">
                          <strong>
                            {formatTime(
                              medicine.time
                            )}
                          </strong>
                        </div>

                        <div className="reminder-line"></div>

                        <div className="reminder-details">
                          <strong>
                            {medicine.name}
                          </strong>

                          <span>
                            {medicine.dose || medicine.dosage}{" "}
                            {medicine.type}
                          </span>
                        </div>

                        <span className="reminder-badge">
                          Upcoming
                        </span>
                      </div>
                    ))}

                </div>

              </div>

              <div className="panel health-panel">

                <div className="panel-header">

                  <div>
                    <h3>
                      Health Overview
                    </h3>

                    <p>
                      Quick health indicators
                    </p>
                  </div>

                </div>

                <div className="health-item">

                  <div className="health-icon">
                    ❤
                  </div>

                  <div>
                    <strong>
                      Heart Rate
                    </strong>

                    <span>
                      Resting
                    </span>
                  </div>

                  <strong className="health-value">
                    72 <small>BPM</small>
                  </strong>

                </div>

                <div className="health-item">

                  <div className="health-icon">
                    ◉
                  </div>

                  <div>
                    <strong>
                      Blood Pressure
                    </strong>

                    <span>
                      Latest reading
                    </span>
                  </div>

                  <strong className="health-value">
                    120/80
                  </strong>

                </div>

                <div className="health-item">

                  <div className="health-icon">
                    ♨
                  </div>

                  <div>
                    <strong>
                      Temperature
                    </strong>

                    <span>
                      Normal range
                    </span>
                  </div>

                  <strong className="health-value">
                    36.7°C
                  </strong>

                </div>

              </div>

            </section>

          </div>

        )}

        {/* MEDICATIONS PAGE */}
        {activePage === "Medications" && (
          <MedicationsView
            medications={medications}
            onAddClick={() => setShowAddMedicine(true)}
            onEditClick={(med) => {
              const newDose = prompt(
                `Update dosage for ${med.name}:`,
                med.dose || med.dosage
              );
              if (newDose) {
                handleUpdateMedication(med.id || med._id, { dose: newDose });
              }
            }}
            onDelete={handleDeleteMedication}
            onUpdateStatus={(id, newStatus) =>
              handleUpdateMedication(id, { adherenceStatus: newStatus })
            }
            formatTime={formatTime}
          />
        )}

        {/* MEDICATION HISTORY PAGE */}
        {activePage === "Medication History" && (
          <MedicationHistoryView
            medications={medications}
            onAddMedication={handleAddMedication}
            onUpdateMedication={handleUpdateMedication}
            onDeleteMedication={handleDeleteMedication}
            formatTime={formatTime}
          />
        )}

        {/* OTHER PAGES */}
        {activePage !== "Dashboard" &&
          activePage !== "Medications" &&
          activePage !== "Medication History" && (
            <div className="placeholder-page">
              <div className="placeholder-icon">✦</div>
              <h2>{activePage}</h2>
              <p>
                This module is ready to be developed in the next stage of the
                SmartPill system.
              </p>
              <button
                className="primary-button"
                onClick={() => setActivePage("Dashboard")}
              >
                ← Back to Dashboard
              </button>
            </div>
          )}

      </main>

      {/* ADD MEDICATION MODAL */}

      {showAddMedicine && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowAddMedicine(false)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <h2>
                  Add Medication
                </h2>

                <p>
                  Create a new medication
                  reminder
                </p>

              </div>

              <button
                className="close-button"
                onClick={() =>
                  setShowAddMedicine(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={addMedication}>

              <label>
                Medication Name
              </label>

              <input
                value={newMedicine.name}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    name: e.target.value,
                  })
                }
                placeholder="e.g. Paracetamol"
              />

              <label>
                Dosage
              </label>

              <input
                value={newMedicine.dose}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    dose: e.target.value,
                  })
                }
                placeholder="e.g. 500 mg"
              />

              <label>
                Time
              </label>

              <input
                type="time"
                value={newMedicine.time}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    time: e.target.value,
                  })
                }
              />

              <label>
                Medication Type
              </label>

              <select
                value={newMedicine.type}
                onChange={(e) =>
                  setNewMedicine({
                    ...newMedicine,
                    type: e.target.value,
                  })
                }
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Injection</option>
              </select>

              <button
                type="submit"
                className="primary-button modal-button"
              >
                Save Medication
              </button>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;