import { useEffect, useState } from "react";
import api from "../api";

const enumOptions = {
  planting_method: ["polythene", "bed"],
  payment_method: ["online", "cash", "cheque"],
  type: {
    material_transaction: ["purchase", "government_supply"],
    plant_outward: ["government_challan", "private_sale", "hq_order"],
  },
};

function labelFor(name) {
  return name.replaceAll("_", " ").replace(/w/g, (c) => c.toUpperCase());
}

export default function EditModal({ entityType, recordId, onClose, onSaved }) {
  const [record, setRecord] = useState(null);
  const [values, setValues] = useState({});
  const [history, setHistory] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [editor, setEditor] = useState({ name: "", email: "", mobile: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([
      api.getEditableRecord(entityType, recordId),
      api.editHistory(entityType, recordId),
    ])
      .then(([data, audit]) => {
        setRecord(data);
        setValues(
          Object.fromEntries(data.fields.map((field) => [field.name, field.value ?? ""]))
        );
        setHistory(audit);
      })
      .catch((err) => setMessage(err.userMessage || "Failed to load record."))
      .finally(() => setLoading(false));
  }, [entityType, recordId]);

  function change(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function optionsFor(field) {
    if (field.name === "type" && typeof enumOptions.type === "object") {
      return enumOptions.type[entityType] || [];
    }
    return enumOptions[field.name] || [];
  }

  async function save() {
    if (!confirmed) {
      setMessage("Please confirm that you are editing this record.");
      return;
    }
    if (!editor.name.trim() || !editor.email.trim() || !editor.mobile.trim()) {
      setMessage("Enter editor name, email and mobile number.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await api.updateRecord(entityType, recordId, {
        confirmed,
        editor_name: editor.name,
        editor_email: editor.email,
        editor_mobile: editor.mobile,
        values,
      });
      onSaved?.();
      onClose();
    } catch (err) {
      setMessage(err.userMessage || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="rounded-xl bg-white p-6 shadow-xl">Loading record...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <p className="text-sm text-red-600">{message || "Record could not be loaded."}</p>
          <button onClick={onClose} className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-white">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="mx-auto my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Edit Record</h2>
            <p className="text-xs text-slate-500">Record #{record.record_id}</p>
          </div>
          <button onClick={onClose} className="text-xl text-slate-400 hover:text-slate-700">×</button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          {record.fields.map((field) => {
            const options = optionsFor(field);
            const type = field.type.startsWith("date") ? "date" : field.type.startsWith("number") ? "number" : "text";

            return (
              <label key={field.name} className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">{labelFor(field.name)}</span>
                {options.length ? (
                  <select
                    value={values[field.name] ?? ""}
                    onChange={(e) => change(field.name, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
                  >
                    {field.type.includes("|null") && <option value="">Not specified</option>}
                    {options.map((option) => <option key={option} value={option}>{labelFor(option)}</option>)}
                  </select>
                ) : (
                  <input
                    type={type}
                    step={type === "number" ? "0.01" : undefined}
                    value={values[field.name] ?? ""}
                    onChange={(e) => change(field.name, e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-5">
          <h3 className="font-semibold text-slate-800">Edit confirmation</h3>
          <label className="mt-3 flex items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm text-slate-700">
              I am editing this record and confirm that the information below identifies the person making this change.
            </span>
          </label>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              ["name", "Editor Name"],
              ["email", "Email"],
              ["mobile", "Mobile Number"],
            ].map(([key, label]) => (
              <label key={key}>
                <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
                <input
                  value={editor[key]}
                  onChange={(e) => setEditor({ ...editor, [key]: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>

          {history.length > 0 && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-700">Previous edits</h3>
              <div className="mt-2 max-h-32 space-y-2 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="rounded-lg bg-white p-3 text-xs text-slate-600">
                    <strong>{item.editor_name}</strong> · {item.editor_email} · {item.editor_mobile}
                    <div className="mt-1">{new Date(item.edited_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

          <div className="mt-5 flex justify-end gap-3">
            <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving || !confirmed}
              className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
