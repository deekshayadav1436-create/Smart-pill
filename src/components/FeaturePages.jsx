import React, { useEffect, useState } from "react";

export default function FeaturePages({
  activePage,
  medications = [],
  onUpdateMedication,
  formatTime,
  getAuthHeaders,
}) {
  const [notifications, setNotifications] = useState([]);
  const [adherenceLogs, setAdherenceLogs] = useState([]);
  const [records, setRecords] = useState([]);
  const [settings, setSettings] = useState({
    reminder_enabled: true,
    email_notifications: true,
    theme: "light",
  });
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [recordType, setRecordType] = useState("General");
  const [recordTitle, setRecordTitle] = useState("");
  const [recordDescription, setRecordDescription] = useState("");
  const [recordDate, setRecordDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const request = async (url, options = {}) => {
    const authHeaders = typeof getAuthHeaders === "function"
      ? getAuthHeaders()
      : {};

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        ...authHeaders,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  const loadPageData = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (activePage === "Notifications") {
        setNotifications(await request("/api/notifications"));
      } else if (activePage === "Adherence") {
        setAdherenceLogs(await request("/api/adherence"));
      } else if (activePage === "Settings") {
        setSettings(await request("/api/settings"));
      } else if (activePage === "Health Records") {
        setRecords(await request("/api/health-records"));
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, [activePage]);

  const createNotification = async (event) => {
    event.preventDefault();
    try {
      const created = await request("/api/notifications", {
        method: "POST",
        body: JSON.stringify({
          title: notificationTitle,
          message: notificationMessage,
          type: "general",
        }),
      });
      setNotifications((previous) => [created, ...previous]);
      setNotificationTitle("");
      setNotificationMessage("");
      setMessage("Notification created successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      const updated = await request(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
      setNotifications((previous) =>
        previous.map((item) => item.id === id ? updated : item)
      );
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await request(`/api/notifications/${id}`, { method: "DELETE" });
      setNotifications((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      const saved = await request("/api/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(saved);
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const createHealthRecord = async (event) => {
    event.preventDefault();
    try {
      const created = await request("/api/health-records", {
        method: "POST",
        body: JSON.stringify({
          record_type: recordType,
          title: recordTitle,
          description: recordDescription,
          record_date: recordDate,
        }),
      });
      setRecords((previous) => [created, ...previous]);
      setRecordTitle("");
      setRecordDescription("");
      setMessage("Health record saved successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteHealthRecord = async (id) => {
    try {
      await request(`/api/health-records/${id}`, { method: "DELETE" });
      setRecords((previous) => previous.filter((record) => record.id !== id));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const markMedicationTaken = async (medicine) => {
    const id = medicine.id || medicine._id;

    if (onUpdateMedication) {
      await onUpdateMedication(id, { adherenceStatus: "Taken" });
    }

    if (Number.isInteger(Number(id)) && String(id).trim() !== "") {
      try {
        const log = await request("/api/adherence", {
          method: "POST",
          body: JSON.stringify({
            medication_id: Number(id),
            scheduled_time: new Date().toISOString(),
            status: "taken",
          }),
        });
        setAdherenceLogs((previous) => [log, ...previous]);
      } catch (error) {
        setMessage(
          "Medication updated locally, but adherence log could not be saved: " +
          error.message
        );
      }
    } else {
      setMessage("Medication status updated. This sample medication is not linked to a database record.");
    }
  };

  const activeMeds = medications.filter(
    (medicine) => medicine.status === "Active" || !medicine.status
  );

  const pageTitle = {
    Schedule: "Medication Schedule",
    Adherence: "Medication Adherence",
    Notifications: "Notifications",
    Settings: "Settings",
    "Health Records": "Health Records",
  }[activePage];

  const panelStyle = {
    background: "var(--panel-bg, #fff)",
    border: "1px solid var(--border-color, #e5e7eb)",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "18px",
  };

  const fieldStyle = {
    display: "block",
    width: "100%",
    maxWidth: "520px",
    padding: "10px",
    margin: "8px 0 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    padding: "9px 15px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    marginRight: "8px",
    marginTop: "8px",
  };

  return (
    <section className="content">
      <div className="panel" style={panelStyle}>
        <div className="panel-header">
          <div>
            <h3>{pageTitle}</h3>
            <p>Manage your SmartPill health information</p>
          </div>
          <button
            className="view-button"
            onClick={loadPageData}
            type="button"
          >
            ↻ Refresh
          </button>
        </div>

        {loading && <p>Loading information...</p>}
        {message && (
          <p role="status" style={{ margin: "12px 0", color: "#2563eb" }}>
            {message}
          </p>
        )}
      </div>

      {activePage === "Schedule" && (
        <div className="panel" style={panelStyle}>
          <h3>Today's Medication Schedule</h3>
          {activeMeds.length === 0 && <p>No active medications found.</p>}
          {[...activeMeds]
            .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
            .map((medicine) => (
              <div
                className="reminder"
                key={medicine.id || medicine._id}
                style={{ padding: "14px 0", borderBottom: "1px solid #e5e7eb" }}
              >
                <div className="reminder-time">
                  <strong>{formatTime ? formatTime(medicine.time) : medicine.time}</strong>
                </div>
                <div className="reminder-details">
                  <strong>{medicine.name}</strong>
                  <span>{medicine.dose || medicine.dosage} · {medicine.frequency || "Daily"}</span>
                </div>
                <span className="reminder-badge">
                  {medicine.adherenceStatus || "Upcoming"}
                </span>
                {(medicine.adherenceStatus || "").toLowerCase() !== "taken" && (
                  <button
                    className="primary-button"
                    style={buttonStyle}
                    onClick={() => markMedicationTaken(medicine)}
                  >
                    Mark Taken
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {activePage === "Adherence" && (
        <>
          <div className="panel" style={panelStyle}>
            <h3>Adherence Overview</h3>
            <p>
              {activeMeds.filter((medicine) =>
                (medicine.adherenceStatus || "").toLowerCase() === "taken"
              ).length} of {activeMeds.length} active medications marked as taken.
            </p>
            <h2>
              {activeMeds.length
                ? Math.round(
                    activeMeds.filter((medicine) =>
                      (medicine.adherenceStatus || "").toLowerCase() === "taken"
                    ).length / activeMeds.length * 100
                  )
                : 0}%
            </h2>
            <p>Current medication completion rate</p>
          </div>

          <div className="panel" style={panelStyle}>
            <h3>Medication Adherence History</h3>
            {adherenceLogs.length === 0 && <p>No saved adherence logs yet.</p>}
            {adherenceLogs.map((log) => (
              <div key={log.id} style={{ padding: "12px 0", borderBottom: "1px solid #e5e7eb" }}>
                <strong>{log.medication_name || `Medication #${log.medication_id}`}</strong>
                <p>{log.status} · {new Date(log.scheduled_time).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {activePage === "Notifications" && (
        <>
          <div className="panel" style={panelStyle}>
            <h3>Create Notification</h3>
            <form onSubmit={createNotification}>
              <label>Title</label>
              <input
                style={fieldStyle}
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                required
                placeholder="Notification title"
              />
              <label>Message</label>
              <textarea
                style={fieldStyle}
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                required
                placeholder="Write your notification"
                rows="3"
              />
              <button className="primary-button" type="submit">Create Notification</button>
            </form>
          </div>

          <div className="panel" style={panelStyle}>
            <h3>Your Notifications ({notifications.length})</h3>
            {notifications.length === 0 && <p>No notifications available.</p>}
            {notifications.map((item) => (
              <div key={item.id} style={{ padding: "14px 0", borderBottom: "1px solid #e5e7eb" }}>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.created_at).toLocaleString()}</small>
                <p>{item.is_read ? "Read" : "Unread"}</p>
                {!item.is_read && (
                  <button
                    style={buttonStyle}
                    onClick={() => markNotificationRead(item.id)}
                  >
                    Mark Read
                  </button>
                )}
                <button
                  style={buttonStyle}
                  onClick={() => deleteNotification(item.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {activePage === "Settings" && (
        <div className="panel" style={panelStyle}>
          <h3>Application Settings</h3>
          <form onSubmit={saveSettings}>
            <label>
              <input
                type="checkbox"
                checked={!!settings.reminder_enabled}
                onChange={(event) => setSettings({
                  ...settings,
                  reminder_enabled: event.target.checked,
                })}
              />{" "}
              Enable medication reminders
            </label>
            <br /><br />
            <label>
              <input
                type="checkbox"
                checked={!!settings.email_notifications}
                onChange={(event) => setSettings({
                  ...settings,
                  email_notifications: event.target.checked,
                })}
              />{" "}
              Enable email notifications
            </label>
            <br /><br />
            <label>Theme preference</label>
            <select
              style={fieldStyle}
              value={settings.theme || "light"}
              onChange={(event) => setSettings({
                ...settings,
                theme: event.target.value,
              })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <button className="primary-button" type="submit">Save Settings</button>
          </form>
        </div>
      )}

      {activePage === "Health Records" && (
        <>
          <div className="panel" style={panelStyle}>
            <h3>Add Health Record</h3>
            <form onSubmit={createHealthRecord}>
              <label>Record Type</label>
              <select
                style={fieldStyle}
                value={recordType}
                onChange={(event) => setRecordType(event.target.value)}
              >
                <option>General</option>
                <option>Blood Test</option>
                <option>Prescription</option>
                <option>Diagnosis</option>
                <option>Vitals</option>
                <option>Other</option>
              </select>
              <label>Title</label>
              <input
                style={fieldStyle}
                value={recordTitle}
                onChange={(event) => setRecordTitle(event.target.value)}
                required
                placeholder="Record title"
              />
              <label>Description</label>
              <textarea
                style={fieldStyle}
                value={recordDescription}
                onChange={(event) => setRecordDescription(event.target.value)}
                rows="3"
                placeholder="Record details"
              />
              <label>Record Date</label>
              <input
                style={fieldStyle}
                type="date"
                value={recordDate}
                onChange={(event) => setRecordDate(event.target.value)}
                required
              />
              <button className="primary-button" type="submit">Save Health Record</button>
            </form>
          </div>

          <div className="panel" style={panelStyle}>
            <h3>Saved Health Records</h3>
            {records.length === 0 && <p>No health records saved yet.</p>}
            {records.map((record) => (
              <div key={record.id} style={{ padding: "14px 0", borderBottom: "1px solid #e5e7eb" }}>
                <strong>{record.title}</strong>
                <p>{record.record_type} · {record.record_date}</p>
                <p>{record.description}</p>
                <button
                  style={buttonStyle}
                  onClick={() => deleteHealthRecord(record.id)}
                >
                  Delete Record
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
