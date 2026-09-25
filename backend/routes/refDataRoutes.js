const express = require("express");
const { protect, requireRole } = require("../middleware/auth");
const { categoryCrud, supplierCrud, locationCrud } = require("../controllers/refDataController");

function buildRefRouter(crud) {
  const router = express.Router();
  router.use(protect);
  router.get("/", crud.list);
  router.get("/:id", crud.getOne);
  router.post("/", requireRole("ADMIN"), crud.create);
  router.put("/:id", requireRole("ADMIN"), crud.update);
  router.delete("/:id", requireRole("ADMIN"), crud.remove);
  return router;
}

module.exports = {
  categoryRoutes: buildRefRouter(categoryCrud),
  supplierRoutes: buildRefRouter(supplierCrud),
  locationRoutes: buildRefRouter(locationCrud),
};
