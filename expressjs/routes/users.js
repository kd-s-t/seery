const express = require('express');
const router = express.Router();
const marketsController = require('../controllers/marketsController');

router.get('/:address/bets', marketsController.getUserBets);

module.exports = router;

