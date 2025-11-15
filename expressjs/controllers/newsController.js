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
      
      blockchain.createLibraryOnChain(
        'news',
        ['trending', 'crypto'],
        libraryItems,
        'newspai'
      ).then(libraryResult => {
        if (libraryResult) {
          console.log('News library created on-chain:', libraryResult.libraryId, libraryResult.txHash);
        }
      }).catch(error => {
        console.error('Error storing news to library on-chain:', error);
      });
      
      return res.json({
        success: true,
        news: newsResult.news,
        count: newsResult.news.length,
        libraryId: null,
        txHash: null,
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

