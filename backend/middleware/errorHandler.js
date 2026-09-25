// Central error handler — controllers/services throw or call next(err),
// this turns them into clean, consistent JSON error responses.
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "ValidationError") {
    return res.status(400).json({ error: "Validation failed", details: err.errors });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate value", field: Object.keys(err.keyValue || {})[0] });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;
