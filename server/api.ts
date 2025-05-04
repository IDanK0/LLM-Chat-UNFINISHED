import { ServerConfig } from './config';
// Define the Message interface directly here instead of importing it
interface Message {
  id: string;
  chatId: string;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}
import { getApiModelName } from '../client/src/lib/modelConfig';

// API request settings interface
interface ApiRequestSettings {
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean; // Kept for compatibility but won't be used
  webSearchEnabled?: boolean; // New field to enable web search
  webSearchResults?: string; // Pre-formatted web search results
}

// Interface for messages formatted for Llama
interface LlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Simple cache implementation to improve performance
class SimpleCache {
  private cache: Map<string, { value: string, timestamp: number }>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): string | undefined {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < 3600000) { // Cache valid for one hour
      return item.value;
    }
    return undefined;
  }

  set(key: string, value: string): void {
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        const oldestKey = keys[0];
      this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Cache instance
const responseCache = new SimpleCache();

// Convert messages from DB format to API format - Optimized
function convertMessagesToLlamaFormat(messages: Message[], modelName: string): LlamaMessage[] {
  // Current date formatted for the system message
  const formattedDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const systemContent = `You are a helpful, precise, and friendly AI assistant. Today is ${formattedDate}. 

FORMATTING GUIDELINES:
- Use headings (### or ##) to divide long sections
- Use bullet points or numbered lists to structure related information
- Highlight key concepts in **bold**
- Use italics *when appropriate* for specific terms
- Use inline code \`for short snippets\` where appropriate
- Insert code blocks with triple backticks for longer examples
- Keep paragraphs short and well-spaced for easier reading
- Use appropriate spacing between paragraphs and sections

IMPORTANT: Always respond in the same language used by the user. If they write in Italian, respond in Italian. If they write in English, respond in English, and so on.

Respond accurately, naturally, and with good formatting, maintaining a conversational style.`;
  
  let result: LlamaMessage[] = [];
  
  // For all models, we use the standard format with system message
  result.push({
    role: 'system',
    content: systemContent
  });
  
  for (const message of messages) {
    result.push({
      role: message.isUserMessage ? 'user' : 'assistant',
      content: message.content
    });
  }
  
  return result;
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
    // Don't normalize whitespace to preserve line breaks
    .trim();
}

export async function generateAIResponse(
  messages: Message[], 
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  try {
    if (!messages || messages.length === 0) {
      return "There are no messages to process.";
    }
    
    // Get the technical model name from the helper function
    const apiModelName = getApiModelName(modelName);
    
    // Use the API URL from settings or the default from centralized configuration
    const apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
    
    console.log(`Generating response using model: ${apiModelName} at ${apiUrl}`);
    
    // Prepare the conversation context as text
    let conversationText = "### Conversation:\n\n";
    
    // Extract the most recent messages to keep the request lighter
    const recentMessages = messages.slice(-6);
    
    // Format the conversation as text
    for (const message of recentMessages) {
      const role = message.isUserMessage ? "User" : "Assistant";
      conversationText += `${role}: ${message.content.trim()}\n\n`;
    }
    
    // Add web search results if enabled
    if (settings?.webSearchEnabled && settings?.webSearchResults) {
      conversationText += `\n\n### Potentially Relevant Web Search Results\n\n${settings.webSearchResults}\n\n`;
    }
    
    // Add an explicit request for the response
    conversationText += "### Instructions:\nRespond as if you were the assistant in the conversation above. Make sure to format your text well using headings, lists, bold and italic where appropriate to improve readability. ";
    
    // Add specific instructions if web search is enabled
    if (settings?.webSearchEnabled && settings?.webSearchResults) {
      conversationText += "Use information from the web search results when relevant to the user's question. ";
      conversationText += "For each specific piece of information you use from the search results, add a numerical reference in square brackets, e.g. [1], [2], etc. ";
      conversationText += "IMPORTANT: At the end of your response, always add a 'Citations:' section with a numbered list of the sources used, in this format: ";
      conversationText += "'Citations:\\n[1]: Wikipedia: Article Title\\n[2]: Wikipedia: Another Article\\n...' ";
      conversationText += "Each reference should point to a specific Wikipedia article cited in the response. ";
      conversationText += "Make sure the reference numbers in the text exactly match the citations list. ";
    }
    
    conversationText += "IMPORTANT: Respond in the same language the user is using. ";
    conversationText += "Provide ONLY the response, without prefixes like 'Assistant:'.";
    
    // Cache implementation for repeated requests
    const cacheKey = JSON.stringify({ 
      conversation: conversationText, 
      model: apiModelName,
      webSearch: settings?.webSearchEnabled || false
    });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Using cached response");
      return cachedResponse;
    }
    
    // Create messages with the same format as improveText that we know works
    const adaptedMessages: LlamaMessage[] = [
      {
        role: 'system',
        content: `You are a helpful, precise, and friendly AI assistant. Your task is to provide the next assistant response in the conversation.

FORMATTING GUIDELINES:
- Use headings (### or ##) to divide long sections
- Use bullet points or numbered lists to structure related information
- Highlight key concepts in **bold**
- Use italics *when appropriate* for specific terms
- Use inline code \`for short snippets\` where appropriate
- Insert code blocks with triple backticks for longer examples
- Keep paragraphs short and well-spaced for easier reading
- Use appropriate spacing between paragraphs and sections

IMPORTANT: Always respond in the same language used by the user. If they write in Italian, respond in Italian. If they write in English, respond in English, and so on.

Respond naturally and appropriately to the context of the conversation, ensuring that the text is well formatted for better readability.`
      },
      {
        role: 'user',
        content: conversationText
      }
    ];
    
    // Create the request body using the same format as improveText
    const requestBody = {
      model: apiModelName,
      messages: adaptedMessages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: -1, // Always -1 to remove token limitations
      stream: false // Explicitly set to false
    };
    
    // Log the request for debugging
    console.log(`Request body (simplified):`, JSON.stringify(requestBody).substring(0, 500) + "...");
    
    // Configure the timeout for the request
    const isLargeModel = apiModelName.includes("12b") || apiModelName.includes("70b");
    const timeoutDuration = isLargeModel ? ServerConfig.API_TIMEOUT * 2 : ServerConfig.API_TIMEOUT;
    console.log(`Setting timeout to ${timeoutDuration}ms for model ${apiModelName}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      // Execute the request with the same headers and parameters as improveText
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API response error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // Get the JSON response
      const data = await response.json();
      
      // Extract the response content
      let content = data.choices && data.choices[0]?.message?.content;
      
      // If there's no content, return an error message
      if (!content) {
        throw new Error("No content in API response");
      }
      
      // Clean up the response - remove prefixes like "Assistant:" if present
      content = content.replace(/^(Assistente|Assistant):\s*/i, '').trim();
      
      // Filter thinking tags
      const filteredResponse = removeThinkingTags(content);
      
      // Save the response in the cache
      responseCache.set(cacheKey, filteredResponse);
      
      return filteredResponse;
    } catch (fetchError) {
      // Clean up the timeout in case of error
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return `I'm sorry, but generating the response is taking too long. The "${modelName}" model might be temporarily overloaded. You can wait a few minutes and try again or select a smaller model.`;
    }
    
    // More detailed error to help with debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Detailed error for model ${modelName}: ${errorMessage}`);
    
    return `I'm sorry, but I can't generate a response at the moment. Please try with another model or contact support.`;
  }
}

export async function improveText(
  text: string,
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return "The provided text is empty. Please enter text to improve.";
  }
  
  try {
    // Get the technical model name from the helper function
    const apiModelName = getApiModelName(modelName);
    
    const apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
    
    console.log(`Improving text with model: ${apiModelName} at URL: ${apiUrl}`);
    
    // Create messages for prompt improvement - all models use the same format
    const messages: LlamaMessage[] = [
      {
        role: 'system',
        content: `You are a prompt engineering expert. Your task is to rewrite the user's prompt to make it clearer, more detailed, and better structured, with the goal of getting more precise and relevant responses from an AI model.

When rewriting the prompt, make sure to:
1. Organize information logically and in a structured way
2. Use headings, bullet points or numbered lists when appropriate
3. Highlight key concepts with appropriate formatting (bold, italics)
4. Add adequate spacing to improve readability
5. Maintain a well-organized and easy-to-read format

IMPORTANT: Preserve the original language of the prompt. If the user writes in Italian, respond in Italian. If they write in English, respond in English, and so on.

Return exclusively the optimized version of the prompt, without adding explanations or additional text.`
      },
      {
        role: 'user',
        content: text
      }
    ];
    
    // Cache implementation for repeated requests
    const cacheKey = JSON.stringify({ text, model: apiModelName, action: 'improve' });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Using cached response for text improvement");
      return cachedResponse;
    }
    
    // Create the request body
    const requestBody = {
      model: apiModelName,
      messages: messages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: settings?.maxTokens ?? 1000,
      stream: false
    };
    
    // Configure the timeout for the request - Use a longer timeout for models that might be slower
    const isLargeModel = apiModelName.includes("12b") || apiModelName.includes("32b");
    const timeoutDuration = isLargeModel ? ServerConfig.API_TIMEOUT * 2 : ServerConfig.API_TIMEOUT;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      // Execute the request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API response error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // Get the JSON response
      const data = await response.json();
      
      // Extract the response content
      let content = data.choices && data.choices[0]?.message?.content;
      
      // If there's no content, return an error message
      if (!content) {
        throw new Error("No content in API response");
      }
      
      // Save the response in the cache
      responseCache.set(cacheKey, content);
      
      return content;
    } catch (fetchError) {
      // Clean up the timeout in case of error
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error improving text:', error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return `I'm sorry, but improving the text is taking too long. The "${modelName}" model might be temporarily overloaded. You can wait a few minutes and try again or select a smaller model.`;
    }
    
    return `I'm sorry, but I couldn't improve the text. Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}