
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const Household = require("../models/Household");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      householdId: user.householdId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await User.findOne({
      email: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate IDs before creating either document.
    const userId = new mongoose.Types.ObjectId();
    const householdId = new mongoose.Types.ObjectId();

    // Create both records atomically.
    const session = await mongoose.startSession();
    let user;

    try {
      await session.withTransaction(async () => {
        await Household.create(
          [{
            _id: householdId,
            name: `${name.trim()}'s Household`,
            createdBy: userId,
          }],
          { session }
        );

        const users = await User.create(
          [{
            _id: userId,
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: "ADMIN",
            householdId,
          }],
          { session }
        );

        user = users[0];
      });
    } finally {
      await session.endSession();
    }

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        householdId: user.householdId,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!match) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    if (!user.householdId) {
      return res.status(409).json({
        error: "Account migration pending",
      });
    }

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        householdId: user.householdId,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };