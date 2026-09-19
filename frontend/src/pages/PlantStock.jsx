import { useEffect, useState } from "react";
import api from "../api";
import Section from "../components/Section";
import Table from "../components/Table";

export default function PlantStock() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStock = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock");
      setStock(res.data);
    } catch (err) {
      setError("Failed to load plant stock.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const totalStock = stock.reduce(
    (sum, item) => sum + Number(item.current_stock || 0),
    0
  );

  const totalPlanted = stock.reduce(
    (sum, item) => sum + Number(item.planted || 0),
    0
  );

  const totalMortality = stock.reduce(
    (sum, item) => sum + Number(item.mortality || 0),
    0
  );

  const totalOutward = stock.reduce(
    (sum, item) => sum + Number(item.outward || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plant Stock</h1>
          <p className="text-sm text-slate-500">
            Current stock calculated from plantation, mortality and outward.
          </p>
        </div>

        <button
          onClick={loadStock}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Planted</p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {totalPlanted.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Mortality</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {totalMortality.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Outward</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {totalOutward.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Current Stock</p>
          <p className="mt-2 text-2xl font-bold text-green-700">
            {totalStock.toLocaleString()}
          </p>
        </div>
      </div>

      <Section title="Current Stock">
        {loading ? (
          <p className="text-sm text-slate-500">Loading stock...</p>
        ) : error ? (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        ) : (
          <Table
            columns={[
              { key: "species_name", label: "Species" },
              { key: "planting_method", label: "Method" },
              { key: "planted", label: "Planted" },
              { key: "mortality", label: "Mortality" },
              { key: "outward", label: "Outward" },
              { key: "current_stock", label: "Current Stock" },
            ]}
            data={stock}
          />
        )}
      </Section>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Stock calculation:</strong>{" "}
        Current Stock = Plantation − Mortality − Outward.
        Maintenance does not reduce stock.
      </div>
    </div>
  );
}