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

async function testCalendarEvents() {
    try {
        console.log("🗓️ Testing calendar events with date formatting...\n");

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
        console.log("✅ Login successful, token received\n");

        // Create an event
        console.log("2. Creating test event...");
        const eventData = {
            title: "Test Community Meeting",
            description: "A test event to verify date formatting",
            location: "Community Center",
            startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            endAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
        };

        const createResult = await makeRequest(
            {
                hostname: "localhost",
                port: 3000,
                path: "/api/events",
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            },
            eventData
        );

        if (createResult.status !== 201) {
            console.log("❌ Event creation failed:", createResult);
            return;
        }

        console.log("✅ Event created successfully\n");

        // List events
        console.log("3. Retrieving events...");
        const listResult = await makeRequest({
            hostname: "localhost",
            port: 3000,
            path: "/api/events",
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (listResult.status !== 200) {
            console.log("❌ Event retrieval failed:", listResult);
            return;
        }

        console.log("✅ Events retrieved successfully");
        console.log("📋 Events found:", listResult.data.events.length);

        if (listResult.data.events.length > 0) {
            const event = listResult.data.events[0];
            console.log("\n📅 Event details:");
            console.log("   Title:", event.title);
            console.log("   Start Date:", event.startAt);
            console.log("   End Date:", event.endAt);
            console.log("   Location:", event.location);

            // Test date parsing
            const startDate = new Date(event.startAt);
            const endDate = new Date(event.endAt);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.log("❌ Date parsing failed - Invalid Date detected!");
            } else {
                console.log("✅ Date parsing successful");
                console.log("   Formatted Start:", startDate.toLocaleString());
                console.log("   Formatted End:", endDate.toLocaleString());
            }
        }

        console.log("\n🎉 Calendar test completed successfully!");
    } catch (error) {
        console.error("❌ Test failed with error:", error.message);
    }
}

testCalendarEvents();
