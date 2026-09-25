const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const header = req.headers.authorization || "";

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized: no token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.householdId) {
      return res.status(403).json({
        error: "Account is not associated with a household",
      });
    }

    req.user = decoded;
    // req.user now contains:
    // { id, role, householdId }

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized: invalid or expired token",
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: insufficient role",
      });
    }

    next();
  };
}

module.exports = { protect, requireRole };