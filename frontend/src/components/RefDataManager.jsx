import { useEffect, useState } from "react";
import DataTable from "./DataTable";
import LoadingSpinner from "./LoadingSpinner";
import { useAuth } from "../context/AuthContext";

/**
 * fields: [{ key, label, type }]
 */
export default function RefDataManager({ title, fields, listFn, addFn, deleteFn }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.key, ""])));
  const { isAdmin } = useAuth();

  function load() {
    setLoading(true);
    listFn()
      .then((res) => setRows(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    try {
      await addFn(form);
      setForm(Object.fromEntries(fields.map((f) => [f.key, ""])));
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this record?")) return;
    try {
      await deleteFn(id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed");
    }
  }

  const columns = [
    ...fields.map((f) => ({ key: f.key, header: f.label })),
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(row._id)}>Delete</button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <h2 className="page-title">{title}</h2>
      {error && <div className="error-banner">{error}</div>}

      {isAdmin && (
        <form onSubmit={handleAdd} className="toolbar">
          {fields.map((f) => (
            <input
              key={f.key}
              type={f.type || "text"}
              placeholder={f.label}
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              required={f.key === "name"}
            />
          ))}
          <button className="btn" type="submit">+ Add</button>
        </form>
      )}

      {loading ? <LoadingSpinner /> : <DataTable columns={columns} rows={rows} emptyMessage={`No ${title.toLowerCase()} yet.`} />}
    </div>
  );
}
