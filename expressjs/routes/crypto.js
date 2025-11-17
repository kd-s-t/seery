const express = require('express');
const router = express.Router();
const cryptoController = require('../controllers/cryptoController');
const imageController = require('../controllers/imageController');

router.get('/prices', cryptoController.getCryptoPrices);
router.get('/search', cryptoController.searchCrypto);
router.get('/library', cryptoController.getCryptoLibrary);
router.get('/image', imageController.getCoinImage);

module.exports = router;

