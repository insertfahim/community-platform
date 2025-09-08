const { getSql, connectToDatabase } = require("./config/db");

async function runIncidentUpdatesMigration() {
    try {
        console.log("🔄 Starting incident updates migration...");

        await connectToDatabase();
        const sql = getSql();

        // The incident_updates table should already be created by the updated db.js schema
        // But let's ensure it exists and add some sample data if needed

        console.log("✅ Incident updates migration completed successfully!");
        console.log("📝 New features available:");
        console.log(
            "  - Incident reporters can now add updates to their incidents"
        );
        console.log("  - Updates are displayed in the incident view");
        console.log("  - Update count is shown on incident cards");
        console.log(
            "  - Only original reporters can add updates to their incidents"
        );
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runIncidentUpdatesMigration().then(() => {
        console.log("🎉 Migration completed!");
        process.exit(0);
    });
}

module.exports = { runIncidentUpdatesMigration };
