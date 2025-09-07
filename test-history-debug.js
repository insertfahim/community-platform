const http = require("http");

function makeRequest(options) {
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
        req.end();
    });
}

async function testHistory() {
    try {
        console.log("🔍 Testing history endpoints...\n");

        // Login first
        console.log("1. Logging in...");
        const loginResult = await makeRequest({
            hostname: "localhost",
            port: 3000,
            path: "/api/users/login",
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        // Add login data
        const loginReq = http.request(
            {
                hostname: "localhost",
                port: 3000,
                path: "/api/users/login",
                method: "POST",
                headers: { "Content-Type": "application/json" },
            },
            (res) => {
                let body = "";
                res.on("data", (chunk) => (body += chunk));
                res.on("end", async () => {
                    try {
                        const loginData = JSON.parse(body);
                        if (res.statusCode !== 200) {
                            console.log("❌ Login failed:", loginData);
                            return;
                        }

                        const token = loginData.token;
                        console.log("✅ Login successful");

                        // Test stats endpoint
                        console.log("\n2. Testing /api/history/stats...");
                        const statsResult = await makeRequest({
                            hostname: "localhost",
                            port: 3000,
                            path: "/api/history/stats",
                            method: "GET",
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        console.log(
                            "📊 Stats result:",
                            JSON.stringify(statsResult.data, null, 2)
                        );

                        // Test logs endpoint
                        console.log("\n3. Testing /api/history...");
                        const logsResult = await makeRequest({
                            hostname: "localhost",
                            port: 3000,
                            path: "/api/history",
                            method: "GET",
                            headers: { Authorization: `Bearer ${token}` },
                        });

                        console.log("📋 Logs result:");
                        console.log("Status:", logsResult.status);
                        console.log(
                            "Data:",
                            JSON.stringify(logsResult.data, null, 2)
                        );

                        if (logsResult.data.logs) {
                            console.log(
                                `\n📈 Found ${logsResult.data.logs.length} logs`
                            );
                            logsResult.data.logs.forEach((log, index) => {
                                console.log(
                                    `${index + 1}. ${log.action} - ${
                                        log.created_at
                                    }`
                                );
                            });
                        }
                    } catch (error) {
                        console.error(
                            "❌ Error processing login response:",
                            error
                        );
                    }
                });
            }
        );

        loginReq.on("error", (error) => {
            console.error("❌ Login request error:", error);
        });

        loginReq.write(
            JSON.stringify({
                email: "admin@example.com",
                password: "admin",
            })
        );
        loginReq.end();
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

testHistory();
