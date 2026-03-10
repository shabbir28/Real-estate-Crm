const { validationResult } = require("express-validator");
const Lead = require("../models/Lead");
const User = require("../models/User");

// @desc    Get all leads
// @route   GET /api/leads
// @access  Private
const getLeads = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.assignedAgent) filter.assignedAgent = req.query.assignedAgent;
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // If agent, only show their leads
    if (req.user.role === "agent") {
      filter.assignedAgent = req.user._id;
    }

    const leads = await Lead.find(filter)
      .populate("assignedAgent", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Lead.countDocuments(filter);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single lead
// @route   GET /api/leads/:id
// @access  Private
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate(
      "assignedAgent",
      "name email phone",
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create lead
// @route   POST /api/leads
// @access  Private
const createLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const leadData = { ...req.body };

    // If agent, assign to themselves
    if (req.user.role === "agent") {
      leadData.assignedAgent = req.user._id;
    }

    const lead = await Lead.create(leadData);
    await lead.populate("assignedAgent", "name email");

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update lead
// @route   PUT /api/leads/:id
// @access  Private
const updateLead = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation errors",
        errors: errors.array(),
      });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      lead.assignedAgent?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Handle assignment status logic
    if (req.body.assignedAgent !== undefined) {
      if (req.body.assignedAgent) {
        // If assigning a new agent or changing, set status to pending
        if (
          lead.assignedAgent?.toString() !== req.body.assignedAgent.toString()
        ) {
          req.body.assignmentStatus = "pending";
        }
      } else {
        // If unassigning
        req.body.assignmentStatus = "unassigned";
      }
    }

    // Keep track of the progress log if status or notes are provided
    if (req.body.status || req.body.notes) {
      if (!req.body.progressLog) {
        req.body.$push = {
          progressLog: {
            status: req.body.status || lead.status,
            notes: req.body.notes || "Lead updated",
            updatedBy: req.user._id,
            timestamp: new Date(),
          },
        };
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("assignedAgent", "name email");

    res.json({
      success: true,
      message: "Lead updated successfully",
      data: updatedLead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Respond to lead assignment (Accept/Reject)
// @route   PUT /api/leads/:id/respond
// @access  Private (Agent only)
const respondToAssignment = async (req, res) => {
  try {
    const { response } = req.body; // 'accepted' or 'rejected'
    if (!["accepted", "rejected"].includes(response)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid response" });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    if (lead.assignedAgent?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    lead.assignmentStatus = response;

    // If rejected, remove the agent assignment
    if (response === "rejected") {
      lead.assignedAgent = undefined;
      lead.assignmentStatus = "unassigned";
    } else {
      // If accepted, maybe move status to contacted if it's new?
      // User didn't ask for auto-status move, so keep it as is.
    }

    await lead.save();

    res.json({
      success: true,
      message: `Assignment ${response} successfully`,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete lead
// @route   DELETE /api/leads/:id
// @access  Private
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      lead.assignedAgent?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await lead.deleteOne();

    res.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get leads by status (for Kanban board)
// @route   GET /api/leads/kanban
// @access  Private
const getKanbanLeads = async (req, res) => {
  try {
    const statuses = [
      "new",
      "contacted",
      "visit",
      "negotiation",
      "closed",
      "lost",
    ];
    const filter = {};

    // If agent, only show their leads
    if (req.user.role === "agent") {
      filter.assignedAgent = req.user._id;
    }

    const kanbanData = await Promise.all(
      statuses.map(async (status) => {
        const leads = await Lead.find({ ...filter, status })
          .populate("assignedAgent", "name email")
          .sort({ createdAt: -1 });

        return {
          status,
          leads,
        };
      }),
    );

    res.json({
      success: true,
      data: kanbanData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    if (
      !["new", "contacted", "visit", "negotiation", "closed", "lost"].includes(
        status,
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      lead.assignedAgent?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    lead.status = status;

    // Also push to progressLog
    lead.progressLog.push({
      status: status,
      notes: "Status updated via quick action",
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await lead.save();

    res.json({
      success: true,
      message: "Lead status updated successfully",
      data: lead,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  getKanbanLeads,
  respondToAssignment,
  updateLeadStatus,
};
