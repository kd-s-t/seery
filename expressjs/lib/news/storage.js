const newsStorage = new Map();

function storeNews(key, newsData, source = 'newspai') {
  const formattedNews = newsData.map(item => ({
    ...item,
    source: source
  }));
  
  newsStorage.set(key, {
    data: formattedNews,
    timestamp: Date.now(),
    source: source
  });
  
  return formattedNews;
}

function getNews(key) {
  const entry = newsStorage.get(key);
  if (!entry) {
    return null;
  }
  return {
    news: entry.data,
    timestamp: entry.timestamp,
    source: entry.source
  };
}

function getAllNews() {
  const allNews = [];
  for (const [key, entry] of newsStorage.entries()) {
    allNews.push({
      key,
      news: entry.data,
      timestamp: entry.timestamp,
      source: entry.source
    });
  }
  return allNews;
}

function getLatestNews() {
  let latest = null;
  let latestTimestamp = 0;
  
  for (const [key, entry] of newsStorage.entries()) {
    if (entry.timestamp > latestTimestamp) {
      latestTimestamp = entry.timestamp;
      latest = {
        key,
        news: entry.data,
        timestamp: entry.timestamp,
        source: entry.source
      };
    }
  }
  
  return latest;
}

function clearNews(key = null) {
  if (key) {
    newsStorage.delete(key);
  } else {
    newsStorage.clear();
  }
}

module.exports = {
  storeNews,
  getNews,
  getAllNews,
  getLatestNews,
  clearNews
};

