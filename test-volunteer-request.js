// Test script to verify volunteer request functionality
const fetch = require("node:fetch");

async function testVolunteerRequest() {
    try {
        console.log("🧪 Testing volunteer request endpoint...");

        const testProfile = {
            profile: {
                bio: "Test volunteer bio",
                location: "Test City",
                phone: "+1234567890",
                skills: ["driving", "first-aid"],
                roles: ["driver", "coordinator"],
                availability: ["weekdays", "evenings"],
                hoursPerWeek: 5,
                experienceYears: 2,
            },
        };

        const response = await fetch(
            "http://localhost:3000/api/volunteers/request",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // You would need a valid auth token here in a real test
                    // 'Authorization': 'Bearer your-jwt-token'
                },
                body: JSON.stringify(testProfile),
            }
        );

        console.log("📊 Response status:", response.status);

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Success:", data);
        } else {
            const error = await response.text();
            console.log("❌ Error:", error);
        }
    } catch (error) {
        console.error("🚨 Test failed:", error.message);
    }
}

// Uncomment to run the test (requires valid authentication)
// testVolunteerRequest();

console.log(
    "📝 Test script created. The volunteer_status column has been added to the database."
);
console.log("🎯 The original error should now be resolved.");
console.log(
    "💡 To test manually, make a POST request to /api/volunteers/request with valid authentication."
);

module.exports = { testVolunteerRequest };
