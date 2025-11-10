const express = require('express');
const router = express.Router();
const marketsController = require('../controllers/marketsController');

router.get('/', marketsController.getAllMarkets);
router.get('/:id', marketsController.getMarketById);
router.post('/', marketsController.createMarket);
router.post('/:id/bet', marketsController.placeBet);
router.post('/:id/resolve', marketsController.resolveMarket);
router.get('/:id/bets', marketsController.getMarketBets);

module.exports = router;

