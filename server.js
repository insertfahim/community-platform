const express = require("express");
const cors = require("cors");
const path = require("path");
const PORT = 3000;

// routes
const emergencyRoutes = require("./routes/emergencyRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const connectToDatabase = require("./config/db");

const app = express();

const corsOptions = {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.method === "POST" || req.method === "PUT") {
        console.log("Request Body:", req.body);
    }
    next();
});

//API routes
console.log("🔁 Loading API routes...");

app.use("/api/emergency", emergencyRoutes);
console.log("✅ emergencyRoutes loaded");

app.use("/api/posts", postRoutes);
console.log("✅ postRoutes loaded");

app.use("/api/users", authRoutes);
console.log("✅ authRoutes loaded");

app.use(express.static("public"));

// html Routes
app.get("/", (req, res) => {
    console.log("📄 Serving index.html");
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/post", (req, res) => {
    console.log("📄 Serving post.html");
    res.sendFile(path.join(__dirname, "public", "post.html"));
});

app.get("/auth", (req, res) => {
    console.log("📄 Serving auth.html");
    res.sendFile(path.join(__dirname, "public", "auth.html"));
});

app.get("/emergency.html", (req, res) => {
    console.log("📄 Serving emergency.html");
    res.sendFile(path.join(__dirname, "public", "emergency.html"));
});

app.use((req, res, next) => {
    console.warn(`❌ 404 - Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message,
    });
});

connectToDatabase().then(() => {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
});
