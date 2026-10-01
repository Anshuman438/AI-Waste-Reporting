const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/safai_waste_management";

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`🌿 MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn("⚠️ MongoDB Connection Warning:", error.message);
    console.info("💡 Running in resilient mode. To connect MongoDB, ensure your MongoDB service is running (mongod) or provide a MONGO_URI in server/.env");
  }
};

module.exports = connectDB;
