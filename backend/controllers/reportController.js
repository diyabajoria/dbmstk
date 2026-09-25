const Transaction = require("../models/Transaction");
const Item = require("../models/Item");

function dateRange(req) {
  const { from, to } = req.query;
  const match = {};

  if (from || to) {
    match.date = {};

    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  return match;
}

// Monthly spending: PURCHASE transactions for current household
async function spendingReport(req, res, next) {
  try {
    const pipeline = [
      {
        $match: {
          householdId: req.user.householdId,
          type: "PURCHASE",
          ...dateRange(req),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalSpent: { $sum: "$totalAmount" },
          purchaseCount: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ];

    res.json(await Transaction.aggregate(pipeline));
  } catch (err) {
    next(err);
  }
}

// Most consumed items: CONSUMPTION transactions for current household
async function consumptionReport(req, res, next) {
  try {
    const pipeline = [
      {
        $match: {
          householdId: req.user.householdId,
          type: "CONSUMPTION",
          ...dateRange(req),
        },
      },
      {
        $group: {
          _id: "$itemId",
          totalConsumed: { $sum: "$quantity" },
          events: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "_id",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $match: {
          "item.householdId": req.user.householdId,
        },
      },
      {
        $project: {
          itemName: "$item.name",
          totalConsumed: 1,
          events: 1,
        },
      },
      {
        $sort: {
          totalConsumed: -1,
        },
      },
    ];

    res.json(await Transaction.aggregate(pipeline));
  } catch (err) {
    next(err);
  }
}

// Category-wise spending for current household
async function categoryReport(req, res, next) {
  try {
    const pipeline = [
      {
        $match: {
          householdId: req.user.householdId,
          type: "PURCHASE",
          ...dateRange(req),
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "itemId",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },
      {
        $match: {
          "item.householdId": req.user.householdId,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "item.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $match: {
          "category.householdId": req.user.householdId,
        },
      },
      {
        $group: {
          _id: "$category.name",
          totalSpent: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: {
          totalSpent: -1,
        },
      },
    ];

    res.json(await Transaction.aggregate(pipeline));
  } catch (err) {
    next(err);
  }
}

// Waste report: expired batches belonging to current household
async function wasteReport(req, res, next) {
  try {
    const now = new Date();

    const pipeline = [
      {
        $match: {
          householdId: req.user.householdId,
        },
      },
      {
        $unwind: "$batches",
      },
      {
        $match: {
          "batches.expiryDate": { $lt: now },
          "batches.remainingQuantity": { $gt: 0 },
        },
      },
      {
        $project: {
          name: 1,
          categoryId: 1,
          wasteQty: "$batches.remainingQuantity",
          wasteValue: {
            $multiply: [
              "$batches.remainingQuantity",
              "$batches.pricePerUnit",
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalWasteValue: { $sum: "$wasteValue" },
          totalWasteQty: { $sum: "$wasteQty" },
          expiredBatchCount: { $sum: 1 },
        },
      },
    ];

    const result = await Item.aggregate(pipeline);

    res.json(
      result[0] || {
        totalWasteValue: 0,
        totalWasteQty: 0,
        expiredBatchCount: 0,
      }
    );
  } catch (err) {
    next(err);
  }
}

// Expiring batches report for current household
async function expiryReport(req, res, next) {
  try {
    const days = Number(req.query.days) || 30;
    const now = new Date();
    const window = new Date(
      now.getTime() + days * 24 * 60 * 60 * 1000
    );

    const pipeline = [
      {
        $match: {
          householdId: req.user.householdId,
        },
      },
      {
        $unwind: "$batches",
      },
      {
        $match: {
          "batches.expiryDate": { $lte: window },
          "batches.remainingQuantity": { $gt: 0 },
        },
      },
      {
        $project: {
          name: 1,
          batchNumber: "$batches.batchNumber",
          expiryDate: "$batches.expiryDate",
          remainingQuantity: "$batches.remainingQuantity",
        },
      },
      {
        $sort: {
          expiryDate: 1,
        },
      },
    ];

    res.json(await Item.aggregate(pipeline));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  spendingReport,
  consumptionReport,
  categoryReport,
  wasteReport,
  expiryReport,
};