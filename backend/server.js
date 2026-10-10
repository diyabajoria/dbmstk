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
const isVercel = Boolean(process.env.VERCEL);

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// A serverless invocation must wait for MongoDB before any route touches a
// model. Locally this reuses the connection opened before app.listen().
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

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

// Vercel invokes the exported Express app as a serverless function. The
// listener and in-memory scheduler belong only to the long-running local
// server; alerts can still be refreshed through POST /api/alerts/scan.
if (!isVercel) {
  connectDB().then(async () => {

    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    runAlertScan().catch((err) =>
      console.error("Initial alert scan failed:", err.message)
    );

    setInterval(() => {
      runAlertScan().catch((err) =>
        console.error("Scheduled alert scan failed:", err.message)
      );
    }, 24 * 60 * 60 * 1000);
  }).catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
}

module.exports = app;
