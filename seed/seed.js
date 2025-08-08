const connectToDatabase = require("../config/db");
const { UserModel } = require("../models/User");
const { PostModel } = require("../models/Post");
const { EmergencyModel } = require("../models/Emergency");

async function runSeed() {
    await connectToDatabase();

    console.log("🌱 Seeding database...");

    await Promise.all([
        UserModel.deleteMany({}),
        PostModel.deleteMany({}),
        EmergencyModel.deleteMany({}),
    ]);

    const users = await UserModel.insertMany([
        { name: "Admin", email: "admin@example.com", password: "admin" },
        { name: "John Doe", email: "john@example.com", password: "password" },
    ]);

    await PostModel.insertMany([
        {
            type: "request",
            title: "Need food supplies",
            description: "Family needs emergency food in downtown area",
            category: "Food",
            priority: "High",
            location: "Downtown",
            contact_info: "555-1234",
            status: "active",
        },
        {
            type: "offer",
            title: "Offering shelter for 2",
            description: "Can host two people for a week",
            category: "Shelter",
            priority: "Medium",
            location: "Uptown",
            contact_info: "555-5678",
            status: "active",
        },
    ]);

    await EmergencyModel.insertMany([
        {
            name: "Central Police Station",
            category: "Police",
            main_area: "Central",
            city: "Metropolis",
            full_address: "123 Main St, Metropolis",
            phone: "555-0001",
            fax: "555-0002",
        },
        {
            name: "General Hospital",
            category: "Hospital",
            main_area: "North",
            city: "Metropolis",
            full_address: "456 Health Ave, Metropolis",
            phone: "555-1001",
            fax: "555-1002",
        },
    ]);

    console.log("✅ Seeding complete");
    process.exit(0);
}

runSeed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
