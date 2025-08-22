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
            ('Admin','admin@example.com','admin', ${hashPassword(
                "admin"
            )}, 'admin', true, true),
            ('John Doe','john@example.com','john', ${hashPassword(
                "password"
            )}, 'user', false, false)
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
            -- National Emergency Services
            ('National Emergency Service (Police, Ambulance, Fire)','Police','National','Bangladesh','Toll-free nationwide, 24/7','999',''),
            ('Bangladesh Fire Service and Civil Defence','Fire Service','National','Bangladesh','Access via 999 (toll-free nationwide)','999',''),
            ('Shastho Batayon (Health Line)','Hospital','National','Bangladesh','Government health advice and referral, 24/7','16263',''),
            ('National Emergency Service Helpline','Emergency','National','Bangladesh','24/7 Emergency Response','999',''),
            ('Child Helpline Bangladesh','Emergency','National','Bangladesh','Child emergency and support services','1098',''),
            ('National Helpline for Violence Against Women and Children','Emergency','National','Bangladesh','24/7 support for violence cases','10921',''),
            
            -- Dhaka City Emergency Services
            ('Dhaka Medical College Hospital','Hospital','Ramna','Dhaka','Bakshibazar, Dhaka-1000','02-55165088','02-9661064'),
            ('Bangabandhu Sheikh Mujib Medical University','Hospital','Shahbag','Dhaka','Shahbag, Dhaka-1000','02-55165001','02-8614545'),
            ('Square Hospital','Hospital','Panthapath','Dhaka','18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka-1205','02-8159457','02-9144400'),
            ('United Hospital','Hospital','Gulshan','Dhaka','Plot 15, Road 71, Gulshan-2, Dhaka-1212','02-8836444','02-8836400'),
            ('Apollo Hospitals Dhaka','Hospital','Bashundhara','Dhaka','Plot-81, Block-E, Bashundhara R/A, Dhaka-1229','10678','02-8401661'),
            ('Labaid Specialized Hospital','Hospital','Dhanmondi','Dhaka','House 6, Road 4, Dhanmondi, Dhaka-1205','02-58615546','02-58615547'),
            
            -- Dhaka Police Stations
            ('Ramna Police Station','Police','Ramna','Dhaka','Ramna, Dhaka','02-9559031','02-9559032'),
            ('Dhanmondi Police Station','Police','Dhanmondi','Dhaka','Dhanmondi, Dhaka-1205','02-9665311','02-9665312'),
            ('Gulshan Police Station','Police','Gulshan','Dhaka','Gulshan-1, Dhaka-1212','02-8822111','02-8822112'),
            ('Wari Police Station','Police','Wari','Dhaka','Wari, Dhaka-1203','02-7316234','02-7316235'),
            ('Tejgaon Police Station','Police','Tejgaon','Dhaka','Tejgaon, Dhaka-1215','02-8126751','02-8126752'),
            ('Uttara Police Station','Police','Uttara','Dhaka','Uttara Model Town, Dhaka-1230','02-8953636','02-8953637'),
            
            -- Fire Service Stations - Dhaka
            ('Central Fire Station','Fire Service','Paribagh','Dhaka','Paribagh, Dhaka-1000','02-9555555','02-9555556'),
            ('Tejgaon Fire Station','Fire Service','Tejgaon','Dhaka','Tejgaon Industrial Area, Dhaka-1208','02-8870101','02-8870102'),
            ('Dhanmondi Fire Station','Fire Service','Dhanmondi','Dhaka','Dhanmondi R/A, Dhaka-1205','02-9670101','02-9670102'),
            ('Gulshan Fire Station','Fire Service','Gulshan','Dhaka','Gulshan-2, Dhaka-1212','02-8821010','02-8821011'),
            ('Uttara Fire Station','Fire Service','Uttara','Dhaka','Uttara Sector 7, Dhaka-1230','02-8953101','02-8953102'),
            
            -- Ambulance Services - Dhaka
            ('Anjuman-e-Mofidul Islam Ambulance','Volunteers','Kakrail','Dhaka','30/1 Outer Circular Road, Kakrail, Dhaka-1000','02-9336611','02-9336612'),
            ('Bangladesh Red Crescent Society','Volunteers','Mohammadpur','Dhaka','684-686 Bara Maghbazar, Dhaka-1217','02-9330188','02-8315439'),
            ('Quantum Foundation Ambulance','Volunteers','Dhanmondi','Dhaka','Quantum Foundation, Dhanmondi, Dhaka','16160',''),
            ('Popular Diagnostic Ambulance','Hospital','Dhanmondi','Dhaka','House 16, Road 2, Dhanmondi R/A, Dhaka-1205','09666787878','02-58615615'),
            ('IBN SINA Ambulance Service','Hospital','Kallyanpur','Dhaka','House 48, Road 9/A, Dhanmondi, Dhaka-1209','10652','02-9662277'),
            
            -- Chittagong Emergency Services
            ('Chittagong Medical College Hospital','Hospital','Agrabad','Chittagong','Chittagong Medical College Road, Chittagong-4203','031-2502711','031-2502712'),
            ('Chittagong General Hospital','Hospital','Anderkilla','Chittagong','Anderkilla, Chittagong','031-619923','031-619924'),
            ('Imperial Hospital Chittagong','Hospital','GEC','Chittagong','Plot 45/A, GEC Circle, Chittagong-4000','031-2555000','031-2555001'),
            ('Chittagong Metropolitan Police','Police','Kotwali','Chittagong','Police Lines, Chittagong','031-610855','031-610856'),
            ('Chittagong Fire Service','Fire Service','Agrabad','Chittagong','Fire Service Station, Agrabad, Chittagong','031-710101','031-710102'),
            
            -- Sylhet Emergency Services
            ('Sylhet MAG Osmani Medical College Hospital','Hospital','Tilagarh','Sylhet','Tilagarh, Sylhet-3100','0821-713061','0821-713062'),
            ('Mount Adora Hospital','Hospital','Bondor Bazar','Sylhet','Chowhatta, Sylhet-3100','0821-2880081','0821-2880082'),
            ('Sylhet Metropolitan Police','Police','Bandor Bazar','Sylhet','Police Lines, Sylhet','0821-717444','0821-717445'),
            ('Sylhet Fire Service','Fire Service','Zindabazar','Sylhet','Fire Service Station, Zindabazar, Sylhet','0821-710101','0821-710102'),
            
            -- Rajshahi Emergency Services
            ('Rajshahi Medical College Hospital','Hospital','Rajpara','Rajshahi','Laxmipur, Rajshahi-6000','0721-772105','0721-772106'),
            ('Islami Bank Hospital Rajshahi','Hospital','Vodra','Rajshahi','Court Station Road, Rajshahi-6000','0721-772277','0721-772278'),
            ('Rajshahi Metropolitan Police','Police','Boalia','Rajshahi','Police Lines, Rajshahi','0721-772020','0721-772021'),
            ('Rajshahi Fire Service','Fire Service','New Market','Rajshahi','Fire Service Station, New Market, Rajshahi','0721-710101','0721-710102'),
            
            -- Khulna Emergency Services
            ('Khulna Medical College Hospital','Hospital','Khulna Sadar','Khulna','Khulna Medical College Road, Khulna-9000','041-761051','041-761052'),
            ('Gazi Medical College Hospital','Hospital','Khulna Sadar','Khulna','Moilapota, Khulna-9000','041-2860500','041-2860501'),
            ('Khulna Metropolitan Police','Police','Kotwali','Khulna','Police Lines, Khulna','041-720020','041-720021'),
            ('Khulna Fire Service','Fire Service','Khulna Sadar','Khulna','Fire Service Station, Khulna','041-710101','041-710102'),
            
            -- Barishal Emergency Services
            ('Barishal Sher-e-Bangla Medical College Hospital','Hospital','Band Road','Barishal','Band Road, Barishal-8200','0431-2176102','0431-2176103'),
            ('Barishal Metropolitan Police','Police','Kotwali','Barishal','Police Lines, Barishal','0431-61400','0431-61401'),
            ('Barishal Fire Service','Fire Service','Nathullabad','Barishal','Fire Service Station, Barishal','0431-710101','0431-710102'),
            
            -- Rangpur Emergency Services
            ('Rangpur Medical College Hospital','Hospital','Medical','Rangpur','College Road, Rangpur-5400','0521-62324','0521-62325'),
            ('Rangpur Metropolitan Police','Police','Kotwali','Rangpur','Police Lines, Rangpur','0521-62410','0521-62411'),
            ('Rangpur Fire Service','Fire Service','Modern','Rangpur','Fire Service Station, Rangpur','0521-710101','0521-710102'),
            
            -- Mymensingh Emergency Services
            ('Mymensingh Medical College Hospital','Hospital','Medical','Mymensingh','Medical College Road, Mymensingh-2200','091-66075','091-66076'),
            ('Mymensingh Police','Police','Kotwali','Mymensingh','Police Lines, Mymensingh','091-61311','091-61312'),
            ('Mymensingh Fire Service','Fire Service','Charpara','Mymensingh','Fire Service Station, Mymensingh','091-710101','091-710102'),
            
            -- Specialized Emergency Services
            ('National Institute of Mental Health','Hospital','Sher-e-Bangla Nagar','Dhaka','Sher-e-Bangla Nagar, Dhaka-1207','02-9122341','02-9122342'),
            ('National Institute of Cardiovascular Diseases','Hospital','Sher-e-Bangla Nagar','Dhaka','Sher-e-Bangla Nagar, Dhaka-1207','02-9122277','02-9122278'),
            ('National Institute of Cancer Research','Hospital','Mohakhali','Dhaka','Mohakhali, Dhaka-1212','02-9122235','02-9122236'),
            ('Burn and Plastic Surgery Institute','Hospital','Ramna','Dhaka','Ramna, Dhaka-1000','02-9661751','02-9661752'),
            ('National Institute of Neurosciences','Hospital','Sher-e-Bangla Nagar','Dhaka','Sher-e-Bangla Nagar, Dhaka-1207','02-55040301','02-55040302'),
            
            -- Poison Control
            ('National Poison Control Center','Emergency','Dhaka Medical College','Dhaka','Dhaka Medical College, Dhaka-1000','02-55165090','02-55165091'),
            
            -- Coast Guard and Naval Emergency
            ('Bangladesh Coast Guard','Emergency','Agargaon','Dhaka','Coast Guard Headquarters, Agargaon, Dhaka-1207','02-8181470','02-8181471'),
            ('Bangladesh Navy Emergency','Emergency','Banani','Dhaka','Naval Headquarters, Banani, Dhaka-1213','02-9870027','02-9870028'),
            
            -- Border Security
            ('Border Guard Bangladesh (BGB)','Emergency','Pilkhana','Dhaka','BGB Headquarters, Pilkhana, Dhaka-1205','02-9670094','02-9670095'),
            
            -- Disaster Management
            ('Department of Disaster Management','Emergency','Mohakhali','Dhaka','Disaster Management Bhaban, Mohakhali, Dhaka-1212','02-9890937','02-9890938'),
            ('Bangladesh Meteorological Department','Emergency','Agargaon','Dhaka','Agargaon, Dhaka-1207','02-8181050','02-8181051'),
            
            -- Tourist Police
            ('Tourist Police Dhaka','Police','Ramna','Dhaka','Ramna Park, Dhaka-1000','02-9559094','02-9559095'),
            ('Tourist Police Cox''s Bazar','Police','Kalatoli','Cox''s Bazar','Kalatoli Road, Cox''s Bazar-4700','0341-62230','0341-62231'),
            
            -- Women and Child Helplines
            ('One Stop Crisis Centre','Emergency','Dhaka Medical College','Dhaka','Dhaka Medical College Hospital, Dhaka-1000','02-55165090',''),
            ('Manusher Jonno Foundation','Volunteers','Segunbagicha','Dhaka','House 13/3, Block F, Lalmatia, Dhaka-1207','02-8115007','02-8115008'),
            ('BRAC Helpline','Volunteers','Mohakhali','Dhaka','BRAC Centre, 75 Mohakhali, Dhaka-1212','16236','02-9881265'),
            
            -- Blood Banks
            ('Sandhani Blood Bank','Volunteers','Dhaka Medical College','Dhaka','Dhaka Medical College, Dhaka-1000','02-55165164',''),
            ('Quantum Blood Bank','Volunteers','Dhanmondi','Dhaka','House 35, Road 5, Dhanmondi, Dhaka-1205','02-8610485','02-8610486'),
            ('Red Crescent Blood Bank','Volunteers','Mohammadpur','Dhaka','684-686 Bara Maghbazar, Dhaka-1217','02-9330188','02-8315439')
    `;

    console.log("✅ Seeding complete");
    process.exit(0);
}

runSeed().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
