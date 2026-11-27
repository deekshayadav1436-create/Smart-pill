import { useState, useMemo } from "react";

function MedicationsView({
  medications,
  onAddClick,
  onEditClick,
  onDelete,
  onUpdateStatus,
  formatTime,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredMedications = useMemo(() => {
    return medications.filter((medicine) => {
      const matchesSearch =
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (medicine.instructions &&
          medicine.instructions.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" ? true : medicine.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [medications, searchTerm, statusFilter]);

  const counts = {
    all: medications.length,
    upcoming: medications.filter((m) => m.status === "Upcoming").length,
    taken: medications.filter((m) => m.status === "Taken").length,
    missed: medications.filter((m) => m.status === "Missed").length,
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Taken":
        return <span className="status taken">✓ Taken</span>;
      case "Missed":
        return <span className="status missed">✕ Missed</span>;
      default:
        return <span className="status upcoming">◷ Upcoming</span>;
    }
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
    <div className="content">
      {/* HEADER SECTION */}
      <section className="welcome">
        <div>
          <span className="welcome-label">PRESCRIPTION MANAGEMENT</span>
          <h2>Medications</h2>
          <p>
            Add, update, track and manage your daily medications and dosages.
          </p>
        </div>
        <button className="primary-button" onClick={onAddClick}>
          + Add Medication
        </button>
      </section>

      {/* SUMMARY STATS BAR */}
      <section className="stats-grid" style={{ marginBottom: "22px" }}>
        <div className="stat-card" style={{ minHeight: "115px", padding: "14px 18px" }}>
          <div className="stat-top">
            <span className="stat-icon blue">💊</span>
            <span className="trend">Total</span>
          </div>
          <h3 style={{ marginTop: "10px" }}>{counts.all}</h3>
          <p>Registered Medicines</p>
        </div>

        <div className="stat-card" style={{ minHeight: "115px", padding: "14px 18px" }}>
          <div className="stat-top">
            <span className="stat-icon green">✓</span>
            <span className="trend green-text">Completed</span>
          </div>
          <h3 style={{ marginTop: "10px" }}>{counts.taken}</h3>
          <p>Doses Taken</p>
        </div>

        <div className="stat-card" style={{ minHeight: "115px", padding: "14px 18px" }}>
          <div className="stat-top">
            <span className="stat-icon orange">◷</span>
            <span className="trend">Scheduled</span>
          </div>
          <h3 style={{ marginTop: "10px" }}>{counts.upcoming}</h3>
          <p>Upcoming Doses</p>
        </div>

        <div className="stat-card" style={{ minHeight: "115px", padding: "14px 18px" }}>
          <div className="stat-top">
            <span className="stat-icon purple">✕</span>
            <span className="trend" style={{ background: "#fee2e2", color: "#dc2626" }}>
              Attention
            </span>
          </div>
          <h3 style={{ marginTop: "10px" }}>{counts.missed}</h3>
          <p>Missed Doses</p>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <div className="filter-controls-bar">
        <div className="search-box-wrapper">
          <span className="search-icon-symbol">⌕</span>
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search medications by name or instructions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-tabs">
          {[
            { label: "All", count: counts.all },
            { label: "Upcoming", count: counts.upcoming },
            { label: "Taken", count: counts.taken },
            { label: "Missed", count: counts.missed },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`filter-tab-btn ${
                statusFilter === tab.label ? "active" : ""
              }`}
              onClick={() => setStatusFilter(tab.label)}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* MEDICATION CARDS GRID */}
      {filteredMedications.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">💊</div>
          <h3>No medications found</h3>
          <p>
            {searchTerm || statusFilter !== "All"
              ? "No medicines match your current search or filter criteria."
              : "You have not added any medications yet. Click '+ Add Medication' to get started."}
          </p>
          {(searchTerm || statusFilter !== "All") && (
            <button
              className="view-button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("All");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="medications-grid">
          {filteredMedications.map((medicine) => (
            <div className="medication-detail-card" key={medicine.id}>
              <div className="card-top-row">
                <div className="med-title-wrap">
                  <div className="medicine-icon">
                    {getTypeIcon(medicine.type)}
                  </div>
                  <div>
                    <h4>{medicine.name}</h4>
                    <span className="med-subtext">
                      {medicine.dose || medicine.dosage} • {medicine.type}
                    </span>
                  </div>
                </div>
                {getStatusBadge(medicine.status)}
              </div>

              <div className="med-card-body">
                <div className="med-info-chip">
                  <span className="chip-label">Reminder Time</span>
                  <strong>{formatTime(medicine.time)}</strong>
                </div>
                <div className="med-info-chip">
                  <span className="chip-label">Frequency</span>
                  <strong>{medicine.frequency || "Daily"}</strong>
                </div>
              </div>

              {medicine.instructions && (
                <div className="med-instructions-box">
                  <span className="info-icon">ℹ</span>
                  <span>{medicine.instructions}</span>
                </div>
              )}

              <div className="med-card-footer">
                <div className="status-action-group">
                  <button
                    className={`status-btn ${
                      medicine.status === "Taken" ? "active-taken" : ""
                    }`}
                    onClick={() => onUpdateStatus(medicine.id, "Taken")}
                    title="Mark as Taken"
                  >
                    ✓ Taken
                  </button>
                  <button
                    className={`status-btn ${
                      medicine.status === "Missed" ? "active-missed" : ""
                    }`}
                    onClick={() => onUpdateStatus(medicine.id, "Missed")}
                    title="Mark as Missed"
                  >
                    ✕ Missed
                  </button>
                  {medicine.status !== "Upcoming" && (
                    <button
                      className="status-btn"
                      onClick={() => onUpdateStatus(medicine.id, "Upcoming")}
                      title="Reset to Upcoming"
                    >
                      ◷ Reset
                    </button>
                  )}
                </div>

                <div className="crud-action-group">
                  <button
                    className="icon-action-btn"
                    onClick={() => onEditClick(medicine)}
                    title="Edit Medication"
                  >
                    ✎
                  </button>
                  <button
                    className="icon-action-btn delete-btn"
                    onClick={() => onDelete(medicine.id)}
                    title="Delete Medication"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MedicationsView;
