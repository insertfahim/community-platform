const crypto = require("crypto");

const TOKEN_SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

function parseBearerToken(authorizationHeader) {
    if (!authorizationHeader) return undefined;
    const [scheme, value] = authorizationHeader.split(" ");
    if (scheme !== "Bearer" || !value) return undefined;
    return value.trim();
}

function verifyToken(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return undefined;
        const [header, body, signature] = parts;
        const expected = crypto
            .createHmac("sha256", TOKEN_SECRET)
            .update(`${header}.${body}`)
            .digest("base64url");
        if (
            !crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expected)
            )
        ) {
            return undefined;
        }
        const payload = JSON.parse(
            Buffer.from(body, "base64url").toString("utf8")
        );
        return payload;
    } catch (e) {
        return undefined;
    }
}

function attachUser(req, _res, next) {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
        return next();
    }
    const payload = verifyToken(token);
    if (payload) {
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
    next();
}

function requireAuth(req, res, next) {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const payload = verifyToken(token);
    if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
}

function requireRole(role) {
    return function (req, res, next) {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
}

module.exports = {
    attachUser,
    requireAuth,
    requireRole,
};
