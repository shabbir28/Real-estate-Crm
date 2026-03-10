const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Lead name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: [
        "website",
        "facebook",
        "instagram",
        "referral",
        "social",
        "email",
        "phone",
        "walk-in",
        "other",
      ],
      default: "website",
    },
    status: {
      type: String,
      enum: ["new", "contacted", "visit", "negotiation", "closed", "lost"],
      default: "new",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    budget: {
      type: String,
      trim: true,
    },
    preferredPropertyType: {
      type: String,
      enum: ["apartment", "house", "villa", "commercial", "land", "other"],
      default: "apartment",
    },
    bedrooms: {
      type: Number,
      min: 0,
    },
    preferredLocation: {
      type: String,
      trim: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignmentStatus: {
      type: String,
      enum: ["unassigned", "pending", "accepted", "rejected"],
      default: "unassigned",
    },
    notes: {
      type: String,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    lastContactDate: {
      type: Date,
    },
    nextFollowUp: {
      type: Date,
    },
    progressLog: [
      {
        status: {
          type: String,
          enum: ["new", "contacted", "visit", "negotiation", "closed", "lost"],
        },
        notes: {
          type: String,
          trim: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index for better search performance
leadSchema.index({ name: "text", email: "text", phone: "text" });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedAgent: 1 });

module.exports = mongoose.model("Lead", leadSchema);
