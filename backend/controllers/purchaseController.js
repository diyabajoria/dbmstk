const mongoose = require("mongoose");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");
const Supplier = require("../models/Supplier");
const Category = require("../models/Category");
const Location = require("../models/Location");

async function listPurchases(req, res, next) {
  try {
    const purchases = await Transaction.find({
      householdId: req.user.householdId,
      type: "PURCHASE",
    })
      .populate("itemId supplierId userId")
      .sort({ date: -1 });

    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

/**
 * Add Purchase flow:
 * find/create item -> create batch -> add batch
 * to item -> create PURCHASE transaction -> return updated data.
 *
 * All data is restricted to the authenticated user's household.
 */
async function createPurchase(req, res, next) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      itemId,
      newItem,
      quantity,
      purchasePrice,
      purchaseDate,
      expiryDate,
      supplierId,
      batchNumber,
    } = req.body;

    const householdId = req.user.householdId;

    if (!quantity || quantity <= 0) {
      throw Object.assign(
        new Error("quantity must be > 0"),
        { status: 400 }
      );
    }

    if (purchasePrice === undefined || purchasePrice < 0) {
      throw Object.assign(
        new Error("purchasePrice must be >= 0"),
        { status: 400 }
      );
    }

    if (!expiryDate) {
      throw Object.assign(
        new Error("expiryDate is required"),
        { status: 400 }
      );
    }

    // Validate supplier belongs to the current household.
    if (supplierId) {
      const supplier = await Supplier.findOne({
        _id: supplierId,
        householdId,
      }).session(session);

      if (!supplier) {
        throw Object.assign(
          new Error("Supplier not found"),
          { status: 404 }
        );
      }
    }

    let item;

    if (itemId) {
      // Only allow purchasing into an item from this household.
      item = await Item.findOne({
        _id: itemId,
        householdId,
      }).session(session);

      if (!item) {
        throw Object.assign(
          new Error("Item not found"),
          { status: 404 }
        );
      }
    } else {
      if (!newItem) {
        throw Object.assign(
          new Error("Provide itemId or newItem"),
          { status: 400 }
        );
      }

      // Validate referenced category belongs to this household.
      if (newItem.categoryId) {
        const category = await Category.findOne({
          _id: newItem.categoryId,
          householdId,
        }).session(session);

        if (!category) {
          throw Object.assign(
            new Error("Category not found"),
            { status: 404 }
          );
        }
      }

      // Validate referenced location belongs to this household.
      if (newItem.locationId) {
        const location = await Location.findOne({
          _id: newItem.locationId,
          householdId,
        }).session(session);

        if (!location) {
          throw Object.assign(
            new Error("Location not found"),
            { status: 404 }
          );
        }
      }

      const created = await Item.create(
        [
          {
            ...newItem,
            householdId,
            batches: [],
          },
        ],
        { session }
      );

      item = created[0];
    }

    const finalBatchNumber =
      batchNumber ||
      `${item._id.toString().slice(-6)}-${Date.now()}`;

    item.batches.push({
      batchNumber: finalBatchNumber,
      purchaseDate: purchaseDate || new Date(),
      expiryDate,
      purchasedQuantity: quantity,
      remainingQuantity: quantity,
      pricePerUnit: purchasePrice,
      supplierId: supplierId || undefined,
    });

    await item.save({ session });

    const [txn] = await Transaction.create(
      [
        {
          householdId,
          type: "PURCHASE",
          itemId: item._id,
          batchNumber: finalBatchNumber,
          quantity,
          unitPrice: purchasePrice,
          totalAmount: quantity * purchasePrice,
          supplierId: supplierId || undefined,
          userId: req.user.id,
          date: purchaseDate || new Date(),
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      item,
      transaction: txn,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

module.exports = {
  listPurchases,
  createPurchase,
};