const express = require('express'); 
const router = express.Router(); 
router.get('/', (req, res) => res.json({message: 'LLM API working'})); 
module.exports = router;
