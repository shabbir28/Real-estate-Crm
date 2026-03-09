const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Agent ID is required"],
    },
    type: {
      type: String,
      enum: ["followup", "call", "meeting", "task"],
      default: "task",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    assignmentStatus: {
      type: String,
      enum: ["self", "assigned", "accepted", "rejected"],
      default: "self",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for faster querying by agent and status, and sorting by due date
taskSchema.index({ agentId: 1, status: 1 });
taskSchema.index({ agentId: 1, dueDate: 1 });

module.exports = mongoose.model("Task", taskSchema);
