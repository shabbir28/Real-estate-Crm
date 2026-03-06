const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    type: {
      type: String,
      enum: ["call", "meeting", "message", "note", "property_shared"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    agentName: {
      type: String,
      required: true,
    },
    attachedFile: {
      url: String,
      originalName: String,
    },
    // We can let Mongoose timestamps handle createdAt automatically, but we explicitly
    // use createdAt according to the user instructions, so we enable timestamps.
  },
  { timestamps: true },
);

module.exports = mongoose.model("Communication", communicationSchema);
