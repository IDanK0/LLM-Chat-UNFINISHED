import { apiRequest } from './queryClient';
import { retryWithBackoff, analyzeError } from './errorHandling';

/**
 * Enhanced API client with retry logic, caching, and performance optimizations
 */

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
  cached: boolean;
  requestTime: number;
}

class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  private generateKey(options: RequestOptions): string {
    return `${options.method}:${options.url}:${JSON.stringify(options.data || {})}`;
  }

  get<T>(options: RequestOptions): T | null {
    const key = this.generateKey(options);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  set<T>(options: RequestOptions, data: T, ttl?: number): void {
    const key = this.generateKey(options);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

class EnhancedApiClient {
  private cache = new RequestCache();
  private pendingRequests = new Map<string, Promise<ApiResponse>>();
  private requestMetrics = {
    totalRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    averageResponseTime: 0,
    responseTimeSum: 0,
  };

  async request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    this.requestMetrics.totalRequests++;

    try {
      // Check cache for GET requests
      if (options.method === 'GET' && options.cache !== false) {
        const cachedData = this.cache.get<T>(options);
        if (cachedData) {
          this.requestMetrics.cacheHits++;
          return {
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: new Headers(),
            cached: true,
            requestTime: 0,
          };
        }
      }

      // Check for pending identical requests to avoid duplicates
      const requestKey = `${options.method}:${options.url}:${JSON.stringify(options.data || {})}`;
      if (this.pendingRequests.has(requestKey)) {
        return this.pendingRequests.get(requestKey)!;
      }

      // Create the request promise
      const requestPromise = this.executeRequest<T>(options, startTime);
      this.pendingRequests.set(requestKey, requestPromise);

      try {
        const response = await requestPromise;
        return response;
      } finally {
        this.pendingRequests.delete(requestKey);
      }
    } catch (error) {
      this.requestMetrics.failedRequests++;
      throw error;
    }
  }

  private async executeRequest<T>(options: RequestOptions, startTime: number): Promise<ApiResponse<T>> {
    const operation = async () => {
      const response = await apiRequest(options.method, options.url, options.data);
      const data = await response.json();
      
      const requestTime = Date.now() - startTime;
      this.updateMetrics(requestTime);

      // Cache successful GET requests
      if (options.method === 'GET' && options.cache !== false && response.ok) {
        this.cache.set(options, data);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        cached: false,
        requestTime,
      };
    };

    // Apply retry logic with backoff
    const maxRetries = options.retries || 3;
    return retryWithBackoff(operation, maxRetries);
  }

  private updateMetrics(requestTime: number): void {
    this.requestMetrics.responseTimeSum += requestTime;
    this.requestMetrics.averageResponseTime = 
      this.requestMetrics.responseTimeSum / this.requestMetrics.totalRequests;
  }

  // Convenience methods
  async get<T = any>(url: string, options: Partial<RequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...options });
  }

  async post<T = any>(url: string, data?: any, options: Partial<RequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...options });
  }

  async put<T = any>(url: string, data?: any, options: Partial<RequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...options });
  }

  async delete<T = any>(url: string, options: Partial<RequestOptions> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...options });
  }

  // Utility methods
  getMetrics() {
    return {
      ...this.requestMetrics,
      cacheSize: this.cache.size(),
      cacheHitRate: this.requestMetrics.cacheHits / this.requestMetrics.totalRequests,
      failureRate: this.requestMetrics.failedRequests / this.requestMetrics.totalRequests,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  resetMetrics(): void {
    this.requestMetrics = {
      totalRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      averageResponseTime: 0,
      responseTimeSum: 0,
    };
  }

  // Batch request support
  async batchRequest<T = any>(requests: RequestOptions[]): Promise<ApiResponse<T>[]> {
    const promises = requests.map(request => this.request<T>(request));
    return Promise.all(promises);
  }

  // Parallel request with concurrency limit
  async parallelRequest<T = any>(
    requests: RequestOptions[], 
    concurrency: number = 5
  ): Promise<ApiResponse<T>[]> {
    const results: ApiResponse<T>[] = [];
    const executing: Promise<void>[] = [];

    for (const request of requests) {
      const promise = this.request<T>(request).then(response => {
        results.push(response);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }

    await Promise.all(executing);
    return results;
  }
}

// Export singleton instance
export const apiClient = new EnhancedApiClient();

// Export for direct usage
export default apiClient;
