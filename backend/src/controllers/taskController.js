const Task = require("../models/Task");

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, leadId, agentId, type, dueDate } = req.body;

    // Use specific agentId if provided (and user is admin); otherwise default to requesting agent.
    const assignedAgentId =
      req.user.role === "admin" && agentId ? agentId : req.user._id;

    const assignmentStatus =
      req.user.role === "admin" &&
      agentId &&
      agentId.toString() !== req.user._id.toString()
        ? "assigned"
        : "self";

    const task = await Task.create({
      title,
      description,
      leadId,
      agentId: assignedAgentId,
      type,
      dueDate,
      assignmentStatus,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks (Admin only)
// @route   GET /api/tasks
// @access  Private/Admin
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("leadId", "name email phone status")
      .populate("agentId", "name email")
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all tasks for an agent
// @route   GET /api/tasks/agent/:agentId
// @access  Private
exports.getAgentTasks = async (req, res) => {
  try {
    // Optional: Filter by specific condition like date
    const tasks = await Task.find({ agentId: req.params.agentId })
      .populate("leadId", "name email phone status")
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Complete a task
// @route   PATCH /api/tasks/:id/complete
// @access  Private
exports.completeTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Ensure user owns task or is admin
    if (
      task.agentId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this task",
      });
    }

    task.status = "completed";
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Ensure user owns task or is admin
    if (
      task.agentId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this task",
      });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Respond to an assigned task
// @route   PATCH /api/tasks/:id/respond
// @access  Private
exports.respondToTask = async (req, res) => {
  try {
    const { response } = req.body;

    if (!["accepted", "rejected"].includes(response)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid response" });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Only the assigned agent can respond
    if (task.agentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to respond to this task",
      });
    }

    task.assignmentStatus = response;
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
