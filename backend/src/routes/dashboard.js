const express = require("express");
const { auth } = require("../middleware/auth");
const Property = require("../models/Property");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");

const router = express.Router();

router.get("/stats", auth, async (req, res) => {
  try {
    const isAgent = req.user.role === "agent";
    const agentId = req.user._id;

    // Filter leads, deals based on role
    const leadFilter = isAgent ? { assignedAgent: agentId } : {};
    const dealFilter = isAgent ? { agent: agentId } : {};

    const totalProperties = await Property.countDocuments();
    const totalLeads = await Lead.countDocuments(leadFilter);
    const newLeads = await Lead.countDocuments({
      ...leadFilter,
      status: "new",
    });
    const contactedLeads = await Lead.countDocuments({
      ...leadFilter,
      status: "contacted",
    });

    const pendingAssignments = isAgent
      ? await Lead.countDocuments({
          assignedAgent: agentId,
          assignmentStatus: "pending",
        })
      : 0;

    const activeDeals = await Deal.find({
      ...dealFilter,
      pipelineStage: { $nin: ["won", "lost"] },
    });
    const closedDeals = await Deal.find({
      ...dealFilter,
      pipelineStage: "won",
    });

    const totalValue = activeDeals.reduce(
      (sum, deal) => sum + deal.dealValue,
      0,
    );
    const totalRevenue = closedDeals.reduce(
      (sum, deal) => sum + deal.commissionAmount,
      0,
    );

    const conversionRate =
      totalLeads > 0 ? (closedDeals.length / totalLeads) * 100 : 0;

    // Leads assigned per agent (Only for Admin)
    let leadsPerAgent = [];
    if (!isAgent) {
      const User = require("../models/User");
      const agents = await User.find({ role: "agent" });
      leadsPerAgent = await Promise.all(
        agents.map(async (agent) => {
          const count = await Lead.countDocuments({ assignedAgent: agent._id });
          return { agentName: agent.name, count };
        }),
      );
    }

    // Monthly revenue for chart (remains as is for admin, but let's make it consistent)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push(d.toLocaleString("default", { month: "short" }));
    }

    const revenueStats = months.map((m) => ({
      name: m,
      revenue:
        Math.floor(Math.random() * (isAgent ? 500000 : 5000000)) +
        (isAgent ? 100000 : 1000000),
      deals: Math.floor(Math.random() * 5),
    }));

    // Lead Status Pipeline (Distribution)
    const pipelineStatuses = [
      "new",
      "contacted",
      "visit",
      "negotiation",
      "closed",
      "lost",
    ];
    const leadPipeline = await Promise.all(
      pipelineStatuses.map(async (status) => {
        const count = await Lead.countDocuments({ ...leadFilter, status });
        return {
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count,
        };
      }),
    );

    // Lead Priority Breakdown
    const highPriorityLeads = await Lead.countDocuments({
      ...leadFilter,
      priority: "high",
    });
    const mediumPriorityLeads = await Lead.countDocuments({
      ...leadFilter,
      priority: "medium",
    });

    // Lead Source Breakdown
    const sources = ["website", "facebook", "instagram", "referral", "other"];
    const sourceBreakdown = await Promise.all(
      sources.map(async (source) => {
        const count = await Lead.countDocuments({ ...leadFilter, source });
        return { name: source, value: count };
      }),
    );

    // Recent Activities (For Agent Focus)
    const Activity = require("../models/Activity");
    const recentActivities = await Activity.find({ assignedTo: agentId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("lead", "name");

    // Upcoming Tasks
    const upcomingTasks = await Activity.find({
      assignedTo: agentId,
      status: "pending",
      dueDate: { $gte: new Date() },
    })
      .sort({ dueDate: 1 })
      .limit(5)
      .populate("lead", "name");

    // Recent Lead Progress (Global feed for Admins, Agent-specific for Agents)
    const progressFilter = isAgent ? { assignedAgent: agentId } : {};
    const recentLeadProgress = await Lead.aggregate([
      { $match: progressFilter },
      { $unwind: "$progressLog" },
      { $sort: { "progressLog.timestamp": -1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: "users",
          localField: "progressLog.updatedBy",
          foreignField: "_id",
          as: "agentDetails",
        },
      },
      { $unwind: { path: "$agentDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          leadName: "$name",
          status: "$progressLog.status",
          notes: "$progressLog.notes",
          timestamp: "$progressLog.timestamp",
          agentName: "$agentDetails.name",
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalValue,
        activeDeals: activeDeals.length,
        closedDeals: closedDeals.length,
        totalLeads,
        newLeads,
        contactedLeads,
        highPriorityLeads,
        mediumPriorityLeads,
        conversionRate: conversionRate.toFixed(1),
        leadsPerAgent,
        totalProperties,
        totalRevenue,
        revenueStats,
        sourceBreakdown,
        leadPipeline,
        recentActivities,
        upcomingTasks,
        pendingAssignments,
        recentLeadProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
