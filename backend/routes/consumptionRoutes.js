const express = require("express");
const { protect } = require("../middleware/auth");
const { listConsumption, createConsumption } = require("../controllers/consumptionController");
const router = express.Router();

router.use(protect);
router.get("/", listConsumption);
router.post("/", createConsumption);

module.exports = router;
