const mongoose = require("mongoose");

const { Schema } = mongoose;

const alertSchema = new Schema(
  {
    householdId: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },

    itemId: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    batchNumber: {
      type: String,
    },

    type: {
      type: String,
      enum: ["EXPIRED", "EXPIRING_SOON", "LOW_STOCK", "RESTOCK"],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },

  { timestamps: true }
);

alertSchema.index({ isRead: 1, createdAt: -1 });
alertSchema.index({ householdId: 1, isRead: 1 });

module.exports = mongoose.model("Alert", alertSchema);