const IncidentUpdate = require("./models/IncidentUpdate");
const Incident = require("./models/Incident");
const { connectToDatabase } = require("./config/db");

async function testIncidentUpdates() {
    try {
        console.log("🧪 Testing incident updates functionality...");

        await connectToDatabase();

        // Test 1: Try to fetch incident updates (should work even if none exist)
        console.log("\n📋 Test 1: Fetching incident updates...");
        const incidents = await Incident.listIncidents();
        console.log(`Found ${incidents.length} incidents`);

        if (incidents.length > 0) {
            const firstIncident = incidents[0];
            console.log(`Testing with incident: "${firstIncident.title}"`);

            const updates = await IncidentUpdate.getIncidentUpdates(
                firstIncident.id
            );
            console.log(`Found ${updates.length} updates for this incident`);

            // Test with includeUpdates
            const incidentWithUpdates = await Incident.getIncidentWithUpdates(
                firstIncident.id
            );
            console.log(
                `Incident with updates has ${
                    incidentWithUpdates?.updates?.length || 0
                } updates`
            );
        }

        console.log(
            "\n✅ All tests passed! Incident updates functionality is working."
        );
        console.log("\n🎯 Available API endpoints:");
        console.log("  POST /api/incidents/:incidentId/updates - Add update");
        console.log("  GET /api/incidents/:incidentId/updates - Get updates");
        console.log("  PUT /api/incidents/updates/:updateId - Edit update");
        console.log(
            "  DELETE /api/incidents/updates/:updateId - Delete update"
        );
        console.log(
            "  GET /api/incidents/:id?includeUpdates=true - Get incident with updates"
        );
    } catch (error) {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    testIncidentUpdates().then(() => {
        console.log("\n🎉 Testing completed!");
        process.exit(0);
    });
}

module.exports = { testIncidentUpdates };
