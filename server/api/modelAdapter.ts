import { getApiModelName } from '../../client/src/lib/modelConfig';
import { ServerConfig } from '../config';
import { createLogger } from '../utils/logger';

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
 * Removes <think></think> tags from text
 * @param text Text to filter
 * @returns Filtered text
 */
function removeThinkingTags(text: string): string {
  // Remove all <think> tags and their content
  return text.replace(/<think>[\s\S]*?<\/think>/g, '')
    // Remove any remaining tags
    .replace(/<\/?think>/g, '')
    // Normalize multiple whitespaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Adapter for the AI model provider
 * Provides a unified interface to interact with AI models
 */
export class ModelProvider {
  private modelName: string;
  private apiUrl: string;
  
  constructor(modelName?: string) {
    this.modelName = modelName || "Llama 3.1 8b Instruct";
    this.apiUrl = ServerConfig.DEFAULT_API_URL;
    logger.debug(`Provider created for model: ${this.modelName}`);
  }
  
  /**
   * Executes a call to the AI model with a message
   */
  async chat(options: {
    messages: Array<{role: string, content: string}>;
    temperature?: number;
    max_tokens?: number;
  }): Promise<ChatResponse> {
    try {
      const apiModelName = getApiModelName(this.modelName);
      logger.info(`Sending request to model: ${apiModelName}`);
      
      // Create the request body
      const requestBody = {
        model: apiModelName,
        messages: options.messages as LlamaMessage[],
        temperature: options.temperature ?? 0.7,
        max_tokens: -1, // Always -1 to remove token limitations
        stream: false
      };
      
      // Execute the request
      logger.debug(`Request parameters: temperature=${requestBody.temperature}, max_tokens=${requestBody.max_tokens}`);
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
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
      logger.error(`Error in model call ${this.modelName}:`, error);
      // Return a fallback response in case of error
      return {
        message: {
          content: "An error occurred while processing the request."
        }
      };
    }
  }
}

/**
 * Gets a provider for the specified model
 * @param modelName Model name (optional)
 * @returns Model provider
 */
export function getProviderForModel(modelName?: string): ModelProvider {
  logger.debug(`Provider requested for model: ${modelName || "default"}`);
  return new ModelProvider(modelName);
} 