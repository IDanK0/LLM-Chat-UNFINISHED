/**
 * Advanced caching system for API responses
 * Supports TTL, LRU eviction, and memory management
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheOptions {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

export class AdvancedCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private options: CacheOptions;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private accessOrder: string[] = [];

  constructor(options: Partial<CacheOptions> = {}) {
    this.cache = new Map();
    this.options = {
      maxSize: options.maxSize || 100,
      defaultTTL: options.defaultTTL || 3600000, // 1 hour
      cleanupInterval: options.cleanupInterval || 300000, // 5 minutes
    };
    
    this.startCleanupTimer();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    
    // Check if entry is expired
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return undefined;
    }

    // Update access information
    entry.accessCount++;
    entry.lastAccessed = now;
    
    // Update LRU order
    this.updateAccessOrder(key);
    
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: ttl || this.options.defaultTTL,
      accessCount: 1,
      lastAccessed: now,
    };

    // If cache is full, remove LRU item
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    size: number;
    maxSize: number;
    memoryUsage: number;
    hitRate: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let totalAccess = 0;
    let totalHits = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    this.cache.forEach((entry) => {
      totalAccess++;
      totalHits += entry.accessCount;
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    });

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      memoryUsage: this.estimateMemoryUsage(),
      hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp,
    };
  }

  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;
    
    const lruKey = this.accessOrder[0];
    this.cache.delete(lruKey);
    this.removeFromAccessOrder(lruKey);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    });
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.options.cleanupInterval);
  }

  private estimateMemoryUsage(): number {
    let totalSize = 0;
    this.cache.forEach((entry) => {
      // Rough estimation of memory usage
      totalSize += JSON.stringify(entry.value).length * 2; // UTF-16 encoding
      totalSize += 100; // Overhead for metadata
    });
    return totalSize;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Default cache instance for API responses
export const responseCache = new AdvancedCache<string>({
  maxSize: 100,
  defaultTTL: 3600000, // 1 hour
  cleanupInterval: 300000, // 5 minutes
});

// Cache for different types of data
export const chatCache = new AdvancedCache<any>({
  maxSize: 50,
  defaultTTL: 1800000, // 30 minutes
});

export const settingsCache = new AdvancedCache<any>({
  maxSize: 10,
  defaultTTL: 86400000, // 24 hours
});
