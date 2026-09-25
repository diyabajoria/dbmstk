import RefDataCardManager from "../components/RefDataCardManager";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "../services/refDataService";
import { formatCurrency } from "../utils/formatters";

export default function Suppliers() {
  return (
    <RefDataCardManager
      title="Suppliers"
      icon="🏪"
      subtitle="Kirana stores, supermarkets and quick-commerce apps you shop from."
      fields={[
        { key: "name", label: "Name" },
        { key: "contactPerson", label: "Contact Person" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
      ]}
      listFn={getSuppliers}
      addFn={addSupplier}
      updateFn={updateSupplier}
      deleteFn={deleteSupplier}
      renderStats={(row) => (
        <div style={{ fontSize: "0.85rem" }}>
          {row.contactPerson && <div>{row.contactPerson}</div>}
          {row.phone && <div style={{ color: "var(--text-muted)" }}>{row.phone}</div>}
          <div>{row.purchaseCount || 0} purchase{row.purchaseCount === 1 ? "" : "s"}</div>
          <div style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(row.totalSpent)} spent</div>
        </div>
      )}
    />
  );
}
