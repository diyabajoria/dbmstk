const express = require("express");
const { protect } = require("../middleware/auth");
const { dashboardSummary } = require("../controllers/dashboardController");
const router = express.Router();

router.use(protect);
router.get("/summary", dashboardSummary);

module.exports = router;
