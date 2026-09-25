const express = require("express");

const { protect } = require("../middleware/auth");

const Item = require("../models/Item");
const Category = require("../models/Category");
const Household = require("../models/Household");

const { seedDemoData } = require("../seed/demoData");
const { runAlertScan } = require("../services/alertService");

const router = express.Router();

router.use(protect);

// Lets the UI know whether the current household is still empty.
router.get("/status", async (req, res, next) => {
  try {
    const householdId = req.user.householdId;

    const [items, categories] = await Promise.all([
      Item.countDocuments({ householdId }),
      Category.countDocuments({ householdId }),
    ]);

    res.json({
      items,
      categories,
      empty: items === 0,
    });
  } catch (err) {
    next(err);
  }
});

// Sample data is only available to the Demo Household.
// New customer households must remain independent and empty.
router.post("/sample-data", async (req, res, next) => {
  try {
    const demoHousehold = await Household.findOne({
      name: "Demo Household",
    });

    if (
      !demoHousehold ||
      demoHousehold._id.toString() !== req.user.householdId.toString()
    ) {
      return res.status(403).json({
        error: "Sample data is only available for the Demo Household",
      });
    }

    const result = await seedDemoData({ reset: false });

    if (result.seededItems) {
      await runAlertScan(req.user.householdId).catch(() => {});
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;