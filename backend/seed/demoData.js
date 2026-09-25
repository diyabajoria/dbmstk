const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Category = require("../models/Category");
const Supplier = require("../models/Supplier");
const Location = require("../models/Location");
const Item = require("../models/Item");
const Transaction = require("../models/Transaction");

// ---------- date helpers ----------
const DAY = 24 * 60 * 60 * 1000;
function daysFromNow(days) {
  return new Date(Date.now() + days * DAY);
}
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomFloat(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Math.round(v * 10 ** decimals) / 10 ** decimals;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}


async function findOrCreate(Model, filter, data) {
  const existing = await Model.findOne(filter);
  if (existing) return existing;
  return Model.create(data || filter);
}

const DEMO_USERS = [
  { name: "Anita Sharma", email: "admin@household.local", role: "ADMIN" },
  { name: "Raj Sharma", email: "raj@household.local", role: "MEMBER" },
  { name: "Priya Sharma", email: "priya@household.local", role: "MEMBER" },
];

const CATEGORY_NAMES = [
  "Staples",
  "Dairy",
  "Spices & Seasonings",
  "Beverages",
  "Snacks & Bakery",
  "Cooking Essentials",
  "Personal Care",
  "Household & Cleaning",
  "Fruits & Vegetables",
  "Medicines & Wellness",
];

const LOCATION_NAMES = ["Kitchen", "Kitchen Cabinet", "Pantry", "Refrigerator", "Freezer", "Bathroom", "Utility Room", "Storage Room"];

const SUPPLIER_DATA = [
  { name: "Gupta Ji Provisions (Local Kirana Store)", contactPerson: "Manoj Gupta", phone: "9810012345", email: "manoj.kirana@example.com", address: "Shop 4, Lajpat Nagar Market" },
  { name: "DMart", contactPerson: "Store Manager", phone: "9820023456", email: "support@dmart.example", address: "DMart, Sector 18" },
  { name: "Reliance Smart Bazaar", contactPerson: "Sunita Rao", phone: "9830034567", email: "care@reliancesmart.example", address: "Reliance Smart Bazaar, MG Road" },
  { name: "BigBasket", contactPerson: "Support Team", phone: "9840045678", email: "support@bigbasket.example", address: "Online — bigbasket.com" },
  { name: "Blinkit", contactPerson: "Support Team", phone: "9850056789", email: "help@blinkit.example", address: "Online — blinkit.com" },
  { name: "Zepto", contactPerson: "Support Team", phone: "9860067890", email: "help@zepto.example", address: "Online — zepto.com" },
  { name: "Apollo Pharmacy", contactPerson: "Deepa Iyer", phone: "9870078901", email: "care@apollopharmacy.example", address: "Apollo Pharmacy, Ring Road" },
];

/**
 * Populates the database with a realistic sample household.
 *
 * - reset: true  -> wipes every collection (including users) first. Used by
 *                   `npm run seed`.
 * - reset: false -> non-destructive. Reference data (categories, locations,
 *                   suppliers, demo users) is created only where missing, and
 *                   items + transaction history are added only when the
 *                   inventory is completely empty. Safe to call on every boot.
 *
 * Returns { seededItems, items, transactions }.
 */
async function seedDemoData({ reset = false, log = console.log } = {}) {
  if (reset) {
    log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Location.deleteMany({}),
      Item.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
  }

  // ---------- Users ----------
  const passwordHash = await bcrypt.hash("password123", 10);
  const demoUsers = [];
  for (const u of DEMO_USERS) {
    demoUsers.push(await findOrCreate(User, { email: u.email }, { ...u, passwordHash }));
  }
  // Attribute history to everyone in the household (demo + real accounts)
  const allUsers = await User.find();
  const users = allUsers.length ? allUsers : demoUsers;

  // ---------- Categories / Locations / Suppliers ----------
  const categories = {};
  for (const name of CATEGORY_NAMES) categories[name] = await findOrCreate(Category, { name });

  const locations = {};
  for (const name of LOCATION_NAMES) locations[name] = await findOrCreate(Location, { name });

  const suppliers = [];
  for (const s of SUPPLIER_DATA) suppliers.push(await findOrCreate(Supplier, { name: s.name }, s));
  const [KIRANA, DMART, RELIANCE, BIGBASKET, BLINKIT, ZEPTO, APOLLO] = suppliers;

  const existingItems = await Item.countDocuments();
  if (existingItems > 0) {
    log(`Inventory already has ${existingItems} items — reference data checked, no sample items added.`);
    return { seededItems: false, items: existingItems, transactions: 0 };
  }

  // ---------- Item templates ----------
  // shelfLifeDays: typical days from purchase to expiry (used to build batches)
  // priceRange: [min, max] price per unit in INR
  const ITEM_TEMPLATES = [
    // Staples
    { name: "Sharbati Atta", brand: "Aashirvaad", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 5, priceRange: [58, 65], shelfLifeDays: 150, batchSizes: [5, 10], suppliers: [DMART, KIRANA] },
    { name: "Basmati Rice", brand: "India Gate", category: "Staples", location: "Pantry", unit: "kg", minimumStock: 5, priceRange: [85, 95], shelfLifeDays: 365, batchSizes: [5, 10], suppliers: [DMART, RELIANCE] },
    { name: "Toor Dal", brand: "Tata Sampann", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, priceRange: [140, 160], shelfLifeDays: 240, batchSizes: [1, 2], suppliers: [DMART, BIGBASKET] },
    { name: "Chana Dal", brand: "Tata Sampann", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, priceRange: [110, 125], shelfLifeDays: 240, batchSizes: [1], suppliers: [DMART, BIGBASKET] },
    { name: "Rajma Chitra", brand: "Rajma Chitra", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, priceRange: [130, 150], shelfLifeDays: 240, batchSizes: [1], suppliers: [KIRANA] },
    { name: "Besan", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "g", minimumStock: 500, priceRange: [65, 80], shelfLifeDays: 150, batchSizes: [500], suppliers: [KIRANA, DMART] },
    { name: "Maida", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, priceRange: [42, 50], shelfLifeDays: 150, batchSizes: [1], suppliers: [KIRANA] },
    { name: "Suji / Rava", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "g", minimumStock: 500, priceRange: [40, 50], shelfLifeDays: 150, batchSizes: [500], suppliers: [KIRANA] },

    // Dairy
    { name: "Taaza Homogenised Milk", brand: "Amul", category: "Dairy", location: "Refrigerator", unit: "L", minimumStock: 2, priceRange: [28, 32], shelfLifeDays: 4, batchSizes: [2], suppliers: [ZEPTO, BLINKIT, KIRANA] },
    { name: "Butter", brand: "Amul", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 200, priceRange: [255, 270], shelfLifeDays: 90, batchSizes: [500], suppliers: [DMART, BLINKIT] },
    { name: "Malai Paneer", brand: "Amul", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 200, priceRange: [90, 100], shelfLifeDays: 10, batchSizes: [200], suppliers: [ZEPTO, BLINKIT] },
    { name: "Curd", brand: "Mother Dairy", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 400, priceRange: [30, 38], shelfLifeDays: 6, batchSizes: [400], suppliers: [ZEPTO, KIRANA] },
    { name: "Cheese Slices", brand: "Amul", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 100, priceRange: [115, 130], shelfLifeDays: 120, batchSizes: [200], suppliers: [DMART, BLINKIT] },

    // Spices & Seasonings
    { name: "Salt", brand: "Tata Salt", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, priceRange: [22, 28], shelfLifeDays: 720, batchSizes: [1], suppliers: [KIRANA, DMART] },
    { name: "Turmeric Powder", brand: "Everest", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, priceRange: [42, 50], shelfLifeDays: 365, batchSizes: [200], suppliers: [DMART, BIGBASKET] },
    { name: "Garam Masala", brand: "Everest", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 50, priceRange: [65, 78], shelfLifeDays: 365, batchSizes: [100], suppliers: [DMART, BIGBASKET] },
    { name: "Deggi Mirch", brand: "MDH", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 50, priceRange: [55, 65], shelfLifeDays: 365, batchSizes: [100], suppliers: [KIRANA] },
    { name: "Chana Masala", brand: "MDH", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 50, priceRange: [58, 68], shelfLifeDays: 365, batchSizes: [100], suppliers: [KIRANA] },
    { name: "Cumin Seeds (Jeera)", brand: "Catch", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, priceRange: [85, 100], shelfLifeDays: 365, batchSizes: [200], suppliers: [DMART] },
    { name: "Coriander Powder", brand: "Everest", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, priceRange: [48, 58], shelfLifeDays: 365, batchSizes: [200], suppliers: [DMART] },

    // Cooking Essentials
    { name: "Sunflower Oil", brand: "Fortune", category: "Cooking Essentials", location: "Kitchen Cabinet", unit: "L", minimumStock: 1, priceRange: [125, 145], shelfLifeDays: 270, batchSizes: [1], suppliers: [DMART, RELIANCE] },
    { name: "Mustard Oil", brand: "Fortune", category: "Cooking Essentials", location: "Kitchen Cabinet", unit: "L", minimumStock: 1, priceRange: [140, 160], shelfLifeDays: 270, batchSizes: [1], suppliers: [DMART] },
    { name: "Gold Cooking Oil", brand: "Saffola", category: "Cooking Essentials", location: "Pantry", unit: "L", minimumStock: 2, priceRange: [130, 150], shelfLifeDays: 270, batchSizes: [5], suppliers: [RELIANCE, DMART] },

    // Beverages
    { name: "Tea Gold", brand: "Tata Tea", category: "Beverages", location: "Kitchen Cabinet", unit: "g", minimumStock: 200, priceRange: [230, 260], shelfLifeDays: 365, batchSizes: [500], suppliers: [DMART, KIRANA] },
    { name: "Taj Mahal Tea", brand: "Brooke Bond", category: "Beverages", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, priceRange: [130, 150], shelfLifeDays: 365, batchSizes: [250], suppliers: [DMART] },
    { name: "Classic Instant Coffee", brand: "Nescafé", category: "Beverages", location: "Kitchen Cabinet", unit: "g", minimumStock: 50, priceRange: [270, 300], shelfLifeDays: 545, batchSizes: [100], suppliers: [DMART, BIGBASKET] },
    { name: "Mixed Fruit Juice", brand: "Real", category: "Beverages", location: "Refrigerator", unit: "L", minimumStock: 1, priceRange: [110, 125], shelfLifeDays: 30, batchSizes: [1], suppliers: [ZEPTO, BLINKIT] },

    // Snacks & Bakery
    { name: "100% Whole Wheat Bread", brand: "Britannia", category: "Snacks & Bakery", location: "Kitchen", unit: "g", minimumStock: 400, priceRange: [48, 55], shelfLifeDays: 4, batchSizes: [400], suppliers: [ZEPTO, KIRANA] },
    { name: "Gold Biscuits", brand: "Parle-G", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, priceRange: [95, 110], shelfLifeDays: 150, batchSizes: [1], suppliers: [KIRANA, DMART] },
    { name: "Alu Bhujia", brand: "Haldiram's", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "g", minimumStock: 200, priceRange: [70, 85], shelfLifeDays: 90, batchSizes: [400], suppliers: [DMART, BLINKIT] },
    { name: "Marie Gold", brand: "Britannia", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "g", minimumStock: 150, priceRange: [38, 45], shelfLifeDays: 150, batchSizes: [300], suppliers: [KIRANA] },
    { name: "2-Minute Noodles (4-pack)", brand: "Maggi", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "pcs", minimumStock: 4, priceRange: [56, 64], shelfLifeDays: 240, batchSizes: [4, 8], suppliers: [DMART, BLINKIT] },

    // Household & Cleaning
    { name: "Matic Liquid Detergent", brand: "Surf Excel", category: "Household & Cleaning", location: "Utility Room", unit: "L", minimumStock: 1, priceRange: [340, 380], shelfLifeDays: 545, batchSizes: [2], suppliers: [DMART, RELIANCE] },
    { name: "Dishwash Gel", brand: "Vim", category: "Household & Cleaning", location: "Utility Room", unit: "ml", minimumStock: 200, priceRange: [130, 150], shelfLifeDays: 545, batchSizes: [750], suppliers: [KIRANA, DMART] },
    { name: "Power Plus Toilet Cleaner", brand: "Harpic", category: "Household & Cleaning", location: "Utility Room", unit: "L", minimumStock: 1, priceRange: [95, 110], shelfLifeDays: 545, batchSizes: [1], suppliers: [DMART] },
    { name: "Glass Cleaner", brand: "Colin", category: "Household & Cleaning", location: "Utility Room", unit: "ml", minimumStock: 200, priceRange: [90, 105], shelfLifeDays: 545, batchSizes: [500], suppliers: [DMART] },
    { name: "Antiseptic Liquid", brand: "Dettol", category: "Household & Cleaning", location: "Utility Room", unit: "ml", minimumStock: 200, priceRange: [110, 125], shelfLifeDays: 545, batchSizes: [550], suppliers: [DMART, APOLLO] },

    // Personal Care
    { name: "Total Toothpaste", brand: "Colgate", category: "Personal Care", location: "Bathroom", unit: "g", minimumStock: 100, priceRange: [95, 110], shelfLifeDays: 545, batchSizes: [200], suppliers: [DMART, KIRANA] },
    { name: "Beauty Cream Bar (3x100g)", brand: "Dove", category: "Personal Care", location: "Bathroom", unit: "pcs", minimumStock: 1, priceRange: [175, 195], shelfLifeDays: 720, batchSizes: [1], suppliers: [DMART] },
    { name: "Liquid Handwash Refill", brand: "Dettol", category: "Personal Care", location: "Bathroom", unit: "ml", minimumStock: 200, priceRange: [130, 145], shelfLifeDays: 545, batchSizes: [750], suppliers: [DMART, APOLLO] },
    { name: "Anti-Dandruff Shampoo", brand: "Head & Shoulders", category: "Personal Care", location: "Bathroom", unit: "ml", minimumStock: 100, priceRange: [190, 220], shelfLifeDays: 720, batchSizes: [340], suppliers: [DMART, APOLLO] },

    // Fruits & Vegetables
    { name: "Onions", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Pantry", unit: "kg", minimumStock: 2, priceRange: [30, 45], shelfLifeDays: 25, batchSizes: [3], suppliers: [ZEPTO, BLINKIT] },
    { name: "Tomatoes", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Refrigerator", unit: "kg", minimumStock: 1, priceRange: [35, 55], shelfLifeDays: 8, batchSizes: [2], suppliers: [ZEPTO, BLINKIT] },
    { name: "Potatoes", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Pantry", unit: "kg", minimumStock: 2, priceRange: [25, 35], shelfLifeDays: 30, batchSizes: [3], suppliers: [ZEPTO, KIRANA] },
    { name: "Bananas", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Kitchen", unit: "dozen", minimumStock: 1, priceRange: [55, 70], shelfLifeDays: 5, batchSizes: [1], suppliers: [ZEPTO, BLINKIT] },

    // Medicines & Wellness
    { name: "Paracetamol 500mg", brand: "Crocin", category: "Medicines & Wellness", location: "Storage Room", unit: "pcs", minimumStock: 10, priceRange: [1.8, 2.5], shelfLifeDays: 400, batchSizes: [20], suppliers: [APOLLO] },
    { name: "Multivitamin Tablets", brand: "Revital H", category: "Medicines & Wellness", location: "Storage Room", unit: "pcs", minimumStock: 10, priceRange: [8, 10], shelfLifeDays: 400, batchSizes: [30], suppliers: [APOLLO] },
    { name: "ORS Rehydration Sachets", brand: "Electral", category: "Medicines & Wellness", location: "Storage Room", unit: "pcs", minimumStock: 5, priceRange: [12, 15], shelfLifeDays: 500, batchSizes: [10], suppliers: [APOLLO] },
  ];

  // Items forced to have at least one EXPIRED or near-expiry batch, for
  // realistic "needs attention" widgets right after seeding.
  const FORCE_EXPIRED = new Set(["100% Whole Wheat Bread", "Curd", "Taaza Homogenised Milk"]);
  const FORCE_EXPIRES_SOON = new Set(["Malai Paneer", "Tomatoes", "Bananas", "Onions"]);
  const FORCE_LOW_STOCK = new Set(["Sunflower Oil", "Total Toothpaste", "Gold Biscuits", "Multivitamin Tablets"]);

  const createdItems = [];
  const purchaseTxns = [];

  for (const tpl of ITEM_TEMPLATES) {
    const numBatches = tpl.batchSizes.length > 1 ? randomInt(1, tpl.batchSizes.length) : 1;
    const batches = [];

    for (let b = 0; b < numBatches; b++) {
      const size = pick(tpl.batchSizes);
      const supplier = pick(tpl.suppliers);
      const price = randomFloat(tpl.priceRange[0], tpl.priceRange[1]);

      // Spread purchase dates across the last ~95 days (June-Sept 2026 window)
      const purchaseOffset = -randomInt(1, 95);
      let purchaseDate = daysFromNow(purchaseOffset);
      let expiryDate = new Date(purchaseDate.getTime() + tpl.shelfLifeDays * DAY);

      const isLast = b === numBatches - 1;
      if (isLast && FORCE_EXPIRED.has(tpl.name)) {
        expiryDate = daysFromNow(-randomInt(1, 3));
        // Keep purchaseDate consistent with a short-shelf-life item that has
        // already expired: bought shortly before its (short) shelf life ran out.
        purchaseDate = new Date(expiryDate.getTime() - Math.min(tpl.shelfLifeDays, 5) * DAY);
      } else if (isLast && FORCE_EXPIRES_SOON.has(tpl.name)) {
        expiryDate = daysFromNow(randomInt(1, 3));
        purchaseDate = new Date(expiryDate.getTime() - Math.min(tpl.shelfLifeDays, 5) * DAY);
      }

      // How much of the batch has been consumed so far (0-90%), unless we
      // want this item to look low-stock, in which case consume most of it.
      let consumedFraction = randomFloat(0.1, 0.6);
      if (FORCE_LOW_STOCK.has(tpl.name)) consumedFraction = randomFloat(0.85, 0.98);
      if (FORCE_EXPIRED.has(tpl.name) && isLast) consumedFraction = randomFloat(0, 0.3);

      const remainingQuantity = Math.max(0, Math.round(size * (1 - consumedFraction) * 100) / 100);

      const batchNumber = `${tpl.brand.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "")}-${randomInt(100, 999)}`;

      batches.push({
        batchNumber,
        purchaseDate,
        expiryDate,
        purchasedQuantity: size,
        remainingQuantity,
        pricePerUnit: price,
        supplierId: supplier._id,
      });
    }

    const item = await Item.create({
      name: tpl.name,
      brand: tpl.brand,
      categoryId: categories[tpl.category]._id,
      unit: tpl.unit,
      minimumStock: tpl.minimumStock,
      locationId: locations[tpl.location]._id,
      batches,
    });
    createdItems.push(item);

    for (const b of item.batches) {
      purchaseTxns.push({
        type: "PURCHASE",
        itemId: item._id,
        batchNumber: b.batchNumber,
        quantity: b.purchasedQuantity,
        unitPrice: b.pricePerUnit,
        totalAmount: Math.round(b.purchasedQuantity * b.pricePerUnit * 100) / 100,
        supplierId: b.supplierId,
        userId: pick(users)._id,
        date: b.purchaseDate,
      });
    }
  }

  await Transaction.insertMany(purchaseTxns);

  // ---------- Consumption transactions ----------
  // One consumption event per batch (the bulk deduction implied by
  // purchasedQuantity - remainingQuantity), dated after the purchase and
  // before the expiry, plus extra smaller "top-up" consumption events
  // scattered through the last 30 days so the consumption trend chart has
  // real day-by-day movement.
  const consumptionTxns = [];

  for (const item of createdItems) {
    for (const b of item.batches) {
      const consumed = Math.round((b.purchasedQuantity - b.remainingQuantity) * 100) / 100;
      if (consumed <= 0) continue;

      const purchaseTime = new Date(b.purchaseDate).getTime();
      const expiryTime = new Date(b.expiryDate).getTime();
      const now = Date.now();
      const windowEnd = Math.min(expiryTime, now);
      const span = Math.max(windowEnd - purchaseTime, DAY);

      // Split the consumed quantity into 1-3 events across the window
      const events = randomInt(1, 3);
      let remainingToConsume = consumed;
      for (let e = 0; e < events; e++) {
        const isLastEvent = e === events - 1;
        const qty = isLastEvent ? remainingToConsume : Math.round((remainingToConsume / (events - e)) * 100) / 100;
        remainingToConsume = Math.round((remainingToConsume - qty) * 100) / 100;
        if (qty <= 0) continue;

        const eventTime = purchaseTime + Math.random() * span;
        consumptionTxns.push({
          type: "CONSUMPTION",
          itemId: item._id,
          batchNumber: b.batchNumber,
          quantity: qty,
          userId: pick(users)._id,
          date: new Date(Math.min(eventTime, now)),
        });
      }
    }
  }

  // Extra recent consumption "velocity" events for fast-moving staples/dairy
  // over the last 30 days, so restock recommendations have real signal.
  const FAST_MOVERS = createdItems.filter((i) =>
    ["Dairy", "Fruits & Vegetables", "Staples", "Snacks & Bakery"].includes(
      Object.keys(categories).find((k) => categories[k]._id.equals(i.categoryId)) || ""
    )
  );
  for (let i = 0; i < 15; i++) {
    const item = pick(FAST_MOVERS.length ? FAST_MOVERS : createdItems);
    const qty = randomFloat(0.2, 1.5);
    consumptionTxns.push({
      type: "CONSUMPTION",
      itemId: item._id,
      batchNumber: item.batches[0]?.batchNumber || "N/A",
      quantity: qty,
      userId: pick(users)._id,
      date: daysFromNow(-randomInt(0, 29)),
    });
  }

  await Transaction.insertMany(consumptionTxns);

  const totalTxns = purchaseTxns.length + consumptionTxns.length;

  log("Sample household data loaded:");
  log(`  Categories: ${CATEGORY_NAMES.length} · Locations: ${LOCATION_NAMES.length} · Suppliers: ${suppliers.length}`);
  log(`  Items: ${createdItems.length} · Transactions: ${totalTxns}`);
  log(`  Demo login: admin@household.local / password123`);

  return { seededItems: true, items: createdItems.length, transactions: totalTxns };
}

module.exports = { seedDemoData };
