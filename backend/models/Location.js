const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Household",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },

  { timestamps: true }
);

// Location names only need to be unique within a household
locationSchema.index({ householdId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Location", locationSchema);