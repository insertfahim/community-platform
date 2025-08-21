// Migration runner to add volunteer_status column
require("dotenv").config();
const { getSql } = require("./config/db");
const fs = require("fs");
const path = require("path");

async function runMigration() {
    try {
        const sql = getSql();
        console.log("🔄 Running volunteer status migration...");

        // Read the migration file
        const migrationPath = path.join(
            __dirname,
            "migration_volunteer_status.sql"
        );
        const migrationSQL = fs.readFileSync(migrationPath, "utf8");

        // Execute individual SQL statements using template literals
        console.log(
            `📋 Executing ${statements.length} migration statements...`
        );

        for (const statement of statements) {
            if (statement.trim() && !statement.trim().startsWith("COMMENT")) {
                console.log(`   ⚡ ${statement.substring(0, 50)}...`);
                try {
                    // Use template literal syntax to execute raw SQL
                    await sql([statement]);
                } catch (err) {
                    // Skip if column already exists
                    if (err.message.includes("already exists")) {
                        console.log(`   ⚠️  Skipping: ${err.message}`);
                    } else {
                        throw err;
                    }
                }
            }
        }

        console.log("✅ Migration completed successfully!");
        console.log(
            "🎯 The volunteer_status column has been added to the users table."
        );
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
        process.exit(1);
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
