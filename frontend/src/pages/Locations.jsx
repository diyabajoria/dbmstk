import RefDataCardManager from "../components/RefDataCardManager";
import { getLocations, addLocation, updateLocation, deleteLocation } from "../services/refDataService";
import { formatCurrency } from "../utils/formatters";

export default function Locations() {
  return (
    <RefDataCardManager
      title="Storage Locations"
      icon={(row) => ({ Kitchen: "🍳", "Kitchen Cabinet": "🗄️", Pantry: "🥫", Refrigerator: "🧊", Freezer: "❄️", Bathroom: "🛁", "Utility Room": "🧹", "Storage Room": "📦" }[row.name] || "📍")}
      subtitle="Kitchen, Pantry, Refrigerator and every other room you track."
      fields={[
        { key: "name", label: "Name" },
        { key: "description", label: "Description" },
      ]}
      listFn={getLocations}
      addFn={addLocation}
      updateFn={updateLocation}
      deleteFn={deleteLocation}
      renderStats={(row) => (
        <div style={{ fontSize: "0.85rem" }}>
          <div>{row.itemCount || 0} item{row.itemCount === 1 ? "" : "s"} stored</div>
          <div style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(row.inventoryValue)}</div>
        </div>
      )}
    />
  );
}
