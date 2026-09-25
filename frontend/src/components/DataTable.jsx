import EmptyState from "./EmptyState";

/**
 * columns: [{ key, header, render?(row) }]
 * Tables collapse into stacked cards on small screens (see .responsive CSS).
 */
export default function DataTable({ columns, rows, emptyMessage = "No records found.", emptyIcon }) {
  if (!rows || rows.length === 0) return <EmptyState message={emptyMessage} icon={emptyIcon} />;

  return (
    <table className="responsive">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={row._id || idx} style={{ animationDelay: `${Math.min(idx, 15) * 0.025}s` }}>
            {columns.map((col) => (
              <td key={col.key} data-label={col.header}>
                {col.render ? col.render(row) : row[col.key] ?? "—"}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
