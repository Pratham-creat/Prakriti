import { useEffect, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

const today = () => new Date().toISOString().split("T")[0];

export default function LabourPayments() {
  const [labour, setLabour] = useState([]);
  const [years, setYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    labour_id: "",
    payment_date: today(),
    financial_year_id: "",
    applicable_quarter_id: "",
    scheme_head_id: "",
    days: "",
    wage_rate: "",
    payment_method: "online",
    reference_number: "",
    cheque_number: "",
    cheque_date: "",
    cheque_bank: "",
    remarks: "",
  });

  const load = async () => {
    const [labourData, yearsRes, quartersRes, schemesRes, paymentsData] =
      await Promise.all([
        api.labour(),
        api.financialYears(),
        api.quarters(),
        api.schemes(),
        api.labourPayments(),
      ]);

    setLabour(labourData);
    setYears(yearsRes);
    setQuarters(quartersRes);
    setSchemes(schemesRes);
    setPayments(paymentsData);
  };

  useEffect(() => {
    load().catch((err) => setError(err.userMessage || err.message));
  }, []);

  const change = (e) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  const amount =
    Number(form.days || 0) * Number(form.wage_rate || 0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.createLabourPayment({
        labour_id: Number(form.labour_id),
        payment_date: form.payment_date,
        financial_year_id: Number(form.financial_year_id),
        applicable_quarter_id: Number(form.applicable_quarter_id),
        scheme_head_id: Number(form.scheme_head_id),
        days: Number(form.days),
        wage_rate: Number(form.wage_rate),
        payment_method: form.payment_method,
        reference_number: form.reference_number || null,
        cheque_number:
          form.payment_method === "cheque" ? form.cheque_number || null : null,
        cheque_date:
          form.payment_method === "cheque" && form.cheque_date
            ? form.cheque_date
            : null,
        cheque_bank:
          form.payment_method === "cheque" ? form.cheque_bank || null : null,
        remarks: form.remarks || null,
      });

      setForm({
        labour_id: "",
        payment_date: today(),
        financial_year_id: "",
        applicable_quarter_id: "",
        scheme_head_id: "",
        days: "",
        wage_rate: "",
        payment_method: "online",
        reference_number: "",
        cheque_number: "",
        cheque_date: "",
        cheque_bank: "",
        remarks: "",
      });

      await load();
    } catch (err) {
      setError(err.userMessage || err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Labour Payment</h1>
        <p className="text-sm text-slate-500">
          Record wage payments separately from attendance. Amount is calculated as days × wage rate.
        </p>
      </div>

      <Section title="Record Labour Payment">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field as="select" label="Worker" name="labour_id" value={form.labour_id} onChange={change} required>
            <option value="">Select Worker</option>
            {labour.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Field>

          <Field label="Payment Date" type="date" name="payment_date" value={form.payment_date} onChange={change} required />

          <Field as="select" label="Financial Year" name="financial_year_id" value={form.financial_year_id} onChange={change} required>
            <option value="">Select FY</option>
            {years.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Field>

          <Field as="select" label="Quarter" name="applicable_quarter_id" value={form.applicable_quarter_id} onChange={change} required>
            <option value="">Select Quarter</option>
            {quarters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Field>

          <Field as="select" label="Scheme / Head" name="scheme_head_id" value={form.scheme_head_id} onChange={change} required>
            <option value="">Select Scheme</option>
            {schemes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Field>

          <Field label="Days" type="number" min="0.5" step="0.5" name="days" value={form.days} onChange={change} required />
          <Field label="Wage Rate / Day" type="number" min="0" step="0.01" name="wage_rate" value={form.wage_rate} onChange={change} required />

          <Field as="select" label="Payment Method" name="payment_method" value={form.payment_method} onChange={change} required>
            <option value="online">Online</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
          </Field>

          <Field label="Calculated Amount">
            <input value={amount ? amount.toFixed(2) : "0.00"} readOnly />
          </Field>

          {form.payment_method === "online" && (
            <Field label="UTR / Payment Reference" name="reference_number" value={form.reference_number} onChange={change} />
          )}

          {form.payment_method === "cheque" && (
            <>
              <Field label="Cheque Number" name="cheque_number" value={form.cheque_number} onChange={change} />
              <Field label="Cheque Date" type="date" name="cheque_date" value={form.cheque_date} onChange={change} />
              <Field label="Cheque Bank" name="cheque_bank" value={form.cheque_bank} onChange={change} />
            </>
          )}

          <Field label="Remarks" name="remarks" value={form.remarks} onChange={change} />

          <div className="flex items-end">
            <button disabled={loading} className="w-full rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {loading ? "Saving..." : "Record Payment"}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      </Section>

      <Section title="Labour Payment History">
        <Table
          columns={[
            { key: "payment_date", label: "Date" },
            { key: "labour_name", label: "Worker" },
            { key: "days", label: "Days" },
            { key: "wage_rate", label: "Rate / Day" },
            { key: "amount", label: "Amount" },
            { key: "payment_method", label: "Method" },
            { key: "reference_number", label: "Reference" },
          ]}
          rows={payments}
        />
      </Section>
    </div>
  );
}
