const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY;
const BINANCE_TESTNET = process.env.BINANCE_TESTNET === 'true' || !BINANCE_API_KEY;
const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL || 'https://api.binance.com';

const BASE_URL = BINANCE_TESTNET 
  ? 'https://testnet.binance.vision/api/v3'
  : `${BINANCE_BASE_URL}/api/v3`;

function generateSignature(queryString) {
  if (!BINANCE_SECRET_KEY) {
    throw new Error('BINANCE_SECRET_KEY not configured');
  }
  return crypto
    .createHmac('sha256', BINANCE_SECRET_KEY)
    .update(queryString)
    .digest('hex');
}

async function makeAuthenticatedRequest(method, endpoint, params = {}) {
  if (!BINANCE_API_KEY) {
    throw new Error('BINANCE_API_KEY not configured. Trading is disabled.');
  }

  const timestamp = Date.now();
  const queryString = new URLSearchParams({
    ...params,
    timestamp,
  }).toString();

  const signature = generateSignature(queryString);
  const url = `${BASE_URL}${endpoint}?${queryString}&signature=${signature}`;

  try {
    const response = await axios({
      method,
      url,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Binance API error: ${error.response.data.msg || error.response.statusText}`);
    }
    throw error;
  }
}

async function placeOrder(symbol, side, type, quantity, price = null, quoteOrderQty = null) {
  const params = {
    symbol: symbol.toUpperCase(),
    side: side.toUpperCase(),
    type: type.toUpperCase(),
  };

  if (type.toUpperCase() === 'MARKET') {
    if (quoteOrderQty) {
      params.quoteOrderQty = quoteOrderQty;
    } else if (quantity) {
      params.quantity = quantity;
    }
  } else {
    if (!price) {
      throw new Error('Price is required for LIMIT orders');
    }
    params.price = price;
    params.quantity = quantity;
    params.timeInForce = 'GTC';
  }

  return makeAuthenticatedRequest('POST', '/order', params);
}

async function getAccountInfo() {
  return makeAuthenticatedRequest('GET', '/account');
}

async function getSymbolPrice(symbol) {
  try {
    const response = await axios.get(`${BASE_URL}/ticker/price`, {
      params: { symbol: symbol.toUpperCase() },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(`Binance API error: ${error.response.data.msg || error.response.statusText}`);
    }
    throw error;
  }
}

async function getOrderStatus(symbol, orderId) {
  return makeAuthenticatedRequest('GET', '/order', {
    symbol: symbol.toUpperCase(),
    orderId,
  });
}

module.exports = {
  placeOrder,
  getAccountInfo,
  getSymbolPrice,
  getOrderStatus,
  BINANCE_TESTNET,
};

