const express = require("express");
const { body } = require("express-validator");
const multer = require("multer");
const path = require("path");
const { auth, agentOrAdminAuth } = require("../middleware/auth");
const Property = require("../models/Property");

const router = express.Router();

// Helper: parse bracket-notation FormData fields into nested object
function parseBracketFields(body) {
  const result = {};
  for (const key of Object.keys(body)) {
    const match = key.match(/^(\w+)\[(\w+)\]$/);
    if (match) {
      const [, parent, child] = match;
      if (!result[parent]) result[parent] = {};
      result[parent][child] = body[key];
    } else {
      result[key] = body[key];
    }
  }
  return result;
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/properties/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// All routes require authentication
router.use(auth);

// Validation rules
const createPropertyValidation = [
  body("title").notEmpty().withMessage("Property title is required"),
  body("description")
    .notEmpty()
    .withMessage("Property description is required"),
  body("type")
    .isIn(["apartment", "house", "villa", "commercial", "land"])
    .withMessage("Invalid property type"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("address.city").notEmpty().withMessage("City is required"),
  body("features.area").isNumeric().withMessage("Area must be a number"),
];

// @desc    Get all properties
// @route   GET /api/properties
// @access  Private
router.get("/", agentOrAdminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.minPrice)
      filter.price = { $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice)
      filter.price = { ...filter.price, $lte: parseFloat(req.query.maxPrice) };
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // If agent, only show their properties
    if (req.user.role === "agent") {
      filter.listedBy = req.user._id;
    }

    const properties = await Property.find(filter)
      .populate("listedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Property.countDocuments(filter);

    res.json({
      success: true,
      data: properties,
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

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Private
router.get("/:id", agentOrAdminAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      "listedBy",
      "name email phone",
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      property.listedBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Increment views
    property.views += 1;
    await property.save();

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// @desc    Create property
// @route   POST /api/properties
// @access  Private
router.post(
  "/",
  agentOrAdminAuth,
  upload.array("images", 10),
  createPropertyValidation,
  async (req, res) => {
    try {
      const propertyData = parseBracketFields(req.body);

      // Set listed by
      propertyData.listedBy = req.user._id;

      // Process images
      if (req.files && req.files.length > 0) {
        propertyData.images = req.files.map((file, index) => ({
          url: `/uploads/properties/${file.filename}`,
          isMain: index === 0,
        }));
      }

      const property = await Property.create(propertyData);
      await property.populate("listedBy", "name email");

      res.status(201).json({
        success: true,
        message: "Property created successfully",
        data: property,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private
router.put(
  "/:id",
  agentOrAdminAuth,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const property = await Property.findById(req.params.id);

      if (!property) {
        return res.status(404).json({
          success: false,
          message: "Property not found",
        });
      }

      // Check permissions
      if (
        req.user.role === "agent" &&
        property.listedBy?.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const updateData = parseBracketFields(req.body);

      // Process new images if uploaded
      if (req.files && req.files.length > 0) {
        const newImages = req.files.map((file) => ({
          url: `/uploads/properties/${file.filename}`,
          isMain: false,
        }));

        if (updateData.replaceImages === "true") {
          updateData.images = newImages;
        } else {
          updateData.images = [...(property.images || []), ...newImages];
        }
      }

      const updatedProperty = await Property.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      ).populate("listedBy", "name email");

      res.json({
        success: true,
        message: "Property updated successfully",
        data: updatedProperty,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
);

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private
router.delete("/:id", agentOrAdminAuth, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    // Check permissions
    if (
      req.user.role === "agent" &&
      property.listedBy?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await property.deleteOne();

    res.json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
