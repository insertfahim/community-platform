// Local dev server only. In Vercel, the entry is api/index.js
const app = require("./app");
const { connectToDatabase } = require("./config/db");
const PORT = process.env.PORT || 3000;

connectToDatabase().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        if (
            String(process.env.REQUEST_LOGS_ENABLED || "true").toLowerCase() ===
            "true"
        )
            console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
});
