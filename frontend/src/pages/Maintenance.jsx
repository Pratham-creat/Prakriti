import { useEffect, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

export default function Maintenance() {
  const [plantations, setPlantations] = useState([]);
  const [maintenance, setMaintenance] = useState([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    plantation_id: "",
    species_id: "",
    planting_method: "",
    quantity_covered: "",
    activity: "",
    labour_used: "",
    cost: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [plantationRes, maintenanceRes] = await Promise.all([
        api.get("/plantations"),
        api.get("/maintenance"),
      ]);

      setPlantations(plantationRes.data);
      setMaintenance(maintenanceRes.data);
    } catch (err) {
      setError("Failed to load maintenance data.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const selectPlantation = (e) => {
    const plantationId = e.target.value;

    const plantation = plantations.find(
      (item) => String(item.id) === plantationId
    );

    if (!plantation) {
      setForm({
        ...form,
        plantation_id: "",
        species_id: "",
        planting_method: "",
      });
      return;
    }

    setForm({
      ...form,
      plantation_id: plantationId,
      species_id: plantation.species_id,
      planting_method: plantation.planting_method,
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/maintenance", {
        date: form.date,
        plantation_id: Number(form.plantation_id),
        species_id: Number(form.species_id),
        planting_method: form.planting_method,
        quantity_covered: Number(form.quantity_covered),
        activity: form.activity,
        labour_used: form.labour_used ? Number(form.labour_used) : null,
        cost: form.cost ? Number(form.cost) : 0,
        remarks: form.remarks,
      });

      setForm({
        date: new Date().toISOString().split("T")[0],
        plantation_id: "",
        species_id: "",
        planting_method: "",
        quantity_covered: "",
        activity: "",
        labour_used: "",
        cost: "",
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to save maintenance record."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Maintenance</h1>
        <p className="text-sm text-slate-500">
          Record maintenance activities on existing plantation batches.
        </p>
      </div>

      <Section title="Add Maintenance Record">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Field
            label="Date"
            type="date"
            name="date"
            value={form.date}
            onChange={change}
            required
          />

          <Field
            as="select"
            label="Plantation Batch"
            name="plantation_id"
            value={form.plantation_id}
            onChange={selectPlantation}
            required
          >
            <option value="">Select Plantation</option>
            {plantations.map((item) => (
              <option key={item.id} value={item.id}>
                #{item.id} — {item.species_name || `Species ${item.species_id}`}{" "}
                — {item.quantity}
              </option>
            ))}
          </Field>

          <Field
            label="Planting Method"
            name="planting_method"
            value={form.planting_method}
            readOnly
          />

          <Field
            label="Quantity Covered"
            type="number"
            min="1"
            name="quantity_covered"
            value={form.quantity_covered}
            onChange={change}
            required
          />

          <Field
            label="Activity"
            name="activity"
            value={form.activity}
            onChange={change}
            placeholder="e.g. Weeding"
            required
          />

          <Field
            label="Labour Used"
            name="labour_used"
            value={form.labour_used}
            onChange={change}
            placeholder="Optional"
          />

          <Field
            label="Cost"
            type="number"
            min="0"
            name="cost"
            value={form.cost}
            onChange={change}
          />

          <Field
            label="Remarks"
            name="remarks"
            value={form.remarks}
            onChange={change}
          />

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Maintenance"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </Section>

      <Section title="Maintenance History">
        <Table
          columns={[
            { key: "date", label: "Date" },
            { key: "activity", label: "Activity" },
            { key: "species_name", label: "Species" },
            { key: "planting_method", label: "Method" },
            { key: "quantity_covered", label: "Quantity Covered" },
            { key: "cost", label: "Cost" },
            { key: "remarks", label: "Remarks" },
          ]}
          rows={maintenance}
        />
      </Section>
    </div>
  );
}