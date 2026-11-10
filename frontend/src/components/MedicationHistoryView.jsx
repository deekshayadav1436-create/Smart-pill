import { useState, useMemo } from "react";

function MedicationHistoryView({
  medications,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  formatTime,
}) {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "active" | "history"
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [discontinueTarget, setDiscontinueTarget] = useState(null); // medication being moved to history
  const [discontinueForm, setDiscontinueForm] = useState({
    endDate: new Date().toISOString().split("T")[0],
    reason: "Treatment course completed",
    customReason: "",
  });

  const [addForm, setAddForm] = useState({
    name: "",
    dose: "",
    type: "Tablet",
    frequency: "Daily",
    time: "08:00",
    status: "Active", // "Active" | "Completed" | "Discontinued"
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    prescribedBy: "",
    discontinueReason: "",
    instructions: "",
  });

  // Categorize medications
  const activeMedications = useMemo(() => {
    return medications.filter((m) => m.status === "Active" || !m.status);
  }, [medications]);

  const historyMedications = useMemo(() => {
    return medications.filter(
      (m) => m.status === "Completed" || m.status === "Discontinued" || m.status === "History"
    );
  }, [medications]);

  // Filtered based on active tab and search query
  const displayedMedications = useMemo(() => {
    let list = medications;
    if (activeTab === "active") {
      list = activeMedications;
    } else if (activeTab === "history") {
      list = historyMedications;
    }

    if (!searchTerm.trim()) return list;

    const query = searchTerm.toLowerCase();
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.prescribedBy?.toLowerCase().includes(query) ||
        m.discontinueReason?.toLowerCase().includes(query) ||
        m.instructions?.toLowerCase().includes(query) ||
        m.type?.toLowerCase().includes(query)
    );
  }, [medications, activeMedications, historyMedications, activeTab, searchTerm]);

  // Open Discontinue / Move to History modal
  const handleOpenDiscontinue = (medicine) => {
    setDiscontinueTarget(medicine);
    setDiscontinueForm({
      endDate: new Date().toISOString().split("T")[0],
      reason: "Treatment course completed",
      customReason: "",
    });
  };

  // Submit Discontinue
  const handleConfirmDiscontinue = (e) => {
    e.preventDefault();
    if (!discontinueTarget) return;

    const finalReason =
      discontinueForm.reason === "Other"
        ? discontinueForm.customReason.trim() || "Discontinued as per medical advice"
        : discontinueForm.reason;

    onUpdateMedication(discontinueTarget.id || discontinueTarget._id, {
      status: "Discontinued",
      endDate: discontinueForm.endDate || new Date().toISOString().split("T")[0],
      discontinueReason: finalReason,
    });

    setDiscontinueTarget(null);
  };

  // Reactivate a past medication
  const handleReactivate = (medicine) => {
    const confirm = window.confirm(
      `Reactivate "${medicine.name}" as a currently active medication?`
    );
    if (!confirm) return;

    onUpdateMedication(medicine.id || medicine._id, {
      status: "Active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      discontinueReason: "",
    });
  };

  // Submit Add Medication
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.dose.trim()) {
      alert("Please enter both medication name and dosage.");
      return;
    }

    onAddMedication({
      name: addForm.name.trim(),
      dose: addForm.dose.trim(),
      type: addForm.type,
      frequency: addForm.frequency,
      time: addForm.time,
      status: addForm.status,
      startDate: addForm.startDate,
      endDate: addForm.status === "Active" ? "" : (addForm.endDate || new Date().toISOString().split("T")[0]),
      prescribedBy: addForm.prescribedBy.trim() || "General Physician",
      discontinueReason: addForm.status === "Active" ? "" : addForm.discontinueReason.trim(),
      instructions: addForm.instructions.trim(),
      adherenceStatus: "Upcoming",
    });

    setShowAddModal(false);
    setAddForm({
      name: "",
      dose: "",
      type: "Tablet",
      frequency: "Daily",
      time: "08:00",
      status: "Active",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      prescribedBy: "",
      discontinueReason: "",
      instructions: "",
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Capsule":
        return "💊";
      case "Syrup":
        return "🧪";
      case "Injection":
        return "💉";
      case "Drops":
        return "💧";
      case "Inhaler":
        return "💨";
      default:
        return "💊";
    }
  };

  return (
    <div className="content medication-history-view">
      {/* HEADER SECTION */}
      <section className="welcome">
        <div>
          <span className="welcome-label">PRESCRIPTION AUDIT & ARCHIVES</span>
          <h2>Medication History</h2>
          <p>
            Track medications you are taking right now and review complete records
            of previously used medications.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowAddModal(true)}
        >
          + Add Prescription / History
        </button>
      </section>

      {/* SUMMARY STATS GRID */}
      <section className="stats-grid" style={{ marginBottom: "22px" }}>
        <div
          className="stat-card"
          onClick={() => setActiveTab("active")}
          style={{ cursor: "pointer", borderColor: activeTab === "active" ? "#2563eb" : "#edf0f5" }}
        >
          <div className="stat-top">
            <span className="stat-icon blue">🟢</span>
            <span className="trend">Taking Now</span>
          </div>
          <h3>{activeMedications.length}</h3>
          <p>Currently Active Medications</p>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("history")}
          style={{ cursor: "pointer", borderColor: activeTab === "history" ? "#2563eb" : "#edf0f5" }}
        >
          <div className="stat-top">
            <span className="stat-icon purple">⚪</span>
            <span className="trend">Archive</span>
          </div>
          <h3>{historyMedications.length}</h3>
          <p>Past / Completed Medications</p>
        </div>

        <div
          className="stat-card"
          onClick={() => setActiveTab("all")}
          style={{ cursor: "pointer", borderColor: activeTab === "all" ? "#2563eb" : "#edf0f5" }}
        >
          <div className="stat-top">
            <span className="stat-icon green">📋</span>
            <span className="trend green-text">Total</span>
          </div>
          <h3>{medications.length}</h3>
          <p>All-Time Prescriptions Logged</p>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <div className="filter-controls-bar">
        <div className="search-box-wrapper">
          <span className="search-icon-symbol">⌕</span>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search by medicine, doctor, reason, or instructions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All ({medications.length})
          </button>
          <button
            className={`filter-tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            🟢 Currently Taking ({activeMedications.length})
          </button>
          <button
            className={`filter-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            ⚪ Past Medications ({historyMedications.length})
          </button>
        </div>
      </div>

      {/* LIST OF MEDICATION HISTORY CARDS */}
      {displayedMedications.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">📋</div>
          <h3>No medications found in this category</h3>
          <p>
            {searchTerm
              ? "No medication history matched your search keywords."
              : activeTab === "history"
              ? "You do not have any past or discontinued medications logged yet. When you complete or stop a medication, use 'Move to History' to archive it."
              : "No medications currently registered. Click '+ Add Prescription / History' to record one."}
          </p>
          {(searchTerm || activeTab !== "all") && (
            <button
              className="view-button"
              onClick={() => {
                setSearchTerm("");
                setActiveTab("all");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="history-cards-grid">
          {displayedMedications.map((item) => {
            const isActive = item.status === "Active" || !item.status;
            const itemId = item.id || item._id;

            return (
              <div
                key={itemId}
                className={`history-card ${isActive ? "card-active-med" : "card-past-med"}`}
              >
                {/* CARD HEADER */}
                <div className="history-card-header">
                  <div className="history-title-wrap">
                    <span className="history-type-icon">{getTypeIcon(item.type)}</span>
                    <div>
                      <h4>{item.name}</h4>
                      <span className="history-sub">
                        {item.dose || item.dosage} • {item.type || "Tablet"}
                      </span>
                    </div>
                  </div>

                  <span className={`history-status-badge ${isActive ? "badge-active" : "badge-history"}`}>
                    {isActive ? "🟢 Currently Active" : "⚪ Past / Discontinued"}
                  </span>
                </div>

                {/* TIMELINE METADATA */}
                <div className="history-timeline-bar">
                  <div className="timeline-col">
                    <span className="col-label">Prescription Start</span>
                    <strong>{item.startDate || "Not recorded"}</strong>
                  </div>

                  <div className="timeline-arrow">⟶</div>

                  <div className="timeline-col">
                    <span className="col-label">
                      {isActive ? "Status" : "Ended / Completed"}
                    </span>
                    <strong className={isActive ? "text-ongoing" : ""}>
                      {isActive ? "Ongoing Regimen" : item.endDate || "Completed"}
                    </strong>
                  </div>
                </div>

                {/* DETAILS GRID */}
                <div className="history-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Schedule / Frequency</span>
                    <span>
                      {item.frequency || "Daily"}{" "}
                      {item.time ? `(${formatTime ? formatTime(item.time) : item.time})` : ""}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Prescribed By</span>
                    <span>{item.prescribedBy || "Primary Care Physician"}</span>
                  </div>
                </div>

                {/* DISCONTINUATION REASON (IF PAST MEDICATION) */}
                {!isActive && item.discontinueReason && (
                  <div className="history-reason-box">
                    <span className="reason-label">Reason for Stopping:</span>
                    <p>{item.discontinueReason}</p>
                  </div>
                )}

                {/* INSTRUCTIONS */}
                {item.instructions && (
                  <div className="history-instructions">
                    <span className="info-icon">ℹ</span>
                    <span>{item.instructions}</span>
                  </div>
                )}

                {/* CARD ACTIONS */}
                <div className="history-card-actions">
                  {isActive ? (
                    <button
                      className="history-action-btn discontinue-btn"
                      onClick={() => handleOpenDiscontinue(item)}
                      title="Mark as finished or stopped and move to medical history"
                    >
                      📁 Move to History / Discontinue
                    </button>
                  ) : (
                    <button
                      className="history-action-btn reactivate-btn"
                      onClick={() => handleReactivate(item)}
                      title="Resume taking this medication as part of your current active prescriptions"
                    >
                      🔄 Reactivate as Current Medicine
                    </button>
                  )}

                  <button
                    className="icon-action-btn delete-btn"
                    onClick={() => {
                      if (window.confirm(`Delete record for "${item.name}"?`)) {
                        onDeleteMedication(itemId);
                      }
                    }}
                    title="Delete record"
                  >
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DISCONTINUE / MOVE TO HISTORY MODAL */}
      {discontinueTarget && (
        <div className="modal-overlay" onClick={() => setDiscontinueTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Move to Past Medication History</h2>
                <p>
                  Record why and when you stopped taking <strong>{discontinueTarget.name}</strong>.
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setDiscontinueTarget(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleConfirmDiscontinue}>
              <label>Date Discontinued / Completed</label>
              <input
                type="date"
                value={discontinueForm.endDate}
                onChange={(e) =>
                  setDiscontinueForm({
                    ...discontinueForm,
                    endDate: e.target.value,
                  })
                }
                required
              />

              <label>Reason for Stopping</label>
              <select
                value={discontinueForm.reason}
                onChange={(e) =>
                  setDiscontinueForm({
                    ...discontinueForm,
                    reason: e.target.value,
                  })
                }
              >
                <option value="Treatment course completed">
                  Treatment course completed (e.g. Antibiotics course done)
                </option>
                <option value="Doctor adjusted / changed medication">
                  Doctor adjusted or changed medication
                </option>
                <option value="Condition resolved / cured">
                  Condition resolved / Symptoms subsided
                </option>
                <option value="Adverse side effects">
                  Adverse side effects or intolerance
                </option>
                <option value="Dosage updated">
                  Replaced with higher/lower dosage
                </option>
                <option value="Other">Other (specify below)</option>
              </select>

              {discontinueForm.reason === "Other" && (
                <div>
                  <label>Specify Reason</label>
                  <input
                    type="text"
                    placeholder="Enter specific doctor instruction or reason"
                    value={discontinueForm.customReason}
                    onChange={(e) =>
                      setDiscontinueForm({
                        ...discontinueForm,
                        customReason: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}

              <button type="submit" className="primary-button modal-button">
                Archive to Medication History
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEDICATION OR PAST HISTORY MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Add Prescription / History Record</h2>
                <p>Log a currently active medicine or add a past medication to your record.</p>
              </div>
              <button className="close-button" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <label>Record Classification</label>
              <div className="radio-pill-group">
                <button
                  type="button"
                  className={`radio-pill ${addForm.status === "Active" ? "active" : ""}`}
                  onClick={() => setAddForm({ ...addForm, status: "Active" })}
                >
                  🟢 Currently Taking (Active)
                </button>
                <button
                  type="button"
                  className={`radio-pill ${addForm.status === "Discontinued" ? "active" : ""}`}
                  onClick={() => setAddForm({ ...addForm, status: "Discontinued" })}
                >
                  ⚪ Past / Discontinued Medication
                </button>
              </div>

              <label>Medication Name</label>
              <input
                type="text"
                placeholder="e.g. Metformin, Lisinopril, Azithromycin"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg, 10 ml"
                    value={addForm.dose}
                    onChange={(e) => setAddForm({ ...addForm, dose: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label>Medication Type</label>
                  <select
                    value={addForm.type}
                    onChange={(e) => setAddForm({ ...addForm, type: e.target.value })}
                  >
                    <option>Tablet</option>
                    <option>Capsule</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                    <option>Drops</option>
                    <option>Inhaler</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Frequency</label>
                  <select
                    value={addForm.frequency}
                    onChange={(e) => setAddForm({ ...addForm, frequency: e.target.value })}
                  >
                    <option>Daily</option>
                    <option>Twice Daily</option>
                    <option>Thrice Daily</option>
                    <option>Weekly</option>
                    <option>As Needed</option>
                  </select>
                </div>
                <div>
                  <label>Reminder Time</label>
                  <input
                    type="time"
                    value={addForm.time}
                    onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={addForm.startDate}
                    onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label>Prescribed By (Doctor/Hospital)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Rajesh Sharma"
                    value={addForm.prescribedBy}
                    onChange={(e) => setAddForm({ ...addForm, prescribedBy: e.target.value })}
                  />
                </div>
              </div>

              {addForm.status !== "Active" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label>End Date</label>
                      <input
                        type="date"
                        value={addForm.endDate}
                        onChange={(e) => setAddForm({ ...addForm, endDate: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label>Reason for Stopping</label>
                      <input
                        type="text"
                        placeholder="e.g. Course finished, switched drug"
                        value={addForm.discontinueReason}
                        onChange={(e) =>
                          setAddForm({ ...addForm, discontinueReason: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <label>Special Instructions / Notes</label>
              <input
                type="text"
                placeholder="e.g. Take after meals with warm water"
                value={addForm.instructions}
                onChange={(e) => setAddForm({ ...addForm, instructions: e.target.value })}
              />

              <button type="submit" className="primary-button modal-button">
                {addForm.status === "Active" ? "Save Active Medication" : "Save to History Records"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicationHistoryView;
