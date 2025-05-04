// Centralized model configuration
// This file serves both the frontend and backend through the API

export interface ModelConfig {
  displayName: string;  // Name displayed in the user interface
  apiName: string;      // Technical name used for API calls
  supportsImages: boolean; // Indicates if the model supports image processing
}

// Array of all available models
export const availableModels: ModelConfig[] = [
  {
    displayName: "Qwen3 0.6b",
    apiName: "qwen3-0.6b",
    supportsImages: false
  },
  {
    displayName: "Qwen3 4b",
    apiName: "qwen3-4b",
    supportsImages: false
  },
  {
    displayName: "Gemma 3 4b it",
    apiName: "gemma-3-4b-it-qat",
    supportsImages: true
  },
  {
    displayName: "Qwen3 8b",
    apiName: "qwen3-8b",
    supportsImages: false
  },
  {
    displayName: "Llama 3.1 8b Instruct",
    apiName: "meta-llama-3.1-8b-instruct",
    supportsImages: false
  },
  {
    displayName: "Gemma 3 12b it",
    apiName: "gemma-3-12b-it-qat",
    supportsImages: true
  },
  {
    displayName: "Qwen3 14b",
    apiName: "qwen3-14b",
    supportsImages: false
  },
  {
    displayName: "Qwen3 30b",
    apiName: "qwen3-30b-a3b",
    supportsImages: false
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

// Helper function to check if a model supports images
export function modelSupportsImages(displayName: string): boolean {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.supportsImages : false; // Fallback to false for safety
}
// Generates the model map for backward compatibility
export const MODEL_NAME_MAP = availableModels.reduce((map, model) => {
  map[model.displayName] = model.apiName;
  return map;
}, {} as Record<string, string>);