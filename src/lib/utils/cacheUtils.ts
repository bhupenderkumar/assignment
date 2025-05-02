// src/lib/utils/cacheUtils.ts

// Cache expiration time (5 minutes)
export const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Get an item from the cache
 * @param key The cache key
 * @returns The cached item or null if not found or expired
 */
export function getCachedItem<T>(key: string): T | null {
  try {
    const cachedItemJson = sessionStorage.getItem(key);
    const cachedTimestampJson = sessionStorage.getItem(`${key}_timestamp`);
    
    if (!cachedItemJson || !cachedTimestampJson) {
      return null;
    }
    
    const cachedTimestamp = JSON.parse(cachedTimestampJson);
    const now = Date.now();
    
    // Check if cache is still valid
    if (now - cachedTimestamp < CACHE_EXPIRATION) {
      return JSON.parse(cachedItemJson);
    }
    
    // Cache expired, remove it
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_timestamp`);
    return null;
  } catch (e) {
    console.error('Error getting cached item:', e);
    return null;
  }
}

/**
 * Set an item in the cache
 * @param key The cache key
 * @param item The item to cache
 */
export function setCachedItem<T>(key: string, item: T): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(item));
    sessionStorage.setItem(`${key}_timestamp`, JSON.stringify(Date.now()));
  } catch (e) {
    console.error('Error setting cached item:', e);
  }
}

/**
 * Remove an item from the cache
 * @param key The cache key
 */
export function removeCachedItem(key: string): void {
  try {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_timestamp`);
  } catch (e) {
    console.error('Error removing cached item:', e);
  }
}

/**
 * Clear all cached items
 */
export function clearCache(): void {
  try {
    sessionStorage.clear();
  } catch (e) {
    console.error('Error clearing cache:', e);
  }
}
