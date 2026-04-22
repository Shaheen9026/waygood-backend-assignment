                                                                                                                                              
const env = require("../config/env");

const store = new Map();

function get(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function set(key, value, ttlSeconds) {
  const ttl = (ttlSeconds || env.cacheTtlSeconds || 300) * 1000;
  store.set(key, { value, expiresAt: Date.now() + ttl });
}

function del(key) {
  store.delete(key);
}

function clear() {
  store.clear();
}

module.exports = { get, set, delete: del, clear };