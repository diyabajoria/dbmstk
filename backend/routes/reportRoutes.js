const express = require("express");
const { protect } = require("../middleware/auth");
const {
  spendingReport,
  consumptionReport,
  categoryReport,
  wasteReport,
  expiryReport,
} = require("../controllers/reportController");
const router = express.Router();

router.use(protect);
router.get("/spending", spendingReport);
router.get("/consumption", consumptionReport);
router.get("/categories", categoryReport);
router.get("/waste", wasteReport);
router.get("/expiry", expiryReport);

module.exports = router;
