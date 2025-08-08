const Emergency = require('../models/Emergency');

const getAllContacts = async (req, res) => {
  try {
    const contacts = await Emergency.getAllContacts();
    res.status(200).json({ contacts });
  } catch (err) {
    console.error('❌ Error fetching all contacts:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getByCategory = async (req, res) => {
  const { category } = req.params;
  try {
    const contacts = await Emergency.getContactsByCategory(category);
    res.status(200).json(contacts);
  } catch (err) {
    console.error('❌ Error fetching contacts by category:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const searchByArea = async (req, res) => {
  const { q } = req.query;
  try {
    const contacts = await Emergency.searchContactsByArea(q);
    res.status(200).json(contacts);
  } catch (err) {
    console.error('❌ Error searching contacts by area:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAllContacts,
  getByCategory,
  searchByArea,
};
