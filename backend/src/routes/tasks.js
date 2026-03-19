const express = require('express'); 
const router = express.Router(); 
router.get('/', (req, res) => res.json({message: 'Tasks API working'}));
 router.get('/:id', (req, res) => res.json({message: 'Get task ' + req.params.id}));
  module.exports = router;
