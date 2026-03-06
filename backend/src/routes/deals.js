const express = require("express");
const { body } = require("express-validator");
const { auth, agentOrAdminAuth } = require("../middleware/auth");
const Deal = require("../models/Deal");
const Lead = require("../models/Lead");
const Property = require("../models/Property");

const router = express.Router();

// All routes require authentication
router.use(auth);

// Validation rules
const createDealValidation = [
  body("title").notEmpty().withMessage("Deal title is required"),
  body("lead").isMongoId().withMessage("Valid lead ID is required"),
  body("property").isMongoId().withMessage("Valid property ID is required"),
  body("dealValue").isNumeric().withMessage("Deal value must be a number"),
  body("expectedClosingDate")
    .isISO8601()
    .withMessage("Valid expected closing date is required"),
];

// @desc    Get all deals
// @route   GET /api/deals
// @access  Private
router.get("/", agentOrAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.pipelineStage) filter.pipelineStage = req.query.pipelineStage;
    if (req.query.agent) filter.agent = req.query.agent;

    // If agent, only show their deals
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const deals = await Deal.find(filter)
      .populate("lead", "name email phone")
      .populate("property", "title price address.city")
      .populate("agent", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Deal.countDocuments(filter);

    res.json({
      success: true,
      data: deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/deals ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Get single deal
// @route   GET /api/deals/:id
// @access  Private
router.get("/:id", agentOrAdminAuth, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("lead", "name email phone address")
      .populate("property", "title price address features images")
      .populate("agent", "name email phone");

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      deal.agent?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    console.error("GET /api/deals/:id ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Create deal
// @route   POST /api/deals
// @access  Private
router.post("/", agentOrAdminAuth, createDealValidation, async (req, res) => {
  try {
    const { validationResult } = require("express-validator");
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || "Validation Error",
        errors: errors.array(),
      });
    }

    const dealData = { ...req.body };

    // Verify lead exists
    const lead = await Lead.findById(dealData.lead);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Verify property exists
    const property = await Property.findById(dealData.property);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Set agent
    if (req.user.role === "agent") {
      dealData.agent = req.user._id;
    } else if (!dealData.agent) {
      dealData.agent = lead.assignedAgent;
    }

    const deal = await Deal.create(dealData);
    await deal.populate([
      { path: "lead", select: "name email phone" },
      { path: "property", select: "title price address.city" },
      { path: "agent", select: "name email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Deal created successfully",
      data: deal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Update deal
// @route   PUT /api/deals/:id
// @access  Private
router.put("/:id", agentOrAdminAuth, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      deal.agent?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const updatedDeal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate([
      { path: "lead", select: "name email phone" },
      { path: "property", select: "title price address.city" },
      { path: "agent", select: "name email" },
    ]);

    res.json({
      success: true,
      message: "Deal updated successfully",
      data: updatedDeal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Delete deal
// @route   DELETE /api/deals/:id
// @access  Private
router.delete("/:id", agentOrAdminAuth, async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      deal.agent?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await deal.deleteOne();

    res.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Get deals pipeline data
// @route   GET /api/deals/pipeline
// @access  Private
router.get("/pipeline/data", agentOrAdminAuth, async (req, res) => {
  try {
    const stages = [
      "lead",
      "qualified",
      "proposal",
      "negotiation",
      "closing",
      "won",
      "lost",
    ];
    const filter = {};

    // If agent, only show their deals
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const pipelineData = await Promise.all(
      stages.map(async (stage) => {
        const deals = await Deal.find({ ...filter, pipelineStage: stage })
          .populate("lead", "name")
          .populate("property", "title")
          .sort({ createdAt: -1 });

        const totalValue = deals.reduce((sum, deal) => sum + deal.dealValue, 0);

        return {
          stage,
          deals,
          count: deals.length,
          totalValue,
        };
      }),
    );

    res.json({
      success: true,
      data: pipelineData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
