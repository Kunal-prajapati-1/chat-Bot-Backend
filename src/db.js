const mongoose = require("mongoose");

async function connect() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("db connected");
  } catch (err) {
    console.error("Database connection failed:", err.message);
    throw err;
  }
}

module.exports = connect;