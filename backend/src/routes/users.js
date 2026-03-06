const express = require("express");
const { body } = require("express-validator");
const { auth, adminAuth } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

// All routes require authentication
router.use(auth);

// @desc    Get agents with their assigned leads/deals summary
// @route   GET /api/users/agents-stats
// @access  Private/Admin
router.get("/agents-stats", adminAuth, async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).select("-password");

    const Lead = require("../models/Lead");
    const Deal = require("../models/Deal");

    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const assignedLeadsCount = await Lead.countDocuments({
          assignedAgent: agent._id,
        });
        const closedDealsCount = await Deal.countDocuments({
          $or: [
            { assignedAgent: agent._id },
            { agent: agent._id }, // Depending on schema
          ],
          status: "won",
        });

        // Get assigned leads names
        const assignedLeads = await Lead.find({ assignedAgent: agent._id })
          .select("name status createdAt")
          .limit(5);

        return {
          ...agent.toObject(),
          assignedLeadsCount,
          closedDealsCount,
          assignedLeads,
        };
      }),
    );

    res.json({
      success: true,
      data: agentsWithStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get("/", adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined)
      filter.isActive = req.query.isActive === "true";

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
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
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check permissions (admin can view any user, agent can only view themselves)
    if (
      req.user.role === "agent" &&
      req.user._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Create user (admin only)
// @route   POST /api/users
// @access  Private/Admin
router.post(
  "/",
  adminAuth,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["admin", "agent"])
      .withMessage("Role must be admin or agent"),
  ],
  async (req, res) => {
    try {
      const user = await User.create(req.body);

      res.status(201).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().withMessage("Name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
      .isIn(["admin", "agent"])
      .withMessage("Role must be admin or agent"),
  ],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check permissions
      if (
        req.user.role === "agent" &&
        req.user._id.toString() !== user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Agents cannot change their role
      if (req.user.role === "agent" && req.body.role) {
        delete req.body.role;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true },
      ).select("-password");

      res.json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
