const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = process.env.PORT || 3000;

// routes
const emergencyRoutes = require("./routes/emergencyRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const donationRoutes = require("./routes/donationRoutes");
const learningRoutes = require("./routes/learningRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const historyRoutes = require("./routes/historyRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const connectToDatabase = require("./config/db");
const { attachUser } = require("./middleware/auth");

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
app.use(attachUser);

app.use((req, res, next) => {
    if (REQUEST_LOGS_ENABLED) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        if (req.method === "POST" || req.method === "PUT") {
            console.log("Request Body:", req.body);
        }
    }
    next();
});

//API routes
if (REQUEST_LOGS_ENABLED) console.log("🔁 Loading API routes...");

app.use("/api/emergency", emergencyRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ emergencyRoutes loaded");

app.use("/api/posts", postRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ postRoutes loaded");

app.use("/api/users", authRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ authRoutes loaded");

app.use("/api/messages", messageRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ messageRoutes loaded");

app.use("/api/events", eventRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ eventRoutes loaded");

app.use("/api/donations", donationRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ donationRoutes loaded");

app.use("/api/learning", learningRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ learningRoutes loaded");

app.use("/api/incidents", incidentRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ incidentRoutes loaded");

app.use("/api/history", historyRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ historyRoutes loaded");

app.use("/api/volunteers", volunteerRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ volunteerRoutes loaded");

app.use("/api/admin", adminRoutes);
if (REQUEST_LOGS_ENABLED) console.log("✅ adminRoutes loaded");

app.use(express.static("public"));

// html Routes
app.get("/", (req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving index.html");
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/post", (req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving post.html");
    res.sendFile(path.join(__dirname, "public", "post.html"));
});

app.get("/auth", (req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving auth.html");
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});

app.get("/emergency.html", (req, res) => {
    if (REQUEST_LOGS_ENABLED) console.log("📄 Serving emergency.html");
    res.sendFile(path.join(__dirname, "public", "emergency.html"));
});

app.use((req, res, next) => {
    if (REQUEST_LOGS_ENABLED)
        console.warn(`❌ 404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    if (REQUEST_LOGS_ENABLED) console.error("❌ Server Error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message,
    });
});

connectToDatabase().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        if (REQUEST_LOGS_ENABLED)
            console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
});
