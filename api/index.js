// Vercel serverless function entry for the Express app (Neon/Postgres)
const app = require("../app");
const { connectToDatabase } = require("../config/db");

let isInitialized = false;

async function ensureDbInitialized() {
    if (isInitialized) return;
    await connectToDatabase();
    isInitialized = true;
}

module.exports = async (req, res) => {
    try {
        await ensureDbInitialized();
        return app(req, res);
    } catch (err) {
        console.error("❌ Handler error:", err);
        res.statusCode = 500;
        res.end(
            JSON.stringify({ message: "Server error", error: err.message })
        );
    }
};
