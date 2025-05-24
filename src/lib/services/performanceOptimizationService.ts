// src/lib/services/performanceOptimizationService.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabaseService';

/**
 * Performance optimization service to reduce redundant API calls and improve caching
 */
class PerformanceOptimizationService {
  private static instance: PerformanceOptimizationService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private client: SupabaseClient | null = null;

  // Cache TTL in milliseconds
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  public static getInstance(): PerformanceOptimizationService {
    if (!PerformanceOptimizationService.instance) {
      PerformanceOptimizationService.instance = new PerformanceOptimizationService();
    }
    return PerformanceOptimizationService.instance;
  }

  /**
   * Get or initialize Supabase client
   */
  private async getClient(): Promise<SupabaseClient> {
    if (!this.client) {
      this.client = await getSupabaseClient(null);
    }
    return this.client;
  }

  /**
   * Generate cache key from query parameters
   */
  private generateCacheKey(table: string, query: any, userId?: string): string {
    const queryString = JSON.stringify(query);
    return `${table}:${userId || 'anonymous'}:${btoa(queryString)}`;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < cached.ttl;
  }

  /**
   * Get data from cache
   */
  private getCachedData<T>(cacheKey: string): T | null {
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || null;
    }

    // Remove expired cache entry
    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * Set data in cache
   */
  private setCachedData(cacheKey: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Optimized fetch with caching and request deduplication
   */
  public async optimizedFetch<T>(
    table: string,
    queryBuilder: (query: any) => any,
    options: {
      userId?: string;
      ttl?: number;
      forceRefresh?: boolean;
      enableCache?: boolean;
    } = {}
  ): Promise<T[]> {
    const { userId, ttl = this.DEFAULT_TTL, forceRefresh = false, enableCache = true } = options;

    // Generate cache key
    const cacheKey = this.generateCacheKey(table, queryBuilder.toString(), userId);

    // Return cached data if available and not forcing refresh
    if (enableCache && !forceRefresh) {
      const cachedData = this.getCachedData<T[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // Check if there's already a pending request for this data
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Create new request
    const requestPromise = this.executeQuery<T>(table, queryBuilder);

    // Store pending request to prevent duplicates
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // Cache the result
      if (enableCache) {
        this.setCachedData(cacheKey, result, ttl);
      }

      return result;
    } finally {
      // Remove from pending requests
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Execute the actual Supabase query
   */
  private async executeQuery<T>(table: string, queryBuilder: (query: any) => any): Promise<T[]> {
    const client = await this.getClient();
    const baseQuery = client.from(table);
    const query = queryBuilder(baseQuery);

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  }

  /**
   * Optimized fetch for single record by ID
   */
  public async optimizedFetchById<T>(
    table: string,
    id: string,
    options: {
      userId?: string;
      ttl?: number;
      forceRefresh?: boolean;
    } = {}
  ): Promise<T | null> {
    const results = await this.optimizedFetch<T>(
      table,
      (query) => query.select('*').eq('id', id).single(),
      { ...options, ttl: options.ttl || this.LONG_TTL }
    );

    return results as any; // Single query returns the object directly
  }

  /**
   * Batch fetch multiple records by IDs
   */
  public async batchFetchByIds<T>(
    table: string,
    ids: string[],
    options: {
      userId?: string;
      ttl?: number;
    } = {}
  ): Promise<T[]> {
    if (ids.length === 0) return [];

    return this.optimizedFetch<T>(
      table,
      (query) => query.select('*').in('id', ids),
      options
    );
  }

  /**
   * Clear cache for specific table or pattern
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear expired cache entries
   */
  public cleanupExpiredCache(): void {
    const now = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    pendingRequests: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const value of this.cache.values()) {
      if (now - value.timestamp < value.ttl) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      pendingRequests: this.pendingRequests.size
    };
  }

  /**
   * Preload data for better performance
   */
  public async preloadData(
    preloadConfig: Array<{
      table: string;
      queryBuilder: (query: any) => any;
      userId?: string;
      ttl?: number;
    }>
  ): Promise<void> {
    const promises = preloadConfig.map(config =>
      this.optimizedFetch(config.table, config.queryBuilder, {
        userId: config.userId,
        ttl: config.ttl || this.LONG_TTL
      }).catch(error => {
        console.warn(`Failed to preload ${config.table}:`, error);
      })
    );

    await Promise.allSettled(promises);
  }
}

// Export singleton instance
export const performanceService = PerformanceOptimizationService.getInstance();

// Auto cleanup expired cache every 5 minutes
setInterval(() => {
  performanceService.cleanupExpiredCache();
}, 5 * 60 * 1000);
