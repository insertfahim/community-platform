const http = require("http");

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on("error", reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testLearningSession() {
    try {
        console.log("🔍 Testing learning session creation and listing...\n");

        // Step 1: Login
        console.log("1. Logging in...");
        const loginResult = await makeRequest(
            {
                hostname: "localhost",
                port: 3000,
                path: "/api/users/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            {
                email: "admin@example.com",
                password: "admin",
            }
        );

        if (loginResult.status !== 200) {
            console.log("Login failed:", loginResult);
            return;
        }

        const token = loginResult.data.token;
        console.log("✅ Login successful");

        // Step 2: List existing sessions
        console.log("\n2. Checking existing learning sessions...");
        const listResult = await makeRequest({
            hostname: "localhost",
            port: 3000,
            path: "/api/learning",
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log(
            "📋 Current sessions:",
            JSON.stringify(listResult.data, null, 2)
        );

        // Step 3: Create a new learning session
        console.log("\n3. Creating a new learning session...");
        const createResult = await makeRequest(
            {
                hostname: "localhost",
                port: 3000,
                path: "/api/learning",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
            {
                title: "JavaScript Fundamentals",
                description: "Learn the basics of JavaScript programming",
                subject: "Programming",
                level: "beginner",
                sessionType: "teach",
                location: "Online",
                contactInfo: "test@example.com",
            }
        );

        console.log("📝 Create result:", JSON.stringify(createResult, null, 2));

        // Step 4: List sessions again
        console.log("\n4. Checking sessions after creation...");
        const listAfterResult = await makeRequest({
            hostname: "localhost",
            port: 3000,
            path: "/api/learning",
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log(
            "📋 Sessions after creation:",
            JSON.stringify(listAfterResult.data, null, 2)
        );
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testLearningSession();
