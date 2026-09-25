// CLI: wipe the database and load the full sample household.
//   npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const { seedDemoData } = require("./demoData");

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected.");
    await seedDemoData({ reset: true });
  } catch (err) {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
