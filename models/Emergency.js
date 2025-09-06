const { getSql } = require("../config/db");

const getAllContacts = async () => {
    const sql = getSql();
    const rows = await sql`select * from emergency_contacts order by category asc, main_area asc`;
    return rows;
};

const getContactsByCategory = async (category) => {
    const sql = getSql();
    const rows = await sql`select * from emergency_contacts where category = ${category} order by main_area asc`;
    return rows;
};

const searchContactsByArea = async (searchTerm) => {
    const sql = getSql();
    const q = "%" + String(searchTerm) + "%";
    const rows = await sql`
        select * from emergency_contacts
        where main_area ilike ${q} or city ilike ${q}
        order by category asc, main_area asc
    `;
    return rows;
};

module.exports = {
    getAllContacts,
    getContactsByCategory,
    searchContactsByArea,
};
