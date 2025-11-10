const binance = require('../lib/binance');

const buyCrypto = async (req, res) => {
  try {
    const { symbol, quantity, quoteOrderQty, type = 'MARKET' } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required (e.g., BTCUSDT)',
      });
    }

    if (type === 'MARKET' && !quantity && !quoteOrderQty) {
      return res.status(400).json({
        success: false,
        error: 'Either quantity or quoteOrderQty is required for MARKET orders',
      });
    }

    if (type === 'LIMIT' && !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required for LIMIT orders',
      });
    }

    const order = await binance.placeOrder(
      symbol,
      'BUY',
      type,
      quantity,
      req.body.price,
      quoteOrderQty
    );

    res.json({
      success: true,
      order,
      message: `Buy order placed successfully`,
    });
  } catch (error) {
    console.error('Error placing buy order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place buy order',
    });
  }
};

const sellCrypto = async (req, res) => {
  try {
    const { symbol, quantity, quoteOrderQty, type = 'MARKET' } = req.body;

    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required (e.g., BTCUSDT)',
      });
    }

    if (type === 'MARKET' && !quantity && !quoteOrderQty) {
      return res.status(400).json({
        success: false,
        error: 'Either quantity or quoteOrderQty is required for MARKET orders',
      });
    }

    if (type === 'LIMIT' && !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Quantity is required for LIMIT orders',
      });
    }

    const order = await binance.placeOrder(
      symbol,
      'SELL',
      type,
      quantity,
      req.body.price,
      quoteOrderQty
    );

    res.json({
      success: true,
      order,
      message: `Sell order placed successfully`,
    });
  } catch (error) {
    console.error('Error placing sell order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to place sell order',
    });
  }
};

const getAccount = async (req, res) => {
  try {
    const account = await binance.getAccountInfo();
    res.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error('Error fetching account info:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch account info',
    });
  }
};

const getPrice = async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({
        success: false,
        error: 'Symbol is required',
      });
    }

    const price = await binance.getSymbolPrice(symbol);
    res.json({
      success: true,
      price,
    });
  } catch (error) {
    console.error('Error fetching price:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch price',
    });
  }
};

module.exports = {
  buyCrypto,
  sellCrypto,
  getAccount,
  getPrice,
};

