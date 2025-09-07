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

async function createDonationAndTest() {
    try {
        console.log("🔍 Creating donation and testing history...\n");

        // Login
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
            console.log("❌ Login failed:", loginResult);
            return;
        }

        const token = loginResult.data.token;
        console.log("✅ Login successful");

        // Create donation
        console.log("\n2. Creating donation...");
        const donationResult = await makeRequest(
            {
                hostname: "localhost",
                port: 3000,
                path: "/api/donations",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
            {
                kind: "books",
                description: "Test donation to generate history",
                location: "Test Location",
                contact: "test@example.com",
            }
        );

        if (donationResult.status !== 201) {
            console.log("❌ Donation creation failed:", donationResult);
            return;
        }

        console.log("✅ Donation created:", donationResult.data);

        // Wait a moment for the log to be written
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Check history
        console.log("\n3. Checking history...");
        const historyResult = await makeRequest({
            hostname: "localhost",
            port: 3000,
            path: "/api/history",
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
        });

        console.log(
            "📋 History result:",
            JSON.stringify(historyResult.data, null, 2)
        );
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

createDonationAndTest();
