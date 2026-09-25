require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const consumptionRoutes = require("./routes/consumptionRoutes");
const alertRoutes = require("./routes/alertRoutes");
const reportRoutes = require("./routes/reportRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const {
  categoryRoutes,
  supplierRoutes,
  locationRoutes,
} = require("./routes/refDataRoutes");
const { runAlertScan } = require("./services/alertService");
const setupRoutes = require("./routes/setupRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/consumption", consumptionRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/setup", setupRoutes);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  // Sample data is already stored in the Demo Household.
  // Do not automatically seed on every backend startup because
  // newly registered households must remain empty.

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  // Alert scan: run once on boot, then every 24h. Also exposed manually via
  // POST /api/alerts/scan for on-demand refresh from the dashboard.
  runAlertScan().catch((err) =>
    console.error("Initial alert scan failed:", err.message)
  );

  setInterval(() => {
    runAlertScan().catch((err) =>
      console.error("Scheduled alert scan failed:", err.message)
    );
  }, 24 * 60 * 60 * 1000);
});

module.exports = app;