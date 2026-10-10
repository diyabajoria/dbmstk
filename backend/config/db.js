const mongoose = require("mongoose");

let connectionPromise;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set in the environment (.env)");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000 })
      .then((connection) => {
        console.log(`MongoDB connected: ${connection.connection.host}`);
        return connection.connection;
      })
      .catch((err) => {
        // Allow a later serverless invocation to retry a failed connection.
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

module.exports = connectDB;
