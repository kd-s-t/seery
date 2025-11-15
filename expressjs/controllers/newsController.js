const newsAPI = require('../lib/news');
const blockchain = require('../lib/blockchain');

const getTrendingNews = async (req, res) => {
  try {
    const newsResult = await newsAPI.fetchCryptoNews(10);
    
    if (newsResult.success && newsResult.news.length > 0) {
      const libraryItems = newsResult.news.map((item, index) => ({
        id: item.id || `news-${index}`,
        title: item.title || '',
        summary: item.summary || '',
        content: item.summary || '',
        url: item.url || '',
        image: item.image || '',
        date: item.date || '',
        metadata: JSON.stringify(item)
      }));
      
      const blockchainPromise = blockchain.createLibraryOnChain(
        'news',
        ['trending', 'crypto'],
        libraryItems,
        'newspai'
      ).then(libraryResult => {
        if (libraryResult) {
          console.log('News library created on-chain:', libraryResult.libraryId, libraryResult.txHash);
        }
        return libraryResult;
      }).catch(error => {
        console.error('Error storing news to library on-chain:', error);
        return null;
      });
      
      let libraryResult = null;
      try {
        libraryResult = await Promise.race([
          blockchainPromise,
          new Promise(resolve => setTimeout(() => resolve(null), 2000))
        ]);
      } catch (error) {
        console.error('Error waiting for blockchain result:', error);
      }
      
      blockchainPromise.then(result => {
        if (result && !libraryResult) {
          console.log('Blockchain transaction completed after response:', result.libraryId, result.txHash);
        }
      });
      
      return res.json({
        success: true,
        news: newsResult.news,
        count: newsResult.news.length,
        libraryId: libraryResult?.libraryId || null,
        txHash: libraryResult?.txHash || null,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      success: true,
      news: [],
      message: newsResult.message || 'No news available',
      debug: newsResult.debug || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching trending news:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trending news'
    });
  }
};

module.exports = {
  getTrendingNews
};

