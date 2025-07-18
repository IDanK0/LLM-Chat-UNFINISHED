import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface HealthStatus {
  lmStudio: {
    isConnected: boolean;
    lastChecked: number;
    error?: string;
    latency?: number;
  };
  recommendations: string[];
  timestamp: number;
}

export function ConnectionStatus() {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: health, isLoading, error, refetch } = useQuery<HealthStatus>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });

  const getStatusColor = () => {
    if (isLoading) return 'bg-gray-500';
    if (error || !health?.lmStudio.isConnected) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-4 w-4" />;
    if (error || !health?.lmStudio.isConnected) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (error) return 'Connection check failed';
    if (!health?.lmStudio.isConnected) return 'LM Studio not connected';
    return `Connected (${health.lmStudio.latency}ms)`;
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span>LM Studio Status</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm">{getStatusText()}</span>
        </div>
        
        {health?.lmStudio.lastChecked && (
          <div className="text-xs text-muted-foreground">
            Last checked: {formatTime(health.lmStudio.lastChecked)}
          </div>
        )}
        
        {health?.lmStudio.error && (
          <div className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
            Error: {health.lmStudio.error}
          </div>
        )}
        
        {health?.recommendations && health.recommendations.length > 0 && (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? 'Hide' : 'Show'} Recommendations
            </Button>
            
            {isExpanded && (
              <div className="space-y-2">
                {health.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs">
                    <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Auto-refresh: 30s</span>
            {health?.lmStudio.isConnected && (
              <Badge variant="secondary" className="text-xs">
                Ready
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for header/sidebar
export function ConnectionStatusCompact() {
  const { data: health, isLoading, error } = useQuery<HealthStatus>({
    queryKey: ['/api/health'],
    refetchInterval: 30000,
    retry: 1,
  });

  const getStatusColor = () => {
    if (isLoading) return 'bg-gray-500';
    if (error || !health?.lmStudio.isConnected) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (error) return 'Error';
    if (!health?.lmStudio.isConnected) return 'Disconnected';
    return 'Connected';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-muted-foreground">{getStatusText()}</span>
    </div>
  );
}
