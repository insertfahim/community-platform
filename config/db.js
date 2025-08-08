// config/db.js
const mongoose = require("mongoose");

const DEFAULT_DB_NAME = "community_help";
const DEFAULT_URI = `mongodb+srv://admin:admin@mariyaquiz.gd34udu.mongodb.net/${DEFAULT_DB_NAME}?retryWrites=true&w=majority&appName=mariyaquiz`;

async function connectToDatabase() {
    const uri = process.env.MONGODB_URI || DEFAULT_URI;
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
        });
        console.log("✅ MongoDB connection established");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
        process.exit(1);
    }
}

module.exports = connectToDatabase;
