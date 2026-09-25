const mongoose = require("mongoose");
const { Schema } = mongoose;

// Batches are embedded (not a separate collection) because they are always
// read/written together with their parent item — FEFO consumption, stock
// totals, and expiry scans all operate item-by-item. This demonstrates
// MongoDB's embedded-document model where the tradeoff (no independent
// querying of "all batches") is acceptable for this access pattern.
const batchSchema = new Schema({
  batchNumber: { type: String, required: true, trim: true },
  purchaseDate: { type: Date, required: true },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (value) {
        return value >= this.purchaseDate;
      },
      message: "expiryDate cannot be before purchaseDate",
    },
  },
  purchasedQuantity: { type: Number, required: true, min: [0, "purchasedQuantity must be >= 0"] },
  remainingQuantity: { type: Number, required: true, min: [0, "remainingQuantity must be >= 0"] },
  pricePerUnit: { type: Number, required: true, min: [0, "pricePerUnit must be >= 0"] },
  supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },
});

const itemSchema = new Schema(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },
    name: { type: String, required: [true, "Item name is required"], trim: true },
    brand: { type: String, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    unit: { type: String, required: true, trim: true },
    minimumStock: { type: Number, required: true, min: [0, "minimumStock must be >= 0"], default: 0 },
    locationId: { type: Schema.Types.ObjectId, ref: "Location", required: true },
    batches: [batchSchema],
  },
  { timestamps: true }
);

// Indexes
itemSchema.index({ name: "text" }); // fast search-by-name
itemSchema.index({ categoryId: 1 }); // category filter
itemSchema.index({ locationId: 1 }); // location filter
itemSchema.index({ "batches.expiryDate": 1 }); // expiry scans / FEFO sort / expiry filters

// Virtual: current stock = sum of remainingQuantity across all batches
itemSchema.virtual("currentStock").get(function () {
  return this.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
});
itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Item", itemSchema);
