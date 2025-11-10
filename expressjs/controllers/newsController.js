const newsAPI = require('../lib/news');

const getTrendingNews = async (req, res) => {
  try {
    const newsResult = await newsAPI.fetchCryptoNews(10);
    
    if (newsResult.success && newsResult.news.length > 0) {
      return res.json({
        success: true,
        news: newsResult.news,
        count: newsResult.news.length,
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

