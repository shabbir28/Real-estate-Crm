const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Deal title is required"],
      trim: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["initial", "negotiation", "under-contract", "closed", "lost"],
      default: "initial",
    },
    dealValue: {
      type: Number,
      required: [true, "Deal value is required"],
      min: 0,
    },
    commissionRate: {
      type: Number,
      default: 2.5,
      min: 0,
      max: 100,
    },
    commissionAmount: {
      type: Number,
      min: 0,
    },
    closingDate: {
      type: Date,
    },
    expectedClosingDate: {
      type: Date,
      required: true,
    },
    contractDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    documents: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pipelineStage: {
      type: String,
      enum: [
        "lead",
        "qualified",
        "proposal",
        "negotiation",
        "closing",
        "won",
        "lost",
      ],
      default: "lead",
    },
  },
  {
    timestamps: true,
  },
);

// Calculate commission amount before saving
dealSchema.pre("save", function () {
  if (this.dealValue && this.commissionRate) {
    this.commissionAmount = (this.dealValue * this.commissionRate) / 100;
  }
});

// Index for better performance
dealSchema.index({ agent: 1, status: 1 });
dealSchema.index({ pipelineStage: 1 });
dealSchema.index({ closingDate: 1 });

module.exports = mongoose.model("Deal", dealSchema);
