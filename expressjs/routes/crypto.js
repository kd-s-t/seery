const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/cryptoController');

router.get('/prices', cryptoController.getCryptoPrices);
router.get('/search', cryptoController.searchCrypto);
router.get('/library', cryptoController.getCryptoLibrary);

module.exports = router;

