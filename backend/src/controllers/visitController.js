const Visit = require("../models/Visit");

// @desc    Schedule a property visit
// @route   POST /api/visits
// @access  Private
exports.scheduleVisit = async (req, res) => {
  try {
    const { leadId, propertyId, visitDate, visitTime, notes } = req.body;

    const visit = await Visit.create({
      leadId,
      propertyId,
      agentId: req.user._id,
      visitDate,
      visitTime,
      notes,
    });

    res.status(201).json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get all visits for an agent
// @route   GET /api/visits/agent/:agentId
// @access  Private
exports.getAgentVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ agentId: req.params.agentId })
      .populate("leadId", "name email phone status")
      .populate("propertyId", "title location price images type")
      .sort({ visitDate: 1, visitTime: 1 });

    res.status(200).json({ success: true, count: visits.length, data: visits });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update visit status
// @route   PATCH /api/visits/:id/status
// @access  Private
exports.updateVisitStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res
        .status(404)
        .json({ success: false, message: "Visit not found" });
    }

    // Ensure user owns visit or is admin
    if (
      visit.agentId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Not authorized to update this visit",
        });
    }

    visit.status = status;
    await visit.save();

    res.status(200).json({ success: true, data: visit });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
