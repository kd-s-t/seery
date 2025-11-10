const CACHE_TTL = 6 * 60 * 60 * 1000;

const cache = new Map();

function getCacheKey(type, ...args) {
  return `${type}:${JSON.stringify(args)}`;
}

function isExpired(entry) {
  return Date.now() - entry.timestamp > CACHE_TTL;
}

function get(type, ...args) {
  const key = getCacheKey(type, ...args);
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  if (isExpired(entry)) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function set(type, data, ...args) {
  const key = getCacheKey(type, ...args);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function clear() {
  cache.clear();
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}

setInterval(cleanup, 60 * 60 * 1000);

module.exports = {
  get,
  set,
  clear,
  cleanup
};

