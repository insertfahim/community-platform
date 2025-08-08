const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

console.log('✅ postRoutes loaded');

router.post('/', postController.create); 

module.exports = router;
