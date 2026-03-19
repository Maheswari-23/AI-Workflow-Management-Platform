const express = require('express'); 
const router = express.Router(); 
router.get('/', (req, res) => res.json({message: 'Workflows API working'})); 
router.get('/:id', (req, res) => res.json({message: 'Get workflow ' + req.params.id})); 
module.exports = router;
