const mongoose = require("mongoose");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");
const { applyFefoConsumption } = require("../services/fefoService");

async function listConsumption(req, res, next) {
  try {
    const consumption = await Transaction.find({
      householdId: req.user.householdId,
      type: "CONSUMPTION",
    })
      .populate("itemId userId")
      .sort({ date: -1 });

    res.json(consumption);
  } catch (err) {
    next(err);
  }
}

/**
 * Record Consumption flow:
 * user picks item + quantity only.
 * Backend runs FEFO to pick batch(es) automatically, deducts stock, and
 * writes one CONSUMPTION transaction per affected batch.
 *
 * All operations are restricted to the authenticated user's household.
 */
async function createConsumption(req, res, next) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { itemId, quantity, date, note } = req.body;
    const householdId = req.user.householdId;

    if (!itemId) {
      throw Object.assign(
        new Error("itemId is required"),
        { status: 400 }
      );
    }

    if (!quantity || quantity <= 0) {
      throw Object.assign(
        new Error("quantity must be > 0"),
        { status: 400 }
      );
    }

    // Only allow consumption from an item belonging
    // to the current user's household.
    const item = await Item.findOne({
      _id: itemId,
      householdId,
    }).session(session);

    if (!item) {
      throw Object.assign(
        new Error("Item not found"),
        { status: 404 }
      );
    }

    // Mutates item.batches in place; throws if
    // total available stock is insufficient.
    const deductions = applyFefoConsumption(item, quantity);

    await item.save({ session });

    const txnDocs = deductions.map((d) => ({
      householdId,
      type: "CONSUMPTION",
      itemId: item._id,
      batchNumber: d.batchNumber,
      quantity: d.quantity,
      userId: req.user.id,
      date: date || new Date(),
      note,
    }));

    const created = await Transaction.create(
      txnDocs,
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      item,
      transactions: created,
      deductions,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

module.exports = {
  listConsumption,
  createConsumption,
};