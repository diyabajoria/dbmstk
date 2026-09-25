import { useEffect, useMemo, useRef, useState } from "react";
import { emojiFor } from "../data/itemCatalog";

/**
 * Searchable, grouped item selector that replaces the native <select>.
 * - Type to filter by name / brand / category
 * - Arrow keys + Enter to choose, Esc to close
 * - Shows stock for each item and an empty state with actions
 */
export default function ItemPicker({ items, value, onChange, placeholder = "Choose an item…", emptyActions, showStock = true }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hi, setHi] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = items.find((i) => i._id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? items.filter((i) =>
          [i.name, i.brand, i.categoryId?.name, i.locationId?.name].filter(Boolean).some((s) => s.toLowerCase().includes(q))
        )
      : items;
    return [...list].sort(
      (a, b) => (a.categoryId?.name || "").localeCompare(b.categoryId?.name || "") || a.name.localeCompare(b.name)
    );
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setHi(Math.max(0, filtered.findIndex((i) => i._id === value)));
    setTimeout(() => searchRef.current?.focus(), 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => setHi(0), [query]);

  useEffect(() => {
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(".highlight")?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  function choose(item) {
    onChange(item._id);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[hi]) choose(filtered[hi]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  let lastGroup = null;

  return (
    <div className={`picker ${open ? "open" : ""}`} ref={rootRef}>
      <button type="button" className="picker-trigger" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        {selected ? (
          <>
            <span className="picker-emoji">{emojiFor(selected)}</span>
            <span>
              <strong>{selected.name}</strong>
              {selected.brand && <span className="muted"> · {selected.brand}</span>}
            </span>
          </>
        ) : (
          <>
            <span className="picker-emoji">🔎</span>
            <span className="placeholder">{items.length ? placeholder : "No items yet"}</span>
          </>
        )}
        <span className="chev">▾</span>
      </button>

      {open && (
        <div className="picker-panel">
          <div className="picker-search">
            <input
              ref={searchRef}
              type="text"
              placeholder={`Search ${items.length} items…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="picker-list" role="listbox" ref={listRef}>
            {filtered.length === 0 ? (
              <div className="picker-empty">
                <div style={{ fontSize: "1.8rem" }}>🧺</div>
                {items.length === 0 ? "Your inventory is empty." : `No items match “${query}”.`}
                {emptyActions && <div>{emptyActions(query, () => setOpen(false))}</div>}
              </div>
            ) : (
              filtered.map((item, idx) => {
                const group = item.categoryId?.name || "Other";
                const header = group !== lastGroup ? <div className="picker-group">{group}</div> : null;
                lastGroup = group;
                return (
                  <div key={item._id}>
                    {header}
                    <div
                      role="option"
                      aria-selected={item._id === value}
                      className={`picker-option ${idx === hi ? "highlight" : ""} ${item._id === value ? "selected" : ""}`}
                      onMouseEnter={() => setHi(idx)}
                      onClick={() => choose(item)}
                    >
                      <span className="picker-emoji">{emojiFor(item)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="opt-name">{item.name}</div>
                        <div className="opt-meta">{[item.brand, item.locationId?.name].filter(Boolean).join(" · ")}</div>
                      </div>
                      {showStock && (
                        <div className="opt-right">
                          <div style={{ fontWeight: 700, color: item.lowStock ? "var(--amber)" : "var(--text)" }}>
                            {Number(item.currentStock || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })} {item.unit}
                          </div>
                          {item.lowStock && <div style={{ color: "var(--amber)" }}>low</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
