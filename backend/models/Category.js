const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
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

// Category names only need to be unique within a household
categorySchema.index({ householdId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);