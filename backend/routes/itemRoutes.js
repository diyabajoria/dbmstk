const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
} = require("../controllers/itemController");
const router = express.Router();

router.use(protect);
router.get("/", listItems);
router.get("/:id", getItem);
router.post("/", requireRole("ADMIN"), createItem);
router.put("/:id", requireRole("ADMIN"), updateItem);
router.delete("/:id", requireRole("ADMIN"), deleteItem);

module.exports = router;
