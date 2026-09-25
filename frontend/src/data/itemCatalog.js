// Common household items used for one-tap "quick pick" when adding a new
// item. Category / location names match the defaults the backend creates,
// so they resolve to real ids automatically.

export const CATEGORY_EMOJI = {
  Staples: "🌾",
  Dairy: "🥛",
  "Spices & Seasonings": "🌶️",
  Beverages: "☕",
  "Snacks & Bakery": "🍪",
  "Cooking Essentials": "🫒",
  "Personal Care": "🧴",
  "Household & Cleaning": "🧽",
  "Fruits & Vegetables": "🥕",
  "Medicines & Wellness": "💊",
};

export function emojiFor(item) {
  if (!item) return "📦";
  const catName = item.categoryId?.name || item.category;
  return item.emoji || CATEGORY_EMOJI[catName] || "📦";
}

// shelfLifeDays drives the suggested expiry date; price is a typical ₹/unit
export const ITEM_CATALOG = [
  // Staples
  { emoji: "🌾", name: "Atta (Wheat Flour)", brand: "Aashirvaad", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 5, shelfLifeDays: 150, price: 60 },
  { emoji: "🍚", name: "Basmati Rice", brand: "India Gate", category: "Staples", location: "Pantry", unit: "kg", minimumStock: 5, shelfLifeDays: 365, price: 90 },
  { emoji: "🫘", name: "Toor Dal", brand: "Tata Sampann", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, shelfLifeDays: 240, price: 150 },
  { emoji: "🫘", name: "Moong Dal", brand: "Tata Sampann", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, shelfLifeDays: 240, price: 130 },
  { emoji: "🫘", name: "Chana Dal", brand: "Tata Sampann", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, shelfLifeDays: 240, price: 115 },
  { emoji: "🫘", name: "Rajma", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, shelfLifeDays: 240, price: 140 },
  { emoji: "🍬", name: "Sugar", brand: "Madhur", category: "Staples", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, shelfLifeDays: 365, price: 48 },
  { emoji: "🌾", name: "Besan", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "g", minimumStock: 500, shelfLifeDays: 150, price: 0.15 },
  { emoji: "🌾", name: "Suji / Rava", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "g", minimumStock: 500, shelfLifeDays: 150, price: 0.09 },
  { emoji: "🥣", name: "Poha", brand: "Generic", category: "Staples", location: "Kitchen Cabinet", unit: "g", minimumStock: 500, shelfLifeDays: 180, price: 0.1 },

  // Dairy
  { emoji: "🥛", name: "Milk", brand: "Amul Taaza", category: "Dairy", location: "Refrigerator", unit: "L", minimumStock: 2, shelfLifeDays: 3, price: 30 },
  { emoji: "🧈", name: "Butter", brand: "Amul", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 200, shelfLifeDays: 90, price: 0.52 },
  { emoji: "🧀", name: "Paneer", brand: "Amul", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 200, shelfLifeDays: 7, price: 0.47 },
  { emoji: "🥣", name: "Curd", brand: "Mother Dairy", category: "Dairy", location: "Refrigerator", unit: "g", minimumStock: 400, shelfLifeDays: 5, price: 0.085 },
  { emoji: "🧈", name: "Ghee", brand: "Amul", category: "Dairy", location: "Kitchen Cabinet", unit: "L", minimumStock: 0.5, shelfLifeDays: 270, price: 620 },
  { emoji: "🥚", name: "Eggs", brand: "Farm Fresh", category: "Dairy", location: "Refrigerator", unit: "pcs", minimumStock: 6, shelfLifeDays: 14, price: 7 },

  // Spices
  { emoji: "🧂", name: "Salt", brand: "Tata Salt", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "kg", minimumStock: 1, shelfLifeDays: 720, price: 25 },
  { emoji: "🟡", name: "Turmeric Powder", brand: "Everest", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, shelfLifeDays: 365, price: 0.23 },
  { emoji: "🌶️", name: "Red Chilli Powder", brand: "MDH", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, shelfLifeDays: 365, price: 0.3 },
  { emoji: "🌿", name: "Coriander Powder", brand: "Everest", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, shelfLifeDays: 365, price: 0.26 },
  { emoji: "🟤", name: "Garam Masala", brand: "Everest", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 50, shelfLifeDays: 365, price: 0.7 },
  { emoji: "🌱", name: "Cumin Seeds (Jeera)", brand: "Catch", category: "Spices & Seasonings", location: "Kitchen Cabinet", unit: "g", minimumStock: 100, shelfLifeDays: 365, price: 0.45 },

  // Cooking essentials
  { emoji: "🫒", name: "Sunflower Oil", brand: "Fortune", category: "Cooking Essentials", location: "Kitchen Cabinet", unit: "L", minimumStock: 1, shelfLifeDays: 270, price: 135 },
  { emoji: "🫒", name: "Mustard Oil", brand: "Fortune", category: "Cooking Essentials", location: "Kitchen Cabinet", unit: "L", minimumStock: 1, shelfLifeDays: 270, price: 150 },
  { emoji: "🍅", name: "Tomato Ketchup", brand: "Kissan", category: "Cooking Essentials", location: "Refrigerator", unit: "g", minimumStock: 200, shelfLifeDays: 270, price: 0.17 },

  // Beverages
  { emoji: "🍵", name: "Tea", brand: "Tata Tea Gold", category: "Beverages", location: "Kitchen Cabinet", unit: "g", minimumStock: 200, shelfLifeDays: 365, price: 0.5 },
  { emoji: "☕", name: "Instant Coffee", brand: "Nescafé", category: "Beverages", location: "Kitchen Cabinet", unit: "g", minimumStock: 50, shelfLifeDays: 545, price: 2.8 },
  { emoji: "🧃", name: "Fruit Juice", brand: "Real", category: "Beverages", location: "Refrigerator", unit: "L", minimumStock: 1, shelfLifeDays: 30, price: 115 },

  // Snacks & bakery
  { emoji: "🍞", name: "Bread", brand: "Britannia", category: "Snacks & Bakery", location: "Kitchen", unit: "pcs", minimumStock: 1, shelfLifeDays: 4, price: 50 },
  { emoji: "🍪", name: "Biscuits", brand: "Parle-G", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "packet", minimumStock: 2, shelfLifeDays: 150, price: 10 },
  { emoji: "🍜", name: "Instant Noodles", brand: "Maggi", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "pcs", minimumStock: 4, shelfLifeDays: 240, price: 15 },
  { emoji: "🥨", name: "Namkeen / Bhujia", brand: "Haldiram's", category: "Snacks & Bakery", location: "Kitchen Cabinet", unit: "g", minimumStock: 200, shelfLifeDays: 90, price: 0.2 },

  // Fruits & vegetables
  { emoji: "🧅", name: "Onions", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Pantry", unit: "kg", minimumStock: 2, shelfLifeDays: 25, price: 38 },
  { emoji: "🍅", name: "Tomatoes", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Refrigerator", unit: "kg", minimumStock: 1, shelfLifeDays: 7, price: 45 },
  { emoji: "🥔", name: "Potatoes", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Pantry", unit: "kg", minimumStock: 2, shelfLifeDays: 30, price: 30 },
  { emoji: "🍌", name: "Bananas", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Kitchen", unit: "dozen", minimumStock: 1, shelfLifeDays: 5, price: 60 },
  { emoji: "🍎", name: "Apples", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Refrigerator", unit: "kg", minimumStock: 1, shelfLifeDays: 21, price: 180 },
  { emoji: "🍋", name: "Lemons", brand: "Farm Fresh", category: "Fruits & Vegetables", location: "Refrigerator", unit: "pcs", minimumStock: 4, shelfLifeDays: 14, price: 5 },

  // Household & cleaning
  { emoji: "🧺", name: "Liquid Detergent", brand: "Surf Excel", category: "Household & Cleaning", location: "Utility Room", unit: "L", minimumStock: 1, shelfLifeDays: 545, price: 180 },
  { emoji: "🍽️", name: "Dishwash Gel", brand: "Vim", category: "Household & Cleaning", location: "Utility Room", unit: "ml", minimumStock: 200, shelfLifeDays: 545, price: 0.19 },
  { emoji: "🚽", name: "Toilet Cleaner", brand: "Harpic", category: "Household & Cleaning", location: "Utility Room", unit: "L", minimumStock: 1, shelfLifeDays: 545, price: 100 },
  { emoji: "🧻", name: "Garbage Bags", brand: "Generic", category: "Household & Cleaning", location: "Utility Room", unit: "packet", minimumStock: 1, shelfLifeDays: 1000, price: 90 },

  // Personal care
  { emoji: "🪥", name: "Toothpaste", brand: "Colgate", category: "Personal Care", location: "Bathroom", unit: "pcs", minimumStock: 1, shelfLifeDays: 545, price: 100 },
  { emoji: "🧼", name: "Bath Soap", brand: "Dove", category: "Personal Care", location: "Bathroom", unit: "pcs", minimumStock: 2, shelfLifeDays: 720, price: 60 },
  { emoji: "🧴", name: "Shampoo", brand: "Head & Shoulders", category: "Personal Care", location: "Bathroom", unit: "ml", minimumStock: 100, shelfLifeDays: 720, price: 0.6 },
  { emoji: "🧴", name: "Handwash Refill", brand: "Dettol", category: "Personal Care", location: "Bathroom", unit: "ml", minimumStock: 200, shelfLifeDays: 545, price: 0.18 },

  // Medicines
  { emoji: "💊", name: "Paracetamol 500mg", brand: "Crocin", category: "Medicines & Wellness", location: "Storage Room", unit: "pcs", minimumStock: 10, shelfLifeDays: 400, price: 2 },
  { emoji: "🧃", name: "ORS Sachets", brand: "Electral", category: "Medicines & Wellness", location: "Storage Room", unit: "pcs", minimumStock: 5, shelfLifeDays: 500, price: 13 },
  { emoji: "🩹", name: "Bandages", brand: "Band-Aid", category: "Medicines & Wellness", location: "Storage Room", unit: "pcs", minimumStock: 10, shelfLifeDays: 1000, price: 3 },
];
