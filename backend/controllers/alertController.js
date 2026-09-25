const Alert = require("../models/Alert");
const { runAlertScan } = require("../services/alertService");

async function listAlerts(req, res, next) {
  try {
    const alerts = await Alert.find({
      householdId: req.user.householdId,
    })
      .populate("itemId")
      .sort({ createdAt: -1 });

    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

async function markAlertRead(req, res, next) {
  try {
    const alert = await Alert.findOneAndUpdate(
      {
        _id: req.params.id,
        householdId: req.user.householdId,
      },
      {
        isRead: true,
      },
      {
        new: true,
      }
    );

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found",
      });
    }

    res.json(alert);
  } catch (err) {
    next(err);
  }
}

async function triggerScan(req, res, next) {
  try {
    const results = await runAlertScan(req.user.householdId);

    res.json({
      message: "Alert scan complete",
      ...results,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAlerts,
  markAlertRead,
  triggerScan,
};