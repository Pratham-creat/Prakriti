import { useEffect, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

export default function Mortality() {
  const [plantations, setPlantations] = useState([]);
  const [mortality, setMortality] = useState([]);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    plantation_id: "",
    species_id: "",
    planting_method: "",
    quantity_lost: "",
    reason: "",
    remarks: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [plantationRes, mortalityRes] = await Promise.all([
        api.get("/plantations"),
        api.get("/mortality"),
      ]);

      setPlantations(plantationRes.data);
      setMortality(mortalityRes.data);
    } catch (err) {
      setError("Failed to load mortality data.");
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
      await api.post("/mortality", {
        date: form.date,
        plantation_id: Number(form.plantation_id),
        species_id: Number(form.species_id),
        planting_method: form.planting_method,
        quantity_lost: Number(form.quantity_lost),
        reason: form.reason,
        remarks: form.remarks,
      });

      setForm({
        date: new Date().toISOString().split("T")[0],
        plantation_id: "",
        species_id: "",
        planting_method: "",
        quantity_lost: "",
        reason: "",
        remarks: "",
      });

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to save mortality record."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mortality</h1>
        <p className="text-sm text-slate-500">
          Record plants lost from existing plantation batches.
        </p>
      </div>

      <Section title="Add Mortality">
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
            label="Quantity Lost"
            type="number"
            min="1"
            name="quantity_lost"
            value={form.quantity_lost}
            onChange={change}
            required
          />

          <Field
            label="Reason"
            name="reason"
            value={form.reason}
            onChange={change}
            placeholder="e.g. Drought"
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
              className="w-full rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Record Mortality"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </Section>

      <Section title="Mortality History">
        <Table
          columns={[
            { key: "date", label: "Date" },
            { key: "species_name", label: "Species" },
            { key: "planting_method", label: "Method" },
            { key: "quantity_lost", label: "Quantity Lost" },
            { key: "reason", label: "Reason" },
            { key: "remarks", label: "Remarks" },
          ]}
          rows={mortality}
        />
      </Section>
    </div>
  );
}