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

async function quickTest() {
    try {
        console.log("Testing donation creation...");

        // Login
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
        console.log("Login successful, token:", token.substring(0, 20) + "...");

        // Create donation
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
                description: "Quick test donation",
                location: "Test Location",
                contact: "test@example.com",
            }
        );

        console.log("Donation result:", donationResult);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

quickTest();
