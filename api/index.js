// Vercel serverless function entry for the Express app
const mongoose = require("mongoose");
const app = require("../app");
const connectToDatabase = require("../config/db");

let isConnected = false;

async function ensureDbConnected() {
    if (isConnected && mongoose.connection.readyState === 1) return;
    await connectToDatabase();
    isConnected = true;
}

module.exports = async (req, res) => {
    try {
        await ensureDbConnected();
        return app(req, res);
    } catch (err) {
        console.error("❌ Handler error:", err);
        res.statusCode = 500;
        res.end(
            JSON.stringify({ message: "Server error", error: err.message })
        );
    }
};
