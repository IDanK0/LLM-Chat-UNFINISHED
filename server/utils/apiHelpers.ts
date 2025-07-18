import { getModelProvider } from '../../client/src/lib/modelConfig';

export interface ApiSettings {
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  webSearchEnabled?: boolean;
  webSearchResults?: string;
  
  // OpenRouter settings
  openRouterApiKey?: string;
  openRouterBaseUrl?: string;
  
  // Deepseek settings
  deepseekApiKey?: string;
  deepseekBaseUrl?: string;
}

export interface ApiConfiguration {
  url: string;
  headers: Record<string, string>;
}

/**
 * Configura URL e headers per le API basate sul provider del modello
 */
export function configureApiForProvider(
  modelName: string, 
  settings?: ApiSettings
): ApiConfiguration {
  const provider = getModelProvider(modelName);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  let apiUrl: string;

  switch (provider) {
    case 'openrouter':
      apiUrl = (settings?.openRouterBaseUrl || 'https://openrouter.ai/api/v1')
        .replace(/\/$/, '') + '/chat/completions';
      if (settings?.openRouterApiKey) {
        headers['Authorization'] = `Bearer ${settings.openRouterApiKey}`;
        headers['HTTP-Referer'] = 'https://localhost:3000';
        headers['X-Title'] = 'LLMChat';
      }
      break;
    case 'deepseek':
      apiUrl = (settings?.deepseekBaseUrl || 'https://api.deepseek.com/v1')
        .replace(/\/$/, '') + '/chat/completions';
      if (settings?.deepseekApiKey) {
        headers['Authorization'] = `Bearer ${settings.deepseekApiKey}`;
      }
      break;
    case 'local':
    default:
      apiUrl = settings?.apiUrl || 'http://127.0.0.1:1234/v1/chat/completions';
      break;
  }

  return { url: apiUrl, headers };
}

/**
 * Rimuove i tag <think></think> dal testo
 */
export function removeThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/<\/?think>/g, '')
    .trim();
}

/**
 * Gestisce i timeout per le richieste API
 */
export function createTimeoutHandler(
  modelName: string,
  customTimeout?: number
): { controller: AbortController; timeoutId: NodeJS.Timeout } {
  const isLargeModel = modelName.includes("12b") || 
                      modelName.includes("70b") || 
                      modelName.includes("405b");
  
  const timeoutDuration = customTimeout || 
    (isLargeModel ? 7200000 : 3600000); // 2 hours for large models, 1 hour for others
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
  
  return { controller, timeoutId };
}

/**
 * Gestisce errori comuni delle API
 */
export function handleApiError(error: unknown, modelName: string): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return `I'm sorry, but the request is taking too long. The "${modelName}" model might be temporarily overloaded. Please try again later or select a different model.`;
  }
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`API Error for model ${modelName}:`, errorMessage);
  
  return `I'm sorry, but I can't process your request right now. Please try again later or contact support if the issue persists.`;
}
