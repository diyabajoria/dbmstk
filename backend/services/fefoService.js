const { getCurrentStock } = require("./stockService");

/**
 * FEFO (First Expire, First Out) consumption.
 *
 * Given an Item document (mongoose doc, not lean) and a quantity to consume,
 * mutates item.batches in place (deducting remainingQuantity, earliest
 * expiry first) and returns the list of {batchNumber, quantity} deductions
 * so the caller can write one CONSUMPTION transaction per affected batch.
 *
 * Does NOT save the document or write transactions — that's the caller's
 * job, inside a MongoDB session/transaction, so purchase/consumption stay
 * atomic with their transaction-log writes.
 *
 * Throws if total available stock is insufficient (rejects the whole op).
 */
function applyFefoConsumption(item, quantityToConsume) {
  if (quantityToConsume <= 0) {
    const err = new Error("Consumption quantity must be greater than 0");
    err.status = 400;
    throw err;
  }

  const available = getCurrentStock(item);
  if (available < quantityToConsume) {
    const err = new Error(
      `Insufficient stock: requested ${quantityToConsume}, available ${available}`
    );
    err.status = 400;
    throw err;
  }

  // Sort active batches by expiryDate ascending (earliest first)
  const activeBatches = item.batches
    .filter((b) => b.remainingQuantity > 0)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  let remaining = quantityToConsume;
  const deductions = [];

  for (const batch of activeBatches) {
    if (remaining <= 0) break;

    const take = Math.min(batch.remainingQuantity, remaining);
    batch.remainingQuantity -= take;
    remaining -= take;

    deductions.push({ batchNumber: batch.batchNumber, quantity: take });
  }

  return deductions;
}

module.exports = { applyFefoConsumption };
