import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Contract ABI
const CONTRACT_ABI = [
  "function createMarket(string question, string[] outcomes, uint256 durationHours) returns (uint256)",
  "function placeBet(uint256 marketId, uint256 outcome) payable",
  "function getMarket(uint256 marketId) view returns (address creator, string question, uint256 endTime, bool resolved, uint256 winningOutcome, uint256 totalPool)",
  "function getMarketOutcomes(uint256 marketId) view returns (string[])",
  "function getOutcomePool(uint256 marketId, uint256 outcome) view returns (uint256)",
  "event MarketCreated(uint256 indexed marketId, address indexed creator, string question)"
];

function App() {
  const [userAddress, setUserAddress] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [contractAddress, setContractAddress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [marketForm, setMarketForm] = useState({
    question: '',
    outcomes: '',
    duration: 72
  });

  // Check MetaMask
  const checkMetaMask = () => {
    if (typeof window.ethereum === 'undefined') {
      showMessage('Please install MetaMask to use this app', 'error');
      return false;
    }
    return true;
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!checkMetaMask()) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setUserAddress(accounts[0]);
      showMessage('Wallet connected!', 'success');
      loadMarkets();
    } catch (error) {
      showMessage('Failed to connect wallet: ' + error.message, 'error');
    }
  };

  // Get contract address
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/config`);
        const config = await response.json();
        if (config.contractAddress) {
          setContractAddress(config.contractAddress);
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Auto-connect if already connected
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          loadMarkets();
        }
      });
    }
  }, []);

  // Show message
  const showMessage = (message, type) => {
    const msg = { id: Date.now(), message, type };
    setMessages(prev => [...prev, msg]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }, 5000);
  };

  // Load markets
  const loadMarkets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/markets`);
      const data = await response.json();
      
      if (data.success) {
        setMarkets(data.markets);
      }
    } catch (error) {
      showMessage('Error loading markets: ' + error.message, 'error');
    }
  };

  // Create market
  const createMarket = async (e) => {
    e.preventDefault();
    
    if (!userAddress) {
      showMessage('Please connect your wallet first', 'error');
      return;
    }

    if (!checkMetaMask()) return;

    const outcomes = marketForm.outcomes.split(',').map(s => s.trim());
    if (outcomes.length < 2) {
      showMessage('At least 2 outcomes are required', 'error');
      return;
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Please deploy contract first.', 'error');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

      showMessage('Confirm transaction in MetaMask...', 'success');

      const tx = await contract.createMarket(marketForm.question, outcomes, marketForm.duration);
      showMessage(`Transaction sent! Hash: ${tx.hash}`, 'success');
      showMessage('Waiting for confirmation...', 'success');

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        const event = receipt.logs.find(log => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed && parsed.name === 'MarketCreated';
          } catch {
            return false;
          }
        });
        
        let marketId = null;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          marketId = parsed.args.marketId.toString();
        }
        
        showMessage(`Market created successfully! ID: ${marketId || 'pending'}`, 'success');
        setMarketForm({ question: '', outcomes: '', duration: 72 });
        loadMarkets();
      } else {
        showMessage('Transaction failed', 'error');
      }
    } catch (error) {
      if (error.code === 4001) {
        showMessage('Transaction rejected by user', 'error');
      } else {
        showMessage('Error: ' + error.message, 'error');
      }
    }
  };

  // Place bet
  const placeBet = async (marketId, outcome, amount) => {
    if (!userAddress) {
      showMessage('Please connect your wallet first', 'error');
      return;
    }

    if (!checkMetaMask()) return;

    if (!amount || amount < 0.001) {
      showMessage('Minimum bet is 0.001', 'error');
      return;
    }

    if (!contractAddress) {
      showMessage('Contract not deployed. Please deploy contract first.', 'error');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

      const amountWei = ethers.parseEther(amount.toString());
      showMessage('Confirm transaction in MetaMask...', 'success');

      const tx = await contract.placeBet(marketId, outcome, { value: amountWei });
      showMessage(`Transaction sent! Hash: ${tx.hash}`, 'success');
      showMessage('Waiting for confirmation...', 'success');

      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        showMessage('Bet placed successfully!', 'success');
        loadMarkets();
      } else {
        showMessage('Transaction failed', 'error');
      }
    } catch (error) {
      if (error.code === 4001) {
        showMessage('Transaction rejected by user', 'error');
      } else {
        showMessage('Error: ' + error.message, 'error');
      }
    }
  };

  // AI Generate market
  const generateAIMarket = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/generate-markets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'cryptocurrency', count: 3 })
      });

      const data = await response.json();
      if (data.success && data.markets.length > 0) {
        const market = data.markets[0];
        setMarketForm({
          question: market.question,
          outcomes: market.outcomes.join(', '),
          duration: market.durationHours || 72
        });
        showMessage('AI generated market suggestion!', 'success');
      }
    } catch (error) {
      showMessage('Error generating market: ' + error.message, 'error');
    }
  };

  // Load markets on mount
  useEffect(() => {
    loadMarkets();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🔮 Seer</h1>
          <p className="subtitle">AI-Assisted Market Creation & Resolution</p>
        </header>

        <div className="wallet-section">
          <div className="wallet-info">
            <div>
              <strong>Wallet:</strong> <span>{userAddress ? `${userAddress.substring(0, 6)}...${userAddress.substring(38)}` : 'Not connected'}</span>
            </div>
            <button onClick={connectWallet}>Connect Wallet</button>
          </div>
        </div>

        <div className="messages">
          {messages.map(msg => (
            <div key={msg.id} className={msg.type}>
              {msg.message}
            </div>
          ))}
        </div>

        <div className="create-market-section">
          <h2>Create New Market</h2>
          <form onSubmit={createMarket}>
            <div className="form-group">
              <label>Question</label>
              <input
                type="text"
                value={marketForm.question}
                onChange={(e) => setMarketForm({...marketForm, question: e.target.value})}
                placeholder="Will Bitcoin reach $100k by end of 2024?"
                required
              />
            </div>
            <div className="form-group">
              <label>Outcomes (comma-separated)</label>
              <input
                type="text"
                value={marketForm.outcomes}
                onChange={(e) => setMarketForm({...marketForm, outcomes: e.target.value})}
                placeholder="Yes, No"
                required
              />
            </div>
            <div className="form-group">
              <label>Duration (hours)</label>
              <input
                type="number"
                value={marketForm.duration}
                onChange={(e) => setMarketForm({...marketForm, duration: parseInt(e.target.value)})}
                min="1"
                max="168"
                required
              />
            </div>
            <button type="submit">Create Market</button>
            <button type="button" onClick={generateAIMarket} className="ai-btn">🤖 Generate with AI</button>
          </form>
        </div>

        <h2 className="markets-title">Active Markets</h2>
        <div className="markets-grid">
          {markets.length === 0 ? (
            <div className="loading">Loading markets...</div>
          ) : (
            markets.map(market => (
              <MarketCard
                key={market.market_id}
                market={market}
                userAddress={userAddress}
                onPlaceBet={placeBet}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Market Card Component
function MarketCard({ market, userAddress, onPlaceBet }) {
  const [selectedOutcome, setSelectedOutcome] = useState(0);
  const [betAmount, setBetAmount] = useState('0.01');

  const handleBet = () => {
    onPlaceBet(market.market_id, selectedOutcome, parseFloat(betAmount));
  };

  return (
    <div className="market-card">
      <div className={`market-status ${market.resolved ? 'status-resolved' : 'status-active'}`}>
        {market.resolved ? 'Resolved' : 'Active'}
      </div>
      <div className="market-question">{market.question}</div>
      <div className="market-outcomes">
        {market.outcomes.map((outcome, idx) => (
          <div key={idx} className="outcome">
            <span className="outcome-label">{outcome}</span>
            <span className="outcome-pool">
              {market.outcomePools && market.outcomePools[idx]
                ? `${parseFloat(market.outcomePools[idx].total).toFixed(4)}`
                : '0'}
            </span>
          </div>
        ))}
      </div>
      {!market.resolved ? (
        <div className="bet-section">
          <strong>Place Bet:</strong>
          <div className="bet-input">
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(parseInt(e.target.value))}
            >
              {market.outcomes.map((outcome, idx) => (
                <option key={idx} value={idx}>{outcome}</option>
              ))}
            </select>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              placeholder="0.01"
              step="0.001"
              min="0.001"
            />
            <button onClick={handleBet}>Bet</button>
          </div>
        </div>
      ) : (
        <div className="resolved-info">
          Winner: <strong>{market.outcomes[market.winning_outcome]}</strong>
        </div>
      )}
    </div>
  );
}

export default App;
