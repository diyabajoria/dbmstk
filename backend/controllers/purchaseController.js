const mongoose = require("mongoose");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");

async function listPurchases(req, res, next) {
  try {
    const purchases = await Transaction.find({ type: "PURCHASE" })
      .populate("itemId supplierId userId")
      .sort({ date: -1 });
    res.json(purchases);
  } catch (err) {
    next(err);
  }
}

/**
 * Add Purchase flow (Phase 6): find/create item -> create batch -> add batch
 * to item -> create PURCHASE transaction -> return updated data.
 * Wrapped in a MongoDB session/transaction so a failure rolls back both the
 * batch write and the transaction-log write together.
 */
async function createPurchase(req, res, next) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const {
      itemId, // existing item id, OR omit + pass newItem fields below
      newItem, // { name, brand, categoryId, unit, minimumStock, locationId }
      quantity,
      purchasePrice,
      purchaseDate,
      expiryDate,
      supplierId,
      batchNumber,
    } = req.body;

    if (!quantity || quantity <= 0) throw Object.assign(new Error("quantity must be > 0"), { status: 400 });
    if (!purchasePrice || purchasePrice < 0) throw Object.assign(new Error("purchasePrice must be >= 0"), { status: 400 });
    if (!expiryDate) throw Object.assign(new Error("expiryDate is required"), { status: 400 });

    let item;
    if (itemId) {
      item = await Item.findById(itemId).session(session);
      if (!item) throw Object.assign(new Error("Item not found"), { status: 404 });
    } else {
      if (!newItem) throw Object.assign(new Error("Provide itemId or newItem"), { status: 400 });
      const created = await Item.create([{ ...newItem, batches: [] }], { session });
      item = created[0];
    }

    const finalBatchNumber = batchNumber || `${item._id.toString().slice(-6)}-${Date.now()}`;

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

    res.status(201).json({ item, transaction: txn });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

module.exports = { listPurchases, createPurchase };
