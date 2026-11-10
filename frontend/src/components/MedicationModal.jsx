import { useState } from "react";

function MedicationModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || "",
    dose: initialData?.dose || initialData?.dosage || "",
    time: initialData?.time || "",
    frequency: initialData?.frequency || "Daily",
    type: initialData?.type || "Tablet",
    instructions: initialData?.instructions || "",
  }));

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.dose.trim() || !formData.time.trim()) {
      alert("Please enter the medication name, dosage, and reminder time.");
      return;
    }

    onSave({
      ...formData,
      id: initialData ? initialData.id : Date.now(),
      status: initialData ? initialData.status : "Upcoming",
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{initialData ? "Edit Medication" : "Add Medication"}</h2>
            <p>
              {initialData
                ? "Update your prescription and schedule details"
                : "Create a new medication reminder"}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Medication Name</label>
          <input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g. Paracetamol, Metformin"
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label>Dosage</label>
              <input
                value={formData.dose}
                onChange={(e) =>
                  setFormData({ ...formData, dose: e.target.value })
                }
                placeholder="e.g. 500 mg, 10 ml"
                required
              />
            </div>
            <div>
              <label>Reminder Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label>Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value })
                }
              >
                <option>Daily</option>
                <option>Twice Daily</option>
                <option>Thrice Daily</option>
                <option>Weekly</option>
                <option>As Needed</option>
              </select>
            </div>
            <div>
              <label>Medication Type</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Injection</option>
                <option>Drops</option>
                <option>Inhaler</option>
              </select>
            </div>
          </div>

          <label>Instructions / Notes</label>
          <input
            value={formData.instructions}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
            placeholder="e.g. Take after meal with water"
          />

          <button type="submit" className="primary-button modal-button">
            {initialData ? "Save Changes" : "Save Medication"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default MedicationModal;
