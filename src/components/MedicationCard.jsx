function MedicationCard({ medication, onTaken, onMissed, onEdit, onDelete }) {
  const getStatusBadge = () => {
    switch (medication.status) {
      case "Taken":
        return <div className="status taken">✓ Taken</div>;
      case "Missed":
        return <div className="status missed">✕ Missed</div>;
      default:
        return <div className="status upcoming">◷ Upcoming</div>;
    }
  };

  return (
    <div className="medicine-row" key={medication.id}>
      <div className="medicine-icon">💊</div>

      <div className="medicine-info">
        <strong>{medication.name}</strong>
        <span>
          {medication.dosage || medication.dose}
          {" • "}
          {medication.type}
          {medication.frequency ? ` • ${medication.frequency}` : ""}
        </span>
      </div>

      <div className="medicine-time">
        <strong>{medication.time}</strong>
        <span>Today</span>
      </div>

      {getStatusBadge()}

      <div className="card-actions">
        {medication.status !== "Taken" && onTaken && (
          <button
            className="action-btn take-btn"
            onClick={() => onTaken(medication.id)}
            title="Mark as Taken"
          >
            Take
          </button>
        )}

        {medication.status === "Upcoming" && onMissed && (
          <button
            className="action-btn miss-btn"
            onClick={() => onMissed(medication.id)}
            title="Mark as Missed"
          >
            Miss
          </button>
        )}

        {onEdit && (
          <button
            className="action-btn edit-btn"
            onClick={() => onEdit(medication)}
            title="Edit Medication"
          >
            ✎
          </button>
        )}

        {onDelete && (
          <button
            className="more-button"
            onClick={() => onDelete(medication.id)}
            title="Delete medication"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default MedicationCard;