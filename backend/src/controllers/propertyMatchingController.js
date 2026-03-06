const Lead = require("../models/Lead");
const Property = require("../models/Property");

// @desc    Get recommended properties for a lead
// @route   GET /api/properties/match/:leadId
// @access  Private
exports.getMatchingProperties = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    // 1. Fetch the lead
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" });
    }

    // Prepare query object
    let query = { status: "available" }; // Only match available properties

    // 2. Parse Lead Budget (handle strings like "2 Crore")
    if (lead.budget) {
      let maxBudget = 0;
      const budgetStr = lead.budget.toLowerCase().replace(/[^0-9.a-z]/g, ""); // Remove spaces/commas

      // Basic parsing for "crore" and "lakh"
      if (budgetStr.includes("cr")) {
        const val = parseFloat(
          budgetStr.replace("cr", "").replace("crore", ""),
        );
        maxBudget = val * 10000000;
      } else if (budgetStr.includes("lakh") || budgetStr.includes("lac")) {
        const val = parseFloat(
          budgetStr.replace("lakh", "").replace("lac", ""),
        );
        maxBudget = val * 100000;
      } else {
        maxBudget = parseFloat(budgetStr);
      }

      if (maxBudget > 0) {
        query.price = { $lte: maxBudget };
      }
    }

    // 3. Location Matching
    if (lead.preferredLocation) {
      // Using regex for a partial/case-insensitive match against city, street or title
      query["$or"] = [
        { "address.city": { $regex: new RegExp(lead.preferredLocation, "i") } },
        {
          "address.street": { $regex: new RegExp(lead.preferredLocation, "i") },
        },
        { title: { $regex: new RegExp(lead.preferredLocation, "i") } },
      ];
    }

    // 4. Property Type
    if (lead.preferredPropertyType && lead.preferredPropertyType !== "other") {
      // Assuming lead's preferredPropertyType aligns closely with Property.type enum
      query.type = lead.preferredPropertyType;
    }

    // 5. Bedrooms
    if (lead.bedrooms && lead.bedrooms > 0) {
      query["features.bedrooms"] = { $gte: lead.bedrooms };
    }

    // 6. Execute Query
    const properties = await Property.find(query)
      .sort({ price: -1 }) // Sort highest to lowest (closest to max budget first)
      .limit(5); // Limit to top 5 recommendations

    // Edge case if 0 properties matched, maybe fetch alternative properties
    // or just return empty for the UI to handle gracefully.

    res.status(200).json({
      success: true,
      count: properties.length,
      data: properties,
    });
  } catch (error) {
    next(error);
  }
};
