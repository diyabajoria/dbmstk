const express = require("express");
const { protect } = require("../middleware/auth");
const Item = require("../models/Item");
const Category = require("../models/Category");
const { seedDemoData } = require("../seed/demoData");
const { runAlertScan } = require("../services/alertService");

const router = express.Router();
router.use(protect);

// Lets the UI know whether the household is still empty.
router.get("/status", async (req, res, next) => {
  try {
    const [items, categories] = await Promise.all([Item.countDocuments(), Category.countDocuments()]);
    res.json({ items, categories, empty: items === 0 });
  } catch (err) {
    next(err);
  }
});

// Non-destructive: only fills in what is missing and only adds sample items
// when the inventory is completely empty, so it can never overwrite real data.
router.post("/sample-data", async (req, res, next) => {
  try {
    const result = await seedDemoData({ reset: false });
    if (result.seededItems) await runAlertScan().catch(() => {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
