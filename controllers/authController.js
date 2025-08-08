const User = require("../models/User");
const crypto = require("crypto");

const TOKEN_SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

const createToken = (payload) => {
    const header = Buffer.from(
        JSON.stringify({ alg: "HS256", typ: "JWT" })
    ).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", TOKEN_SECRET)
        .update(`${header}.${body}`)
        .digest("base64url");
    return `${header}.${body}.${signature}`;
};

// register user
const register = async (req, res) => {
    console.log("🔥 register() called with:", req.body);
    const { name, email, password } = req.body;

    // validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    // format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format." });
    }

    try {
        const existingUser = await User.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: "Email already in use." });
        }

        const userId = await User.createUser({ name, email, password });
        const created = await User.findUserById(userId);
        const token = createToken({
            sub: userId,
            email,
            role: "user",
            username: created?.username,
        });
        return res
            .status(201)
            .json({
                message: "User registered successfully",
                userId,
                token,
                username: created?.username,
            });
    } catch (error) {
        console.error("❌ Registration error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "Email and password are required." });
    }

    try {
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const ok = User.verifyPassword(password, user.password);
        if (!ok) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        const token = createToken({
            sub: user.id,
            email: user.email,
            role: user.role || "user",
            username: user.username,
        });
        return res
            .status(200)
            .json({
                message: "Login successful",
                userId: user.id,
                token,
                username: user.username,
            });
    } catch (error) {
        console.error("❌ Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    register,
    login,
};
