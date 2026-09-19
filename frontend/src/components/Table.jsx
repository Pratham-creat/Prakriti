export default function Table({
  columns = [],
  rows,
  data,
  empty = "No records found.",
}) {
  const items = Array.isArray(rows) ? rows : Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 font-semibold text-slate-600"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {items.length ? (
            items.map((row, index) => (
              <tr
                key={row.id ?? index}
                className="border-b border-slate-100 last:border-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-slate-700"
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length || 1}
                className="px-4 py-8 text-center text-slate-500"
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
