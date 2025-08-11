const { connectToDatabase, getSql } = require("../config/db");
const { hashPassword } = require("../models/User");

async function runSeed() {
    await connectToDatabase();
    const sql = getSql();

    console.log("🌱 Seeding database...");

    await sql`truncate table history_logs restart identity cascade`;
    await sql`truncate table donations restart identity cascade`;
    await sql`truncate table events restart identity cascade`;
    await sql`truncate table posts restart identity cascade`;
    await sql`truncate table emergency_contacts restart identity cascade`;
    await sql`truncate table users restart identity cascade`;

    const users = await sql`
        insert into users (name, email, username, password, role, is_volunteer, is_volunteer_verified)
        values
            ('Admin','admin@example.com','admin', ${hashPassword("admin")}, 'admin', true, true),
            ('John Doe','john@example.com','john', ${hashPassword("password")}, 'user', false, false)
        returning id
    `;

    await sql`
        insert into posts (type, title, description, category, priority, location, contact_info, status)
        values
        ('request','Need food supplies','Family needs emergency food in downtown area','Food','High','Downtown','555-1234','active'),
        ('offer','Offering shelter for 2','Can host two people for a week','Shelter','Medium','Uptown','555-5678','active')
    `;

    await sql`
        insert into emergency_contacts (name, category, main_area, city, full_address, phone, fax)
        values
            ('National Emergency Service (Police, Ambulance, Fire)','Police','National','Bangladesh','Toll-free nationwide, 24/7','999',''),
            ('Bangladesh Fire Service and Civil Defence','Fire Service','National','Bangladesh','Access via 999 (toll-free nationwide)','999',''),
            ('Shastho Batayon (Health Line)','Hospital','National','Bangladesh','Government health advice and referral, 24/7','16263',''),
            ('Anjuman-e-Mofidul Islam Ambulance','Volunteers','Kakrail','Dhaka','Ambulance service','9336611','')
    `;

    console.log("✅ Seeding complete");
    process.exit(0);
}

runSeed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
