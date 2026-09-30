import { useState } from "react";
import api from "../api";

export default function ReportExcelActions({ report }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const exportReport = async () => {
    setLoading(true);
    setMessage("");
    try {
      await api.exportReportExcel(report);
      setMessage("Excel exported.");
    } catch (error) {
      setMessage(error.userMessage || error.message || "Export failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={exportReport}
        disabled={loading}
        className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        {loading ? "Exporting..." : "Export Excel"}
      </button>
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  );
}
