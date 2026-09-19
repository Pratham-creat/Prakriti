import { useEffect, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

export default function Plantation() {
  const [plantations, setPlantations] = useState([]);
  const [species, setSpecies] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [schemes, setSchemes] = useState([]);

  const [form, setForm] = useState({
    financial_year_id: "",
    applicable_quarter_id: "",
    scheme_head_id: "",
    date: new Date().toISOString().split("T")[0],
    species_id: "",
    planting_method: "polythene",
    quantity: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      const [
        plantationsRes,
        speciesRes,
        yearsRes,
        quartersRes,
        schemesRes,
      ] = await Promise.all([
        api.get("/plantations"),
        api.get("/masters/species"),
        api.get("/masters/financial-years"),
        api.get("/masters/quarters"),
        api.get("/masters/schemes"),
      ]);

      setPlantations(plantationsRes.data);
      setSpecies(speciesRes.data);
      setFinancialYears(yearsRes.data);
      setQuarters(quartersRes.data);
      setSchemes(schemesRes.data);
    } catch (err) {
      setError("Failed to load plantation data.");
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

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/plantations", {
        financial_year_id: Number(form.financial_year_id),
        applicable_quarter_id: Number(form.applicable_quarter_id),
        scheme_head_id: Number(form.scheme_head_id),
        date: form.date,
        species_id: Number(form.species_id),
        planting_method: form.planting_method,
        quantity: Number(form.quantity),
      });

      setForm((current) => ({
        ...current,
        species_id: "",
        quantity: "",
      }));

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to create plantation batch."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Plantation</h1>
        <p className="text-sm text-slate-500">
          Record plantation batches by species and planting method.
        </p>
      </div>

      <Section title="Add Plantation Batch">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Field
            as="select"
            label="Financial Year"
            name="financial_year_id"
            value={form.financial_year_id}
            onChange={change}
            required
          >
            <option value="">Select FY</option>
            {financialYears.map((fy) => (
              <option key={fy.id} value={fy.id}>
                {fy.name || fy.year}
              </option>
            ))}
          </Field>

          <Field
            as="select"
            label="Quarter"
            name="applicable_quarter_id"
            value={form.applicable_quarter_id}
            onChange={change}
            required
          >
            <option value="">Select Quarter</option>
            {quarters.map((quarter) => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name}
              </option>
            ))}
          </Field>

          <Field
            as="select"
            label="Scheme / Head"
            name="scheme_head_id"
            value={form.scheme_head_id}
            onChange={change}
            required
          >
            <option value="">Select Scheme</option>
            {schemes.map((scheme) => (
              <option key={scheme.id} value={scheme.id}>
                {scheme.name}
              </option>
            ))}
          </Field>

          <Field
            label="Plantation Date"
            type="date"
            name="date"
            value={form.date}
            onChange={change}
            required
          />

          <Field
            as="select"
            label="Species"
            name="species_id"
            value={form.species_id}
            onChange={change}
            required
          >
            <option value="">Select Species</option>
            {species.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Field>

          <Field
            as="select"
            label="Planting Method"
            name="planting_method"
            value={form.planting_method}
            onChange={change}
            required
          >
            <option value="polythene">Polythene</option>
            <option value="bed">Bed</option>
          </Field>

          <Field
            label="Quantity"
            type="number"
            min="1"
            name="quantity"
            value={form.quantity}
            onChange={change}
            required
          />

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Plantation"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </Section>

      <Section title="Plantation History">
        <Table
          columns={[
            { key: "date", label: "Date" },
            { key: "species_name", label: "Species" },
            { key: "planting_method", label: "Method" },
            { key: "quantity", label: "Quantity" },
          ]}
          rows={plantations}
        />
      </Section>
    </div>
  );
}