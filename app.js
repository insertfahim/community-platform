const express = require("express");
const cors = require("cors");
const path = require("path");
const { attachUser } = require("./middleware/auth");
const { connectToDatabase } = require("./config/db");

// routes
const emergencyRoutes = require("./routes/emergencyRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
// const messageRoutes = require("./routes/messageRoutes"); // disabled per scope
const eventRoutes = require("./routes/eventRoutes");
const donationRoutes = require("./routes/donationRoutes");
// const learningRoutes = require("./routes/learningRoutes"); // disabled per scope
// const incidentRoutes = require("./routes/incidentRoutes"); // disabled per scope
// const historyRoutes = require("./routes/historyRoutes"); // disabled per scope
const volunteerRoutes = require("./routes/volunteerRoutes");
// const adminRoutes = require("./routes/adminRoutes"); // disabled per scope

const app = express();
const REQUEST_LOGS_ENABLED =
    String(process.env.REQUEST_LOGS_ENABLED || "true").toLowerCase() === "true";

const allowedOrigins = String(
    process.env.CORS_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000"
)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
// Ensure DB initialized for any cold starts in long-lived server
connectToDatabase().catch((e) => {
    console.error("DB init error:", e);
});
app.use(attachUser);

app.use((req, _res, next) => {
    if (REQUEST_LOGS_ENABLED) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        if (req.method === "POST" || req.method === "PUT") {
            console.log("Request Body:", req.body);
        }
    }
    next();
});

// API routes
if (REQUEST_LOGS_ENABLED) console.log("🔁 Loading API routes...");

app.use("/api/emergency", emergencyRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ emergencyRoutes loaded");

app.use("/api/posts", postRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ postRoutes loaded");

app.use("/api/users", authRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ authRoutes loaded");

app.use("/api/events", eventRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ eventRoutes loaded");

app.use("/api/donations", donationRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ donationRoutes loaded");

app.use("/api/volunteers", volunteerRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ volunteerRoutes loaded");
// app.use("/api/messages", messageRoutes); // disabled per scope
// app.use("/api/learning", learningRoutes); // disabled per scope
// app.use("/api/incidents", incidentRoutes); // disabled per scope
// app.use("/api/history", historyRoutes); // disabled per scope
// app.use("/api/admin", adminRoutes); // disabled per scope

// Serve static files when the app is used behind a server (local dev).
app.use(express.static("public"));

// HTML routes (for local server usage). On Vercel, static files are served from /public via vercel.json rewrites.
app.get("/", (_req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving index.html");
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/post", (_req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving post.html");
    res.sendFile(path.join(__dirname, "public", "post.html"));
});

app.get("/auth", (_req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving auth.html");
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});

app.get("/emergency.html", (_req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving emergency.html");
    res.sendFile(path.join(__dirname, "public", "emergency.html"));
});

// 404 handler
app.use((req, res, _next) => {
    if (REQUEST_LOGS_ENABLED)
        console.warn(`❌ 404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ message: "Route not found" });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    if (REQUEST_LOGS_ENABLED) console.error("❌ Server Error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message,
    });
});

module.exports = app;
