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

async function testDonationHistory() {
    try {
        console.log("🔍 Testing donation creation and history logging...\n");

        // Step 1: Login
        console.log("1. Logging in...");
        const loginOptions = {
            hostname: "localhost",
            port: 3000,
            path: "/api/users/login",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        };

        const loginResult = await makeRequest(loginOptions, {
            email: "admin@example.com",
            password: "admin",
        });

        if (loginResult.status !== 200) {
            throw new Error(
                `Login failed: ${loginResult.status} - ${JSON.stringify(
                    loginResult.data
                )}`
            );
        }

        const token = loginResult.data.token;
        console.log("✅ Login successful");

        // Step 2: Get initial history
        console.log("\n2. Getting initial history...");
        const historyOptions = {
            hostname: "localhost",
            port: 3000,
            path: "/api/history",
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };

        const initialHistory = await makeRequest(historyOptions);
        const initialCount = initialHistory.data.logs?.length || 0;
        console.log(`✅ Initial history count: ${initialCount}`);

        // Step 3: Create donation
        console.log("\n3. Creating test donation...");
        const donationOptions = {
            hostname: "localhost",
            port: 3000,
            path: "/api/donations",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        };

        const donationResult = await makeRequest(donationOptions, {
            kind: "other",
            description: "Test laptop for donation - Node.js test",
            location: "Test Location",
            contact: "test@example.com",
        });

        if (donationResult.status !== 201) {
            throw new Error(
                `Donation creation failed: ${
                    donationResult.status
                } - ${JSON.stringify(donationResult.data)}`
            );
        }

        const donationId = donationResult.data.donationId;
        console.log(`✅ Donation created with ID: ${donationId}`);

        // Step 4: Check updated history
        console.log("\n4. Checking updated history...");
        const updatedHistory = await makeRequest(historyOptions);
        const updatedCount = updatedHistory.data.logs?.length || 0;
        console.log(`✅ Updated history count: ${updatedCount}`);

        // Check for donation logs
        const donationLogs =
            updatedHistory.data.logs?.filter(
                (log) => log.action === "donation_created"
            ) || [];

        console.log(`✅ Found ${donationLogs.length} donation_created logs`);

        if (donationLogs.length > 0) {
            const latestLog = donationLogs[0];
            console.log("\n📋 Latest donation log:");
            console.log(`   Action: ${latestLog.action}`);
            console.log(`   Meta: ${JSON.stringify(latestLog.meta)}`);
            console.log(`   Created: ${latestLog.created_at}`);
        }

        console.log("\n🎉 Test completed successfully!");
        console.log(
            "🔗 You can now check http://localhost:3000/history.html to see the donation activities"
        );
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

testDonationHistory();
