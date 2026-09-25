require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");

const User = require("../models/User");
const Household = require("../models/Household");
const Category = require("../models/Category");
const Location = require("../models/Location");
const Supplier = require("../models/Supplier");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");
const Alert = require("../models/Alert");

const DEMO_EMAILS = [
  "admin@household.local",
  "raj@household.local",
  "priya@household.local",
];

async function migrate() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");
    console.log("Starting household migration...\n");

    // --------------------------------------------------
    // 1. Find existing users
    // --------------------------------------------------

    const users = await User.find({}).lean();

    console.log(`Found ${users.length} existing users.`);

    // --------------------------------------------------
    // 2. Create/find the Demo Household
    // --------------------------------------------------

    const demoAdmin = users.find(
      (user) => user.email === "admin@household.local"
    );

    let demoHousehold = await Household.findOne({
      name: "Demo Household",
    });

    if (!demoHousehold) {
      demoHousehold = await Household.create({
        name: "Demo Household",
        createdBy: demoAdmin?._id,
      });

      console.log("Created Demo Household.");
    } else {
      console.log("Demo Household already exists.");
    }

    // --------------------------------------------------
    // 3. Assign demo users to Demo Household
    // --------------------------------------------------

    for (const email of DEMO_EMAILS) {
      const user = await User.findOne({ email });

      if (!user) {
        console.log(`Demo user not found: ${email}`);
        continue;
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { householdId: demoHousehold._id } }
      );

      console.log(`Assigned ${email} → Demo Household`);
    }

    // --------------------------------------------------
    // 4. Give every non-demo user their own household
    // --------------------------------------------------

    const nonDemoUsers = users.filter(
      (user) => !DEMO_EMAILS.includes(user.email)
    );

    for (const user of nonDemoUsers) {
      if (user.householdId) {
        console.log(
          `${user.email} already has a household — skipping.`
        );
        continue;
      }

      const householdName = `${user.name}'s Household`;

      const household = await Household.create({
        name: householdName,
        createdBy: user._id,
      });

      await User.updateOne(
        { _id: user._id },
        { $set: { householdId: household._id } }
      );

      console.log(
        `Created ${householdName} for ${user.email}`
      );
    }

    // --------------------------------------------------
    // 5. Move existing reference data to Demo Household
    // --------------------------------------------------

    const categoryResult = await Category.updateMany(
      { householdId: { $exists: false } },
      { $set: { householdId: demoHousehold._id } }
    );

    const locationResult = await Location.updateMany(
      { householdId: { $exists: false } },
      { $set: { householdId: demoHousehold._id } }
    );

    const supplierResult = await Supplier.updateMany(
      { householdId: { $exists: false } },
      { $set: { householdId: demoHousehold._id } }
    );

    console.log(
      `\nReference data migrated:`
    );

    console.log(
      `Categories: ${categoryResult.modifiedCount}`
    );

    console.log(
      `Locations: ${locationResult.modifiedCount}`
    );

    console.log(
      `Suppliers: ${supplierResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 6. Move existing inventory to Demo Household
    // --------------------------------------------------

    const itemResult = await Item.updateMany(
      { householdId: { $exists: false } },
      { $set: { householdId: demoHousehold._id } }
    );

    console.log(
      `Items migrated: ${itemResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 7. Move existing transactions to Demo Household
    // --------------------------------------------------

    const transactionResult = await Transaction.updateMany(
      { householdId: { $exists: false } },
      { $set: { householdId: demoHousehold._id } }
    );

    console.log(
      `Transactions migrated: ${transactionResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 8. Move existing alerts to Demo Household
    // --------------------------------------------------

    const alertResult = await Alert.updateMany(
      { householdId: { $exists: false } },
      { $set: { householdId: demoHousehold._id } }
    );

    console.log(
      `Alerts migrated: ${alertResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 9. Update Demo Household creator
    // --------------------------------------------------

    if (demoAdmin) {
      await Household.updateOne(
        { _id: demoHousehold._id },
        { $set: { createdBy: demoAdmin._id } }
      );
    }

    // --------------------------------------------------
    // 10. Final verification
    // --------------------------------------------------

    console.log("\n========== MIGRATION SUMMARY ==========");

    const householdCount = await Household.countDocuments();

    const usersWithHousehold = await User.countDocuments({
      householdId: { $exists: true },
    });

    const itemsWithHousehold = await Item.countDocuments({
      householdId: { $exists: true },
    });

    const categoriesWithHousehold = await Category.countDocuments({
      householdId: { $exists: true },
    });

    const locationsWithHousehold = await Location.countDocuments({
      householdId: { $exists: true },
    });

    const suppliersWithHousehold = await Supplier.countDocuments({
      householdId: { $exists: true },
    });

    const transactionsWithHousehold =
      await Transaction.countDocuments({
        householdId: { $exists: true },
      });

    const alertsWithHousehold = await Alert.countDocuments({
      householdId: { $exists: true },
    });

    console.log(`Households: ${householdCount}`);
    console.log(`Users with household: ${usersWithHousehold}`);
    console.log(`Items with household: ${itemsWithHousehold}`);
    console.log(`Categories with household: ${categoriesWithHousehold}`);
    console.log(`Locations with household: ${locationsWithHousehold}`);
    console.log(`Suppliers with household: ${suppliersWithHousehold}`);
    console.log(`Transactions with household: ${transactionsWithHousehold}`);
    console.log(`Alerts with household: ${alertsWithHousehold}`);

    console.log("\nMigration completed successfully.");
  } catch (error) {
    console.error("\nMigration failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrate();