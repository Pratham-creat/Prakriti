import { useEffect, useMemo, useState } from "react";
import api from "../api";
import Field from "../components/Field";
import Section from "../components/Section";
import Table from "../components/Table";

const today = () => new Date().toISOString().split("T")[0];

const initialForm = {
  type: "purchase",
  material_id: "",
  quantity: "",
  unit: "kg",
  rate: "",
  supplier_source: "",
  transaction_date: today(),
  financial_year_id: "",
  applicable_quarter_id: "",
  scheme_head_id: "",
  remarks: "",
};

export default function Expenditure() {
  const [materials, setMaterials] = useState([]);
  const [years, setYears] = useState([]);
  const [quarters, setQuarters] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [materialRes, yearsRes, quartersRes, schemesRes, transactionRes] =
      await Promise.all([
        api.materials(),
        api.financialYears(),
        api.quarters(),
        api.schemes(),
        api.materialTransactions(),
      ]);

    setMaterials(materialRes);
    setYears(yearsRes);
    setQuarters(quartersRes);
    setSchemes(schemesRes);
    setTransactions(transactionRes);
  };

  useEffect(() => {
    load().catch((err) => setError(err.userMessage || err.message));
  }, []);

  const change = (e) =>
    setForm((current) => ({ ...current, [e.target.name]: e.target.value }));

  const isPurchase = form.type === "purchase";
  const calculatedTotal =
    isPurchase ? Number(form.quantity || 0) * Number(form.rate || 0) : 0;

  const purchaseTotal = useMemo(
    () =>
      transactions
        .filter((row) => row.type === "purchase")
        .reduce((sum, row) => sum + Number(row.total_amount || 0), 0),
    [transactions]
  );

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.createMaterialTransaction({
        type: form.type,
        material_id: Number(form.material_id),
        quantity: Number(form.quantity),
        unit: form.unit,
        rate: isPurchase ? Number(form.rate || 0) : null,
        supplier_source: form.supplier_source || null,
        transaction_date: form.transaction_date,
        financial_year_id: Number(form.financial_year_id),
        applicable_quarter_id: Number(form.applicable_quarter_id),
        scheme_head_id: Number(form.scheme_head_id),
        remarks: form.remarks || null,
      });

      setForm(initialForm);
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
        <h1 className="text-2xl font-bold text-slate-800">Expenditure</h1>
        <p className="text-sm text-slate-500">
          Record material purchases and government-supplied materials. Government supply is tracked but does not count as expenditure.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Material Purchase Expenditure</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">₹{purchaseTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Transactions</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{transactions.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Current Entry Total</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">₹{calculatedTotal.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <Section title="Add Expenditure / Material Receipt">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field as="select" label="Transaction Type" name="type" value={form.type} onChange={change} required>
            <option value="purchase">Purchase / Expenditure</option>
            <option value="government_supply">Government Supply</option>
          </Field>

          <Field as="select" label="Material" name="material_id" value={form.material_id} onChange={change} required>
            <option value="">Select Material</option>
            {materials.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Field>

          <Field label="Quantity" type="number" min="0.01" step="0.01" name="quantity" value={form.quantity} onChange={change} required />

          <Field label="Unit" name="unit" value={form.unit} onChange={change} placeholder="kg, bag, litre, piece" required />

          <Field
            label="Rate"
            type="number"
            min="0"
            step="0.01"
            name="rate"
            value={form.rate}
            onChange={change}
            disabled={!isPurchase}
            hint={isPurchase ? "Total = quantity × rate" : "Government supply has no expenditure amount"}
          />

          <Field label="Supplier / Source" name="supplier_source" value={form.supplier_source} onChange={change} />

          <Field label="Transaction Date" type="date" name="transaction_date" value={form.transaction_date} onChange={change} required />

          <Field as="select" label="Financial Year" name="financial_year_id" value={form.financial_year_id} onChange={change} required>
            <option value="">Select FY</option>
            {years.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Field>

          <Field as="select" label="Applicable Quarter" name="applicable_quarter_id" value={form.applicable_quarter_id} onChange={change} required>
            <option value="">Select Quarter</option>
            {quarters.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Field>

          <Field as="select" label="Scheme / Head" name="scheme_head_id" value={form.scheme_head_id} onChange={change} required>
            <option value="">Select Scheme</option>
            {schemes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Field>

          <Field label="Remarks" name="remarks" value={form.remarks} onChange={change} />

          <div className="flex items-end">
            <button disabled={loading} className="w-full rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
              {loading ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </form>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      </Section>

      <Section title="Expenditure History">
        <Table
          columns={[
            { key: "transaction_date", label: "Date" },
            { key: "type", label: "Type" },
            { key: "material_id", label: "Material ID" },
            { key: "quantity", label: "Quantity" },
            { key: "unit", label: "Unit" },
            { key: "rate", label: "Rate" },
            { key: "total_amount", label: "Amount" },
            { key: "supplier_source", label: "Supplier / Source" },
          ]}
          rows={transactions}
        />
      </Section>
    </div>
  );
}
