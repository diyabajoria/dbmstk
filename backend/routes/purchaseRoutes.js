const express = require("express");
const { protect } = require("../middleware/auth");
const { listPurchases, createPurchase } = require("../controllers/purchaseController");
const router = express.Router();

router.use(protect);
router.get("/", listPurchases);
router.post("/", createPurchase);

module.exports = router;
