// Simple migration to add volunteer_status column
require("dotenv").config();
const { getSql } = require("./config/db");

async function addVolunteerStatusColumn() {
    try {
        const sql = getSql();
        console.log("🔄 Adding volunteer_status column...");

        // Add volunteer_status column if it doesn't exist
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS volunteer_status VARCHAR(20) DEFAULT 'pending'
        `;

        console.log("✅ volunteer_status column added successfully!");

        // Add volunteer_held_at column if it doesn't exist
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS volunteer_held_at TIMESTAMP
        `;

        console.log("✅ volunteer_held_at column added successfully!");

        // Create index for volunteer_status
        try {
            await sql`
                CREATE INDEX IF NOT EXISTS idx_users_volunteer_status 
                ON users(volunteer_status)
            `;
            console.log("✅ Index created successfully!");
        } catch (err) {
            console.log("⚠️  Index might already exist:", err.message);
        }

        // Update existing records
        await sql`
            UPDATE users 
            SET volunteer_status = CASE 
                WHEN is_volunteer_verified = true THEN 'approved'
                WHEN volunteer_rejected_at IS NOT NULL THEN 'rejected'
                WHEN is_volunteer = true THEN 'pending'
                ELSE 'pending'
            END
            WHERE volunteer_status IS NULL OR volunteer_status = 'pending'
        `;

        console.log("✅ Updated existing volunteer records!");

        console.log("🎯 Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run the migration
if (require.main === module) {
    addVolunteerStatusColumn();
}

module.exports = { addVolunteerStatusColumn };
