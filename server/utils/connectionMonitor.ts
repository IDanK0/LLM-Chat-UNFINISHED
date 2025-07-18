import { ServerConfig } from '../config';

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: number;
  error?: string;
  latency?: number;
}

class ConnectionMonitor {
  private status: ConnectionStatus = {
    isConnected: false,
    lastChecked: 0
  };
  
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private readonly REQUEST_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.startMonitoring();
  }

  async checkConnection(url: string = ServerConfig.DEFAULT_API_URL): Promise<ConnectionStatus> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      // Test with a minimal request
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'test',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const latency = Date.now() - startTime;
      
      this.status = {
        isConnected: true,
        lastChecked: Date.now(),
        latency,
        error: undefined
      };
      
      console.log(`✅ LM Studio connection OK (${latency}ms)`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.status = {
        isConnected: false,
        lastChecked: Date.now(),
        error: errorMessage
      };
      
      console.log(`❌ LM Studio connection failed: ${errorMessage}`);
    }
    
    return this.status;
  }

  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  isStale(): boolean {
    const age = Date.now() - this.status.lastChecked;
    return age > this.CHECK_INTERVAL;
  }

  async getStatusWithRefresh(url?: string): Promise<ConnectionStatus> {
    if (this.isStale()) {
      await this.checkConnection(url);
    }
    return this.getStatus();
  }

  startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Initial check
    this.checkConnection();
    
    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.checkConnection();
    }, this.CHECK_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Get connection recommendations
  getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.status.isConnected) {
      recommendations.push('Start LM Studio and load a model');
      recommendations.push('Enable local server in LM Studio settings');
      recommendations.push('Check that LM Studio is running on port 1234');
    }
    
    if (this.status.latency && this.status.latency > 5000) {
      recommendations.push('Consider using a smaller model for better performance');
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const connectionMonitor = new ConnectionMonitor();

// Health check endpoint data
export async function getHealthCheck(): Promise<{
  lmStudio: ConnectionStatus;
  recommendations: string[];
  timestamp: number;
}> {
  const lmStudioStatus = await connectionMonitor.getStatusWithRefresh();
  const recommendations = connectionMonitor.getRecommendations();
  
  return {
    lmStudio: lmStudioStatus,
    recommendations,
    timestamp: Date.now()
  };
}
