const express = require('express');
const { body } = require('express-validator');
const { auth, agentOrAdminAuth } = require('../middleware/auth');
const Activity = require('../models/Activity');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Validation rules
const createActivityValidation = [
  body('type').isIn(['call', 'email', 'meeting', 'site-visit', 'note', 'task', 'reminder']).withMessage('Invalid activity type'),
  body('title').notEmpty().withMessage('Activity title is required'),
  body('assignedTo').isMongoId().withMessage('Valid assigned user ID is required')
];

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
router.get('/', agentOrAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.lead) filter.lead = req.query.lead;
    if (req.query.deal) filter.deal = req.query.deal;

    // If agent, only show their assigned activities
    if (req.user.role === 'agent') {
      filter.assignedTo = req.user._id;
    }

    const activities = await Activity.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('lead', 'name')
      .populate('deal', 'title')
      .populate('property', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get single activity
// @route   GET /api/activities/:id
// @access  Private
router.get('/:id', agentOrAdminAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('assignedTo', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('lead', 'name email phone')
      .populate('deal', 'title status')
      .populate('property', 'title address');

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (req.user.role === 'agent' && 
        activity.assignedTo?.toString() !== req.user._id.toString() &&
        activity.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Create activity
// @route   POST /api/activities
// @access  Private
router.post('/', agentOrAdminAuth, createActivityValidation, async (req, res) => {
  try {
    const activityData = { ...req.body };

    // Set created by
    activityData.createdBy = req.user._id;

    // If agent, can only assign to themselves
    if (req.user.role === 'agent') {
      activityData.assignedTo = req.user._id;
    }

    const activity = await Activity.create(activityData);
    await activity.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'lead', select: 'name' },
      { path: 'deal', select: 'title' },
      { path: 'property', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
router.put('/:id', agentOrAdminAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (req.user.role === 'agent' && 
        activity.assignedTo?.toString() !== req.user._id.toString() &&
        activity.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If completing activity, set completedAt
    if (req.body.status === 'completed' && activity.status !== 'completed') {
      req.body.completedAt = new Date();
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
      { path: 'lead', select: 'name' },
      { path: 'deal', select: 'title' },
      { path: 'property', select: 'title' }
    ]);

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: updatedActivity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
router.delete('/:id', agentOrAdminAuth, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check permissions
    if (req.user.role === 'agent' && 
        activity.assignedTo?.toString() !== req.user._id.toString() &&
        activity.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await activity.deleteOne();

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get today's activities
// @route   GET /api/activities/today
// @access  Private
router.get('/today/list', agentOrAdminAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = {
      dueDate: {
        $gte: today,
        $lt: tomorrow
      }
    };

    // If agent, only show their assigned activities
    if (req.user.role === 'agent') {
      filter.assignedTo = req.user._id;
    }

    const activities = await Activity.find(filter)
      .populate('assignedTo', 'name email')
      .populate('lead', 'name')
      .populate('deal', 'title')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
