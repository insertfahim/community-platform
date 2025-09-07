const fetch = require("node-fetch");

// Test script to verify donation creation and history logging
async function testDonationHistory() {
    const baseUrl = "http://localhost:3000";

    try {
        console.log("🔍 Testing donation creation and history logging...\n");

        // Step 1: Login to get auth token
        console.log("1. Logging in...");
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: "admin@example.com", // Using seed data
                password: "password123",
            }),
        });

        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginResponse.status}`);
        }

        const loginData = await loginResponse.json();
        const token = loginData.token;
        console.log("✅ Login successful");

        // Step 2: Get initial history count
        console.log("\n2. Getting initial history count...");
        const initialHistoryResponse = await fetch(`${baseUrl}/api/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const initialHistoryData = await initialHistoryResponse.json();
        const initialCount = initialHistoryData.logs?.length || 0;
        console.log(`✅ Initial history count: ${initialCount}`);

        // Step 3: Create a test donation
        console.log("\n3. Creating test donation...");
        const donationResponse = await fetch(`${baseUrl}/api/donations`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                kind: "Electronics",
                description:
                    "Test laptop for donation - created by test script",
                location: "Test Location",
                contact: "test@example.com",
            }),
        });

        if (!donationResponse.ok) {
            throw new Error(
                `Donation creation failed: ${donationResponse.status}`
            );
        }

        const donationData = await donationResponse.json();
        console.log(`✅ Donation created with ID: ${donationData.donationId}`);

        // Step 4: Check history again
        console.log("\n4. Checking updated history...");
        const updatedHistoryResponse = await fetch(`${baseUrl}/api/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const updatedHistoryData = await updatedHistoryResponse.json();
        const updatedCount = updatedHistoryData.logs?.length || 0;
        console.log(`✅ Updated history count: ${updatedCount}`);

        // Step 5: Look for donation_created action
        const donationLogs =
            updatedHistoryData.logs?.filter(
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

        // Step 6: Test donation status update
        console.log("\n5. Testing donation status update...");
        const statusUpdateResponse = await fetch(
            `${baseUrl}/api/donations/${donationData.donationId}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: "claimed",
                }),
            }
        );

        if (statusUpdateResponse.ok) {
            console.log("✅ Donation status updated");

            // Check for status update log
            const finalHistoryResponse = await fetch(`${baseUrl}/api/history`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const finalHistoryData = await finalHistoryResponse.json();
            const statusUpdateLogs =
                finalHistoryData.logs?.filter(
                    (log) => log.action === "donation_status_updated"
                ) || [];

            console.log(
                `✅ Found ${statusUpdateLogs.length} donation_status_updated logs`
            );

            if (statusUpdateLogs.length > 0) {
                const latestStatusLog = statusUpdateLogs[0];
                console.log("\n📋 Latest status update log:");
                console.log(`   Action: ${latestStatusLog.action}`);
                console.log(`   Meta: ${JSON.stringify(latestStatusLog.meta)}`);
                console.log(`   Created: ${latestStatusLog.created_at}`);
            }
        }

        console.log("\n🎉 Test completed successfully!");
        console.log(
            "\n🔗 You can now check http://localhost:3000/history.html to see the donation activities"
        );
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

// Check if node-fetch is available
try {
    require("node-fetch");
    testDonationHistory();
} catch (e) {
    console.log("📦 Installing node-fetch for testing...");
    const { exec } = require("child_process");
    exec("npm install node-fetch@2", (error) => {
        if (error) {
            console.error("Failed to install node-fetch:", error);
            process.exit(1);
        }
        console.log("✅ node-fetch installed, running test...\n");
        delete require.cache[require.resolve("node-fetch")];
        testDonationHistory();
    });
}
