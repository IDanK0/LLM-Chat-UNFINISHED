import { getApiModelName, getModelProvider } from '../../client/src/lib/modelConfig';
import { createLogger } from '../utils/logger';
import { 
  configureApiForProvider, 
  removeThinkingTags, 
  createTimeoutHandler, 
  handleApiError,
  ApiSettings 
} from '../utils/apiHelpers';

// Dedicated logger for the Model Adapter
const logger = createLogger('ModelAdapter');

interface LlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  message: {
    content: string;
  }
}

/**
 * Adapter for the AI model provider
 * Provides a unified interface to interact with AI models
 */
export class ModelProvider {
  private modelName: string;
  private config: { url: string; headers: Record<string, string> };
  
  constructor(modelName?: string, settings?: ApiSettings) {
    this.modelName = modelName || "Llama 3.1 8b Instruct";
    this.config = configureApiForProvider(this.modelName, settings);
    
    logger.debug(`Provider created for model: ${this.modelName}, URL: ${this.config.url}`);
  }
  
  /**
   * Executes a call to the AI model with a message
   */
  async chat(options: {
    messages: Array<{role: string, content: string}>;
    temperature?: number;
    max_tokens?: number;
  }): Promise<ChatResponse> {
    const { controller, timeoutId } = createTimeoutHandler(this.modelName);
    
    try {
      const apiModelName = getApiModelName(this.modelName);
      const provider = getModelProvider(this.modelName);
      logger.info(`Sending request to model: ${apiModelName} via ${provider}`);
      
      // Determine the appropriate max_tokens value based on provider
      let maxTokens: number;
      if (provider === 'deepseek' || provider === 'openrouter') {
        // For cloud APIs, use a reasonable default (they don't accept -1)
        maxTokens = options.max_tokens && options.max_tokens > 0 ? options.max_tokens : 1000;
      } else {
        // For local APIs, use -1 to indicate no limit, or the user's setting
        maxTokens = options.max_tokens ?? -1;
      }
      
      // Create the request body
      const requestBody = {
        model: apiModelName,
        messages: options.messages as LlamaMessage[],
        temperature: options.temperature ?? 0.7,
        max_tokens: maxTokens,
        stream: false
      };
      
      logger.debug(`Request parameters: temperature=${requestBody.temperature}, max_tokens=${requestBody.max_tokens}`);
      
      // Execute the request
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: this.config.headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      logger.info(`Response received from model ${apiModelName}`);
      const data = await response.json();
      
      // Extract content from the response and remove <think> tags
      let content = data.choices[0].message.content;
      content = removeThinkingTags(content);
      logger.debug(`Processed content, length: ${content.length} characters`);
      
      // Adapt the response to the expected format
      return {
        message: {
          content: content
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      logger.error(`Error in model call ${this.modelName}:`, error);
      
      // Return a fallback response in case of error
      return {
        message: {
          content: handleApiError(error, this.modelName)
        }
      };
    }
  }
}

/**
 * Gets a provider for the specified model
 * @param modelName Model name (optional)
 * @param settings API settings containing keys and URLs
 * @returns Model provider
 */
export function getProviderForModel(modelName?: string, settings?: ApiSettings): ModelProvider {
  logger.debug(`Provider requested for model: ${modelName || "default"}`);
  return new ModelProvider(modelName, settings);
} 