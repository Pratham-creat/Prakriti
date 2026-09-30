import { useState } from "react";
import EditModal from "./EditModal";

export default function Table({
  columns = [],
  rows,
  data,
  empty = "No records found.",
  editable = false,
  entity,
  onEdited,
}) {
  const items = Array.isArray(rows) ? rows : Array.isArray(data) ? data : [];
  const [editingId, setEditingId] = useState(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold text-slate-600">
                  {column.label}
                </th>
              ))}
              {editable && (
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Action</th>
              )}
            </tr>
          </thead>

          <tbody>
            {items.length ? (
              items.map((row, index) => (
                <tr key={row.id ?? index} className="border-b border-slate-100 last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                  {editable && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingId(row.id)}
                        className="rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (editable ? 1 : 0) || 1}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId != null && entity && (
        <EditModal
          entityType={entity}
          recordId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            onEdited?.();
          }}
        />
      )}
    </>
  );
}
