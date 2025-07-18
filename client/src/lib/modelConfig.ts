// Centralized model configuration
// This file serves both the frontend and backend through the API

export type ModelProvider = 'local' | 'openrouter' | 'deepseek';

export interface ModelConfig {
  displayName: string;  // Name displayed in the user interface
  apiName: string;      // Technical name used for API calls
  provider: ModelProvider; // Model provider type
  supportsImages: boolean; // Indicates if the model supports image processing
  supportsWeb: boolean; // Indicates if the model supports web search
}

// Array of all available models
export const availableModels: ModelConfig[] = [
  // Local models
  {
    displayName: "Qwen3 0.6b",
    apiName: "qwen3-0.6b",
    provider: "local",
    supportsImages: false,
    supportsWeb: true
  },
  {
    displayName: "Qwen3 4b",
    apiName: "qwen3-4b",
    provider: "local",
    supportsImages: false,
    supportsWeb: true
  },
  {
    displayName: "Gemma 3 4b it",
    apiName: "google/gemma-3-4b",
    provider: "local",
    supportsImages: true,
    supportsWeb: false
  },
  {
    displayName: "Qwen3 8b",
    apiName: "qwen3-8b",
    provider: "local",
    supportsImages: false,
    supportsWeb: true
  },
  {
    displayName: "Llama 3.1 8b Instruct",
    apiName: "meta-llama-3.1-8b-instruct",
    provider: "local",
    supportsImages: false,
    supportsWeb: false
  },
  {
    displayName: "Gemma 3 12b it",
    apiName: "gemma-3-12b-it-qat",
    provider: "local",
    supportsImages: true,
    supportsWeb: false
  },
  {
    displayName: "Qwen3 14b",
    apiName: "qwen3-14b",
    provider: "local",
    supportsImages: false,
    supportsWeb: true
  },
  {
    displayName: "Qwen3 30b",
    apiName: "qwen3-30b-a3b",
    provider: "local",
    supportsImages: false,
    supportsWeb: true
  },
  
  // OpenRouter models
  {
    displayName: "GPT-4o",
    apiName: "openai/gpt-4o",
    provider: "openrouter",
    supportsImages: true,
    supportsWeb: true
  },
  {
    displayName: "GPT-4o Mini",
    apiName: "openai/gpt-4o-mini",
    provider: "openrouter",
    supportsImages: true,
    supportsWeb: true
  },
  {
    displayName: "Claude 3.5 Sonnet",
    apiName: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    supportsImages: true,
    supportsWeb: true
  },
  {
    displayName: "Claude 3.5 Haiku",
    apiName: "anthropic/claude-3.5-haiku",
    provider: "openrouter",
    supportsImages: true,
    supportsWeb: true
  },
  {
    displayName: "Gemini Pro 1.5",
    apiName: "google/gemini-pro-1.5",
    provider: "openrouter",
    supportsImages: true,
    supportsWeb: true
  },
  {
    displayName: "Llama 3.1 405B",
    apiName: "meta-llama/llama-3.1-405b-instruct",
    provider: "openrouter",
    supportsImages: false,
    supportsWeb: true
  },
  {
    displayName: "Llama 3.1 70B",
    apiName: "meta-llama/llama-3.1-70b-instruct",
    provider: "openrouter",
    supportsImages: false,
    supportsWeb: true
  },
  
  // Deepseek models
  {
    displayName: "DeepSeek Chat",
    apiName: "deepseek-chat",
    provider: "deepseek",
    supportsImages: false,
    supportsWeb: true
  },
  {
    displayName: "DeepSeek Coder",
    apiName: "deepseek-coder",
    provider: "deepseek",
    supportsImages: false,
    supportsWeb: true
  }
  // To add a new model, simply insert a new entry here
];

// Default model
export const defaultModel = availableModels[0].displayName;

// Helper function to get the API name from a display name
export function getApiModelName(displayName: string): string {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.apiName : availableModels[0].apiName; // Fallback to first model
}

// Helper function to get the provider from a display name
export function getModelProvider(displayName: string): ModelProvider {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.provider : availableModels[0].provider;
}

// Helper function to check if a model supports images
export function modelSupportsImages(displayName: string): boolean {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.supportsImages : false; // Fallback to false for safety
}

// Helper function to check if a model supports web search
export function modelSupportsWeb(displayName: string): boolean {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.supportsWeb : false;
}

// Helper function to get models by provider
export function getModelsByProvider(provider: ModelProvider): ModelConfig[] {
  return availableModels.filter(m => m.provider === provider);
}

// Generates the model map for backward compatibility
export const MODEL_NAME_MAP = availableModels.reduce((map, model) => {
  map[model.displayName] = model.apiName;
  return map;
}, {} as Record<string, string>);