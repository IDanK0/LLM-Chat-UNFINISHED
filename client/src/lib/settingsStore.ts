export interface ApiSettings {
  apiUrl: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  animationSpeed: number; // New setting for animation speed (words per second)
  autoGenerateTitle: boolean; // New setting for automatic title generation
  webSearchEnabled: boolean; // New setting to enable/disable web search
  
  // OpenRouter settings
  openRouterApiKey: string;
  openRouterBaseUrl: string;
  
  // Deepseek settings
  deepseekApiKey: string;
  deepseekBaseUrl: string;
  
  // Default model selection
  defaultModel: string;
}

const DEFAULT_SETTINGS: ApiSettings = {
  apiUrl: '',
  temperature: 0.7,
  maxTokens: -1,
  stream: true,
  animationSpeed: 15,  // Default: 15 words per second
  autoGenerateTitle: true, // Default: activated
  webSearchEnabled: false, // Default: deactivated
  
  // OpenRouter settings
  openRouterApiKey: '',
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
  
  // Deepseek settings
  deepseekApiKey: '',
  deepseekBaseUrl: 'https://api.deepseek.com/v1',
  
  // Default model selection
  defaultModel: 'Qwen3 0.6b'
};

export function getSettings(): ApiSettings {
  try {
    const saved = localStorage.getItem('apiSettings');
    if (saved) {
      // Ensure saved settings have all necessary fields
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
      };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem('apiSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export function resetSettings(): ApiSettings {
  try {
    localStorage.setItem('apiSettings', JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error('Error resetting settings:', error);
  }
  return DEFAULT_SETTINGS;
}