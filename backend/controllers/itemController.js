const Item = require("../models/Item");
const { getExpiryStatus, getNearestExpiry } = require("../services/expiryService");
const { getCurrentStock, isLowStock } = require("../services/stockService");

function itemInventoryValue(item) {
  return item.batches.reduce(
    (sum, b) =>
      b.remainingQuantity > 0
        ? sum + b.remainingQuantity * b.pricePerUnit
        : sum,
    0
  );
}

function serializeItem(item) {
  const obj = item.toObject({ virtuals: true });
  const nearest = getNearestExpiry(item);

  return {
    ...obj,
    currentStock: getCurrentStock(item),
    lowStock: isLowStock(item),
    nearestExpiry: nearest,
    inventoryValue: Math.round(itemInventoryValue(item) * 100) / 100,
  };
}

async function listItems(req, res, next) {
  try {
    const { search, categoryId, locationId, supplierId, sort } = req.query;

    const query = {
      householdId: req.user.householdId,
    };

    if (categoryId) query.categoryId = categoryId;
    if (locationId) query.locationId = locationId;
    if (supplierId) query["batches.supplierId"] = supplierId;

    let items = await Item.find(query).populate(
      "categoryId locationId batches.supplierId"
    );

    // Search across name, brand, category name, location name
    // (case-insensitive substring)
    if (search) {
      const term = search.toLowerCase();

      items = items.filter(
        (i) =>
          i.name?.toLowerCase().includes(term) ||
          i.brand?.toLowerCase().includes(term) ||
          i.categoryId?.name?.toLowerCase().includes(term) ||
          i.locationId?.name?.toLowerCase().includes(term)
      );
    }

    let result = items.map(serializeItem);

    // Expiry-status / low-stock filters applied after derived fields computed
    if (req.query.status) {
      result = result.filter(
        (i) => i.nearestExpiry?.status === req.query.status
      );
    }

    if (req.query.stockStatus === "LOW_STOCK") {
      result = result.filter((i) => i.lowStock);
    } else if (req.query.stockStatus === "HEALTHY") {
      result = result.filter((i) => !i.lowStock);
    }

    // Sorting: name, quantity, expiry date, inventory value, date added
    switch (sort) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "quantity":
        result.sort((a, b) => b.currentStock - a.currentStock);
        break;

      case "expiry":
        result.sort(
          (a, b) =>
            new Date(a.nearestExpiry?.expiryDate || "2999-12-31") -
            new Date(b.nearestExpiry?.expiryDate || "2999-12-31")
        );
        break;

      case "value":
        result.sort((a, b) => b.inventoryValue - a.inventoryValue);
        break;

      case "dateAdded":
        result.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;

      default:
        break;
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getItem(req, res, next) {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      householdId: req.user.householdId,
    }).populate("categoryId locationId batches.supplierId");

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(serializeItem(item));
  } catch (err) {
    next(err);
  }
}

async function createItem(req, res, next) {
  try {
    const {
      name,
      brand,
      categoryId,
      unit,
      minimumStock,
      locationId,
    } = req.body;

    const item = await Item.create({
      householdId: req.user.householdId,
      name,
      brand,
      categoryId,
      unit,
      minimumStock,
      locationId,
      batches: [],
    });

    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const item = await Item.findOneAndUpdate(
      {
        _id: req.params.id,
        householdId: req.user.householdId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
}

async function deleteItem(req, res, next) {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      householdId: req.user.householdId,
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
};