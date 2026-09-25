const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Location = require("../models/Location");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");

// Generic CRUD factory — Category, Supplier, and Location are all simple
// flat collections. `withStats` lets each still get its own aggregate stats
// computed on top of shared list/getOne/create/update/remove handlers.
function makeCrud(Model, label, withStats) {
  return {
    list: async (req, res, next) => {
      try {
        const docs = await Model.find({
          householdId: req.user.householdId,
        })
          .sort({ name: 1 })
          .lean();

        if (!withStats) return res.json(docs);

        const enriched = await withStats(docs, req.user.householdId);
        res.json(enriched);
      } catch (err) {
        next(err);
      }
    },

    getOne: async (req, res, next) => {
      try {
        const doc = await Model.findOne({
          _id: req.params.id,
          householdId: req.user.householdId,
        });

        if (!doc) {
          return res.status(404).json({
            error: `${label} not found`,
          });
        }

        res.json(doc);
      } catch (err) {
        next(err);
      }
    },

    create: async (req, res, next) => {
      try {
        const doc = await Model.create({
          ...req.body,
          householdId: req.user.householdId,
        });

        res.status(201).json(doc);
      } catch (err) {
        next(err);
      }
    },

    update: async (req, res, next) => {
      try {
        // Never allow the client to change householdId.
        const updates = { ...req.body };
        delete updates.householdId;

        const doc = await Model.findOneAndUpdate(
          {
            _id: req.params.id,
            householdId: req.user.householdId,
          },
          updates,
          {
            new: true,
            runValidators: true,
          }
        );

        if (!doc) {
          return res.status(404).json({
            error: `${label} not found`,
          });
        }

        res.json(doc);
      } catch (err) {
        next(err);
      }
    },

    remove: async (req, res, next) => {
      try {
        const doc = await Model.findOneAndDelete({
          _id: req.params.id,
          householdId: req.user.householdId,
        });

        if (!doc) {
          return res.status(404).json({
            error: `${label} not found`,
          });
        }

        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  };
}

// Categories: itemCount + total inventory value
async function withCategoryStats(categories, householdId) {
  const items = await Item.find({
    householdId,
  }).lean();

  const statsByCategory = {};

  for (const item of items) {
    const catId = item.categoryId?.toString();

    if (!catId) continue;

    if (!statsByCategory[catId]) {
      statsByCategory[catId] = {
        itemCount: 0,
        inventoryValue: 0,
      };
    }

    statsByCategory[catId].itemCount++;

    for (const b of item.batches) {
      if (b.remainingQuantity > 0) {
        statsByCategory[catId].inventoryValue +=
          b.remainingQuantity * b.pricePerUnit;
      }
    }
  }

  return categories.map((c) => ({
    ...c,
    itemCount: statsByCategory[c._id.toString()]?.itemCount || 0,
    inventoryValue:
      Math.round(
        (statsByCategory[c._id.toString()]?.inventoryValue || 0) * 100
      ) / 100,
  }));
}

// Locations: itemCount + total inventory value
async function withLocationStats(locations, householdId) {
  const items = await Item.find({
    householdId,
  }).lean();

  const statsByLocation = {};

  for (const item of items) {
    const locId = item.locationId?.toString();

    if (!locId) continue;

    if (!statsByLocation[locId]) {
      statsByLocation[locId] = {
        itemCount: 0,
        inventoryValue: 0,
      };
    }

    statsByLocation[locId].itemCount++;

    for (const b of item.batches) {
      if (b.remainingQuantity > 0) {
        statsByLocation[locId].inventoryValue +=
          b.remainingQuantity * b.pricePerUnit;
      }
    }
  }

  return locations.map((l) => ({
    ...l,
    itemCount: statsByLocation[l._id.toString()]?.itemCount || 0,
    inventoryValue:
      Math.round(
        (statsByLocation[l._id.toString()]?.inventoryValue || 0) * 100
      ) / 100,
  }));
}

// Suppliers: purchaseCount + totalSpent
async function withSupplierStats(suppliers, householdId) {
  const agg = await Transaction.aggregate([
    {
      $match: {
        householdId,
        type: "PURCHASE",
        supplierId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$supplierId",
        purchaseCount: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
      },
    },
  ]);

  const bySupplier = {};

  for (const row of agg) {
    bySupplier[row._id.toString()] = row;
  }

  return suppliers.map((s) => ({
    ...s,
    purchaseCount: bySupplier[s._id.toString()]?.purchaseCount || 0,
    totalSpent:
      Math.round(
        (bySupplier[s._id.toString()]?.totalSpent || 0) * 100
      ) / 100,
  }));
}

module.exports = {
  categoryCrud: makeCrud(
    Category,
    "Category",
    withCategoryStats
  ),

  supplierCrud: makeCrud(
    Supplier,
    "Supplier",
    withSupplierStats
  ),

  locationCrud: makeCrud(
    Location,
    "Location",
    withLocationStats
  ),
};