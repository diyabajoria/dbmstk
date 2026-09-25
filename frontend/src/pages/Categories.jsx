import RefDataCardManager from "../components/RefDataCardManager";
import { getCategories, addCategory, updateCategory, deleteCategory } from "../services/refDataService";
import { formatCurrency } from "../utils/formatters";
import { CATEGORY_EMOJI } from "../data/itemCatalog";

export default function Categories() {
  return (
    <RefDataCardManager
      title="Categories"
      icon={(row) => CATEGORY_EMOJI[row.name] || "🗂️"}
      subtitle="Household organization by category — items and stock value at a glance."
      fields={[
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
      ]}
      listFn={getCategories}
      addFn={addCategory}
      updateFn={updateCategory}
      deleteFn={deleteCategory}
      renderStats={(row) => (
        <div style={{ fontSize: "0.85rem" }}>
          <div>{row.itemCount || 0} item{row.itemCount === 1 ? "" : "s"}</div>
          <div style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(row.inventoryValue)}</div>
        </div>
      )}
    />
  );
}
