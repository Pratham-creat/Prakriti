import { useRef, useState } from "react";
import api from "../api";

export default function ExcelActions({ entity, onImported }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  const exportData = async () => {
    setLoading("export");
    setMessage("");
    try {
      await api.exportExcel(entity);
      setMessage("Excel exported.");
    } catch (error) {
      setMessage(error.userMessage || error.message || "Export failed.");
    } finally {
      setLoading("");
    }
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setLoading("import");
    setMessage("");
    try {
      const result = await api.importExcel(entity, file);
      setMessage(
        `Imported ${result.rows_processed} rows: ${result.created} created, ${result.updated} updated.`
      );
      onImported?.();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      if (typeof detail === "object" && detail?.errors) {
        setMessage(detail.errors.join(" | "));
      } else {
        setMessage(error.userMessage || error.message || "Import failed.");
      }
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        onChange={importData}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={Boolean(loading)}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "import" ? "Importing..." : "Import Excel"}
      </button>

      <button
        type="button"
        onClick={exportData}
        disabled={Boolean(loading)}
        className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading === "export" ? "Exporting..." : "Export Excel"}
      </button>

      {message && (
        <span className="text-xs text-slate-500" title={message}>
          {message}
        </span>
      )}
    </div>
  );
}
