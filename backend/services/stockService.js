/**
 * Current stock is derived, not stored — it's the sum of remainingQuantity
 * across all batches for an item. This avoids a duplicated/stale counter.
 */
function getCurrentStock(item) {
  return item.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
}

function isLowStock(item) {
  return getCurrentStock(item) < item.minimumStock;
}

module.exports = { getCurrentStock, isLowStock };
