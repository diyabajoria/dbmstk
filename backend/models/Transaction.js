const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    type: { type: String, enum: ["PURCHASE", "CONSUMPTION"], required: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    batchNumber: { type: String, required: true },
    quantity: { type: Number, required: true, min: [0, "quantity must be >= 0"] },

    // Purchase-only fields
    unitPrice: { type: Number, min: 0 },
    totalAmount: { type: Number, min: 0 },
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier" },

    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

// Indexes
transactionSchema.index({ type: 1 }); // split purchase vs consumption fast
transactionSchema.index({ date: 1 }); // date-range report filters
transactionSchema.index({ itemId: 1 }); // item detail transaction history

module.exports = mongoose.model("Transaction", transactionSchema);
