const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

router.get('/', emergencyController.getAllContacts);
router.get('/category/:category', emergencyController.getByCategory);
router.get('/search', emergencyController.searchByArea);

console.log('✅ emergencyRoutes loaded');
module.exports = router;
