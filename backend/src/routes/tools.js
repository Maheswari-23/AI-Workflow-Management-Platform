const express = require('express'); 
const router = express.Router(); 
router.get('/', (req, res) => res.json({message: 'Tools API working'})); 
module.exports = router;
