import { useEffect, useState } from "react";
import api from "../api";
import Section from "../components/Section";
import Table from "../components/Table";

export default function Reports() {
  const [activeReport, setActiveReport] = useState("fund");

  const [fund, setFund] = useState([]);
  const [plant, setPlant] = useState([]);
  const [labour, setLabour] = useState([]);
  const [outward, setOutward] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        fundRes,
        plantRes,
        labourRes,
        outwardRes,
      ] = await Promise.all([
        api.get("/reports/fund"),
        api.get("/reports/plant"),
        api.get("/reports/labour"),
        api.get("/reports/outward"),
      ]);

      setFund(fundRes.data);
      setPlant(plantRes.data);
      setLabour(labourRes.data);
      setOutward(outwardRes.data);
    } catch (err) {
      setError("Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const reports = [
    ["fund", "Fund Report"],
    ["plant", "Plant Report"],
    ["labour", "Labour Report"],
    ["outward", "Outward Report"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reports</h1>
          <p className="text-sm text-slate-500">
            Review nursery financial, plantation, labour and outward data.
          </p>
        </div>

        <button
          onClick={loadReports}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl bg-slate-100 p-2">
        {reports.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveReport(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeReport === key
                ? "bg-white text-green-700 shadow"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <Section title="Reports">
          <p className="text-sm text-slate-500">Loading reports...</p>
        </Section>
      ) : (
        <>
          {activeReport === "fund" && (
            <Section title="Fund Report">
              <Table
                columns={[
                  { key: "quarter", label: "Quarter" },
                  { key: "scheme", label: "Scheme" },
                  { key: "received", label: "Received" },
                  { key: "expenditure", label: "Expenditure" },
                  { key: "balance", label: "Balance" },
                ]}
                data={fund}
              />
            </Section>
          )}

          {activeReport === "plant" && (
            <Section title="Plant Report">
              <Table
                columns={[
                  { key: "species", label: "Species" },
                  { key: "polythene", label: "Polythene" },
                  { key: "bed", label: "Bed" },
                  { key: "mortality", label: "Mortality" },
                  { key: "outward", label: "Outward" },
                  { key: "current_stock", label: "Current Stock" },
                ]}
                data={plant}
              />
            </Section>
          )}

          {activeReport === "labour" && (
            <Section title="Labour Report">
              <Table
                columns={[
                  { key: "date", label: "Date" },
                  { key: "activity", label: "Activity" },
                  { key: "total_workers", label: "Total Workers" },
                  { key: "present", label: "Present" },
                  { key: "absent", label: "Absent" },
                  { key: "payment", label: "Payment" },
                ]}
                data={labour}
              />
            </Section>
          )}

          {activeReport === "outward" && (
            <Section title="Outward Report">
              <Table
                columns={[
                  { key: "type", label: "Type" },
                  { key: "date", label: "Date" },
                  { key: "species", label: "Species" },
                  { key: "quantity", label: "Quantity" },
                  { key: "reference", label: "Reference" },
                  { key: "recipient", label: "Recipient / Institution" },
                ]}
                data={outward}
              />
            </Section>
          )}
        </>
      )}
    </div>
  );
}