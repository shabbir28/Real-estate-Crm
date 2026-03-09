const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: [true, "Lead ID is required"],
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property ID is required"],
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Agent ID is required"],
    },
    visitDate: {
      type: Date,
      required: [true, "Visit date is required"],
    },
    visitTime: {
      type: String,
      required: [true, "Visit time is required"],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster querying
visitSchema.index({ agentId: 1, status: 1 });
visitSchema.index({ visitDate: 1 });

module.exports = mongoose.model("Visit", visitSchema);
