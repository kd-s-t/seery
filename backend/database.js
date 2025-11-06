const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const db = new Database(path.join(__dirname, 'prediction_market.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS markets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER UNIQUE,
    creator_address TEXT NOT NULL,
    question TEXT NOT NULL,
    outcomes TEXT NOT NULL,
    end_time INTEGER NOT NULL,
    resolved BOOLEAN DEFAULT 0,
    winning_outcome INTEGER,
    total_pool TEXT DEFAULT '0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER NOT NULL,
    user_address TEXT NOT NULL,
    outcome INTEGER NOT NULL,
    amount TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(market_id)
  );

  CREATE TABLE IF NOT EXISTS ai_resolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    market_id INTEGER NOT NULL,
    suggested_outcome INTEGER,
    confidence REAL,
    reasoning TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (market_id) REFERENCES markets(market_id)
  );

  CREATE INDEX IF NOT EXISTS idx_market_id ON markets(market_id);
  CREATE INDEX IF NOT EXISTS idx_bets_market ON bets(market_id);
  CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_address);
`);

// Market operations
const marketOps = {
  create: (marketData) => {
    const stmt = db.prepare(`
      INSERT INTO markets (market_id, creator_address, question, outcomes, end_time)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      marketData.marketId,
      marketData.creatorAddress,
      marketData.question,
      JSON.stringify(marketData.outcomes),
      marketData.endTime
    );
  },

  get: (marketId) => {
    const stmt = db.prepare('SELECT * FROM markets WHERE market_id = ?');
    const market = stmt.get(marketId);
    if (market) {
      market.outcomes = JSON.parse(market.outcomes);
    }
    return market;
  },

  getAll: (limit = 50, offset = 0) => {
    const stmt = db.prepare(`
      SELECT * FROM markets 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    const markets = stmt.all(limit, offset);
    return markets.map(m => ({
      ...m,
      outcomes: JSON.parse(m.outcomes)
    }));
  },

  resolve: (marketId, winningOutcome) => {
    const stmt = db.prepare(`
      UPDATE markets 
      SET resolved = 1, winning_outcome = ?, resolved_at = CURRENT_TIMESTAMP
      WHERE market_id = ?
    `);
    return stmt.run(winningOutcome, marketId);
  },

  updatePool: (marketId, totalPool) => {
    const stmt = db.prepare(`
      UPDATE markets 
      SET total_pool = ?
      WHERE market_id = ?
    `);
    return stmt.run(totalPool.toString(), marketId);
  }
};

// Bet operations
const betOps = {
  create: (betData) => {
    const stmt = db.prepare(`
      INSERT INTO bets (market_id, user_address, outcome, amount)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(
      betData.marketId,
      betData.userAddress,
      betData.outcome,
      betData.amount.toString()
    );
  },

  getUserBets: (userAddress, marketId = null) => {
    if (marketId) {
      const stmt = db.prepare(`
        SELECT * FROM bets 
        WHERE user_address = ? AND market_id = ?
        ORDER BY created_at DESC
      `);
      return stmt.all(userAddress, marketId);
    } else {
      const stmt = db.prepare(`
        SELECT * FROM bets 
        WHERE user_address = ?
        ORDER BY created_at DESC
      `);
      return stmt.all(userAddress);
    }
  },

  getMarketBets: (marketId) => {
    const stmt = db.prepare(`
      SELECT * FROM bets 
      WHERE market_id = ?
      ORDER BY created_at DESC
    `);
    return stmt.all(marketId);
  },

  getOutcomeTotal: (marketId, outcome) => {
    const stmt = db.prepare(`
      SELECT SUM(CAST(amount AS REAL)) as total
      FROM bets
      WHERE market_id = ? AND outcome = ?
    `);
    const result = stmt.get(marketId, outcome);
    return result ? parseFloat(result.total) : 0;
  }
};

// AI Resolution operations
const aiOps = {
  create: (resolutionData) => {
    const stmt = db.prepare(`
      INSERT INTO ai_resolutions (market_id, suggested_outcome, confidence, reasoning)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(
      resolutionData.marketId,
      resolutionData.suggestedOutcome,
      resolutionData.confidence,
      resolutionData.reasoning
    );
  },

  get: (marketId) => {
    const stmt = db.prepare(`
      SELECT * FROM ai_resolutions 
      WHERE market_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `);
    return stmt.get(marketId);
  }
};

module.exports = {
  db,
  markets: marketOps,
  bets: betOps,
  ai: aiOps
};

