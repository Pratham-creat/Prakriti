import { useEffect, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

export default function Labour() {
  const [labour, setLabour] = useState([]);

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    bank_account: "",
    aadhaar: "",
    samagra_id: "",
    ifsc: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLabour = async () => {
    try {
      const res = await api.get("/labour");
      setLabour(res.data);
    } catch (err) {
      setError("Failed to load labour records.");
    }
  };

  useEffect(() => {
    loadLabour();
  }, []);

  const handleChange = (e) => {
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
      await api.post("/labour", form);

      setForm({
        name: "",
        mobile: "",
        bank_account: "",
        aadhaar: "",
        samagra_id: "",
        ifsc: "",
      });

      await loadLabour();
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to add labour worker."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Labour Master</h1>
        <p className="text-sm text-slate-500">
          Add and manage nursery workers.
        </p>
      </div>

      <Section title="Add Labour Worker">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <Field
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <Field
            label="Mobile"
            name="mobile"
            value={form.mobile}
            onChange={handleChange}
          />

          <Field
            label="Bank Account"
            name="bank_account"
            value={form.bank_account}
            onChange={handleChange}
          />

          <Field
            label="Aadhaar"
            name="aadhaar"
            value={form.aadhaar}
            onChange={handleChange}
          />

          <Field
            label="Samagra ID"
            name="samagra_id"
            value={form.samagra_id}
            onChange={handleChange}
          />

          <Field
            label="IFSC"
            name="ifsc"
            value={form.ifsc}
            onChange={handleChange}
          />

          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Add Worker"}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </Section>

      <Section title="Labour Workers">
        <Table
          columns={[
            { key: "name", label: "Name" },
            { key: "mobile", label: "Mobile" },
            { key: "bank_account", label: "Bank Account" },
            { key: "aadhaar", label: "Aadhaar" },
            { key: "samagra_id", label: "Samagra ID" },
            { key: "ifsc", label: "IFSC" },
          ]}
          data={labour}
        />
      </Section>
    </div>
  );
}