const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/generate-markets', aiController.generateMarkets);
router.post('/analyze-news', aiController.analyzeNews);

module.exports = router;

