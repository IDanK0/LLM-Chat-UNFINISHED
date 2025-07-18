import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { RefreshCw, Download, Copy, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticInfo {
  browser: string;
  userAgent: string;
  platform: string;
  language: string;
  screen: string;
  viewport: string;
  connection: string;
  timestamp: number;
}

interface HealthCheck {
  status: string;
  lmStudio: {
    isConnected: boolean;
    latency?: number;
    lastChecked?: number;
    error?: string;
  };
}

export default function DiagnosticsPage() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const { toast } = useToast();

  const { data: health, isLoading, error, refetch } = useQuery<HealthCheck>({
    queryKey: ['/api/health'],
    queryFn: async () => {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health status');
      }
      return response.json();
    },
    refetchInterval: 5000,
    retry: 1,
  });

  const generateDiagnostics = () => {
    const nav = navigator as any;
    const info: DiagnosticInfo = {
      browser: nav.userAgentData?.brands?.[0]?.brand || 'Unknown',
      userAgent: nav.userAgent,
      platform: nav.platform,
      language: nav.language,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: nav.connection?.effectiveType || 'Unknown',
      timestamp: Date.now()
    };
    setDiagnosticInfo(info);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Diagnostic information copied to clipboard",
      });
    });
  };

  const downloadDiagnostics = () => {
    const data = {
      health,
      diagnosticInfo,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llmchat-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const troubleshootingSteps = [
    {
      title: "Check LM Studio",
      steps: [
        "Open LM Studio application",
        "Load a model (e.g., Llama, Qwen, Gemma)",
        "Go to 'Local Server' tab",
        "Start the server on port 1234",
        "Verify server is running with green indicator"
      ]
    },
    {
      title: "Verify Network",
      steps: [
        "Check firewall settings",
        "Ensure port 1234 is not blocked",
        "Test connection: http://localhost:1234",
        "Check antivirus software permissions"
      ]
    },
    {
      title: "Application Settings",
      steps: [
        "Check API URL in settings",
        "Verify model selection",
        "Clear browser cache",
        "Refresh the page"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Diagnostics</h1>
            <p className="text-muted-foreground">
              Monitor connection status and troubleshoot issues
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={generateDiagnostics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={downloadDiagnostics} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Connection Status</TabsTrigger>
            <TabsTrigger value="diagnostics">System Info</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ConnectionStatus />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(health?.lmStudio.isConnected ?? false)}
                    Quick Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>LM Studio</span>
                    <Badge variant={health?.lmStudio.isConnected ? "default" : "destructive"}>
                      {health?.lmStudio.isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  
                  {health?.lmStudio.latency && (
                    <div className="flex justify-between items-center">
                      <span>Response Time</span>
                      <Badge variant="outline">
                        {health.lmStudio.latency}ms
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span>Last Check</span>
                    <span className="text-sm text-muted-foreground">
                      {health?.lmStudio.lastChecked ? 
                        new Date(health.lmStudio.lastChecked).toLocaleTimeString() : 
                        'Never'
                      }
                    </span>
                  </div>
                  
                  <Button onClick={() => refetch()} className="w-full" disabled={isLoading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Check Now
                  </Button>
                </CardContent>
              </Card>
            </div>

            {health?.lmStudio.error && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Error Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 p-3 rounded-md">
                    <code className="text-sm">{health.lmStudio.error}</code>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={generateDiagnostics} className="mb-4">
                  Generate Diagnostics
                </Button>
                
                {diagnosticInfo && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold">Browser</h4>
                        <p className="text-sm text-muted-foreground">{diagnosticInfo.browser}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Platform</h4>
                        <p className="text-sm text-muted-foreground">{diagnosticInfo.platform}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Language</h4>
                        <p className="text-sm text-muted-foreground">{diagnosticInfo.language}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Screen</h4>
                        <p className="text-sm text-muted-foreground">{diagnosticInfo.screen}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Viewport</h4>
                        <p className="text-sm text-muted-foreground">{diagnosticInfo.viewport}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Connection</h4>
                        <p className="text-sm text-muted-foreground">{diagnosticInfo.connection}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">User Agent</h4>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <code className="text-xs break-all">{diagnosticInfo.userAgent}</code>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => copyToClipboard(JSON.stringify(diagnosticInfo, null, 2))}
                      variant="outline"
                      className="mt-4"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {troubleshootingSteps.map((section, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {section.steps.map((step, stepIndex) => (
                        <li key={stepIndex} className="flex items-start gap-2 text-sm">
                          <span className="flex-shrink-0 w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                            {stepIndex + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Console Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm">
                  <div>Open browser dev tools (F12) → Console tab to see real-time logs</div>
                  <div className="mt-2 text-gray-400">
                    Filter by: "LM Studio", "API", "Error", or "Connection"
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
