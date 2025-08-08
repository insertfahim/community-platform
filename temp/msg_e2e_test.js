/*
 End-to-end test for Messaging feature
 Steps:
 1) Register two users (A and B) with random emails
 2) Login both, store tokens and usernames
 3) A -> resolve B's username -> start conversation
 4) A -> send message to B
 5) B -> list conversations -> open convo -> list messages
 6) Verify the last message content and direction
*/

const base = "http://localhost:3000";

async function jfetch(url, options = {}) {
    const res = await fetch(url, options);
    let bodyText = "";
    try {
        bodyText = await res.text();
    } catch {}
    let json = null;
    try {
        json = bodyText ? JSON.parse(bodyText) : null;
    } catch {}
    return { ok: res.ok, status: res.status, json, text: bodyText };
}

function randStr() {
    return Math.random().toString(36).slice(2, 10);
}

(async function run() {
    try {
        console.log("[1] Generating test users");
        const A = {
            name: "Alice " + randStr(),
            email: `alice_${randStr()}@t.dev`,
            password: "Passw0rd!",
        };
        const B = {
            name: "Bob " + randStr(),
            email: `bob_${randStr()}@t.dev`,
            password: "Passw0rd!",
        };

        console.log("[2] Register A");
        let r = await jfetch(base + "/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(A),
        });
        if (!r.ok) throw new Error("Register A failed: " + r.text);
        A.userId = r.json.userId;
        A.token = r.json.token;
        A.username = r.json.username;
        console.log("    A username:", A.username);

        console.log("[3] Register B");
        r = await jfetch(base + "/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(B),
        });
        if (!r.ok) throw new Error("Register B failed: " + r.text);
        B.userId = r.json.userId;
        B.token = r.json.token;
        B.username = r.json.username;
        console.log("    B username:", B.username);

        console.log("[4] Login A");
        r = await jfetch(base + "/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: A.email, password: A.password }),
        });
        if (!r.ok) throw new Error("Login A failed: " + r.text);
        A.token = r.json.token;
        A.username = r.json.username;

        console.log("[5] Login B");
        r = await jfetch(base + "/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: B.email, password: B.password }),
        });
        if (!r.ok) throw new Error("Login B failed: " + r.text);
        B.token = r.json.token;
        B.username = r.json.username;

        console.log("[6] Resolve B username to ID (A auth)");
        r = await jfetch(
            base +
                "/api/users/resolve-username?u=" +
                encodeURIComponent(B.username),
            { headers: { Authorization: `Bearer ${A.token}` } }
        );
        if (!r.ok || !r.json || !r.json.userId)
            throw new Error(
                "Resolve username failed: " + (r && (r.text || r.status))
            );
        const recipientId = r.json.userId;
        console.log("    recipientId:", recipientId);

        console.log("[7] Start conversation (A -> B)");
        r = await jfetch(base + "/api/messages/start", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${A.token}`,
            },
            body: JSON.stringify({ recipientId }),
        });
        if (
            !r.ok ||
            !r.json ||
            !r.json.conversation ||
            !(r.json.conversation.id || r.json.conversation._id)
        )
            throw new Error(
                "Start conversation failed: " + (r && (r.text || r.status))
            );
        const conversationId =
            r.json.conversation.id || r.json.conversation._id;
        console.log("    conversationId:", conversationId);

        console.log("[8] Send message (A -> B)");
        const body = "Hello from A to B " + randStr();
        r = await jfetch(base + `/api/messages/${conversationId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${A.token}`,
            },
            body: JSON.stringify({ recipientId, body }),
        });
        if (!r.ok || !r.json || !r.json.messageId)
            throw new Error(
                "Send message failed: " + (r && (r.text || r.status))
            );
        const msg1Id = r.json.messageId;

        console.log("[9] B lists conversations");
        r = await jfetch(base + "/api/messages/conversations", {
            headers: { Authorization: `Bearer ${B.token}` },
        });
        if (!r.ok)
            throw new Error(
                "List conversations (B) failed: " + (r && (r.text || r.status))
            );
        const convo = (r.json.conversations || []).find(
            (c) => c._id === conversationId || c.id === conversationId
        );
        if (!convo) throw new Error("Conversation not visible to B");

        console.log("[10] B loads messages");
        r = await jfetch(base + `/api/messages/${conversationId}/messages`, {
            headers: { Authorization: `Bearer ${B.token}` },
        });
        if (!r.ok)
            throw new Error(
                "List messages (B) failed: " + (r && (r.text || r.status))
            );
        const msgs = r.json.messages || [];
        if (!msgs.length) throw new Error("No messages returned");
        const last = msgs[msgs.length - 1];
        if (last.body !== body) throw new Error("Last message body mismatch");

        console.log("[10] One-way verified");
        console.log("[11] Send message (B -> A)");
        const body2 = "Reply from B to A " + randStr();
        const recipientId2 = A.userId;
        r = await jfetch(base + `/api/messages/${conversationId}/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${B.token}`,
            },
            body: JSON.stringify({ recipientId: recipientId2, body: body2 }),
        });
        if (!r.ok || !r.json || !r.json.messageId)
            throw new Error(
                "Send message (B->A) failed: " + (r && (r.text || r.status))
            );
        const msg2Id = r.json.messageId;

        console.log("[12] A loads messages to verify B's reply");
        r = await jfetch(base + `/api/messages/${conversationId}/messages`, {
            headers: { Authorization: `Bearer ${A.token}` },
        });
        if (!r.ok)
            throw new Error(
                "List messages (A) failed: " + (r && (r.text || r.status))
            );
        const msgsA = r.json.messages || [];
        const lastA = msgsA[msgsA.length - 1];
        if (!lastA || lastA.body !== body2)
            throw new Error(
                "Two-way check failed: last message body mismatch (A view)"
            );
        if (String(lastA.senderId) !== String(B.userId))
            throw new Error("Two-way check failed: last sender is not B");

        console.log("PASS: Messaging E2E two-way succeeded");

        // Optional cleanup: set E2E_CLEANUP=db and MONGODB_URI in env to delete test data.
        if (
            String(process.env.E2E_CLEANUP).toLowerCase() === "db" &&
            process.env.MONGODB_URI
        ) {
            console.log("[CLEANUP] Connecting to DB to remove test data");
            try {
                const mongoose = require("mongoose");
                await mongoose.connect(process.env.MONGODB_URI, {
                    serverSelectionTimeoutMS: 8000,
                });
                const { MessageModel } = require("../models/Message");
                const { ConversationModel } = require("../models/Conversation");
                const { UserModel } = require("../models/User");
                const ids = [msg1Id, msg2Id].filter(Boolean);
                if (ids.length) {
                    await MessageModel.deleteMany({ _id: { $in: ids } });
                }
                if (conversationId) {
                    await ConversationModel.findByIdAndDelete(conversationId);
                }
                await UserModel.deleteMany({
                    _id: { $in: [A.userId, B.userId] },
                });
                await mongoose.disconnect();
                console.log("[CLEANUP] Done");
            } catch (e) {
                console.warn(
                    "[CLEANUP] Skipped or failed:",
                    e && (e.message || e)
                );
            }
        } else {
            console.log(
                "[CLEANUP] Skipped. To enable, set E2E_CLEANUP=db and MONGODB_URI env."
            );
        }
        process.exit(0);
    } catch (err) {
        console.error("FAIL:", err && (err.stack || err.message || err));
        process.exit(1);
    }
})();
