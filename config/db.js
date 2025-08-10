// config/db.js
require("dotenv").config();
const mongoose = require("mongoose");

async function connectToDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        const error = new Error(
            "MONGODB_URI environment variable is required but not set"
        );
        console.error("❌", error.message);
        throw error;
    }
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("✅ MongoDB connection established");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        // In serverless environments, do not exit the process
        // Let the caller handle the error and possibly retry on next invocation
        throw err;
    }
}

module.exports = connectToDatabase;
