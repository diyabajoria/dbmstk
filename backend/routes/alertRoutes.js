const express = require("express");
const { protect } = require("../middleware/auth");
const { listAlerts, markAlertRead, triggerScan } = require("../controllers/alertController");
const router = express.Router();

router.use(protect);
router.get("/", listAlerts);
router.patch("/:id/read", markAlertRead);
router.post("/scan", triggerScan);

module.exports = router;
