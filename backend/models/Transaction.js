const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },

    type: {
      type: String,
      enum: ["PURCHASE", "CONSUMPTION"],
      required: true,
    },

    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    batchNumber: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [0, "quantity must be >= 0"],
    },

    // Purchase-only fields
    unitPrice: {
      type: Number,
      min: 0,
    },

    totalAmount: {
      type: Number,
      min: 0,
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
transactionSchema.index({ type: 1 });
transactionSchema.index({ date: 1 });
transactionSchema.index({ itemId: 1 });

// Household-based queries
transactionSchema.index({ householdId: 1, date: 1 });
transactionSchema.index({ householdId: 1, type: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);