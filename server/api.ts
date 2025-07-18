import { ServerConfig } from './config';
// Define the Message interface directly here instead of importing it
interface Message {
  id: string;
  chatId: string;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}
import { getApiModelName, getModelProvider } from '../client/src/lib/modelConfig';

// API request settings interface
interface ApiRequestSettings {
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean; // Kept for compatibility but won't be used
  webSearchEnabled?: boolean; // New field to enable web search
  webSearchResults?: string; // Pre-formatted web search results
  
  // OpenRouter settings
  openRouterApiKey?: string;
  openRouterBaseUrl?: string;
  
  // Deepseek settings
  deepseekApiKey?: string;
  deepseekBaseUrl?: string;
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
    // Remove expired item
    if (item) {
      this.cache.delete(key);
    }
    return undefined;
  }

  set(key: string, value: string): void {
    // If cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  // Add method to clean expired entries
  cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.cache.forEach((item, key) => {
      if (now - item.timestamp >= 3600000) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
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

FORMATTING GUIDELINES (use markdown syntax):
- Use headings (# for H1, ## for H2, ### for H3) to structure sections
- Use **bold** to highlight key points
- Use *italics* for emphasis
- Use numbered lists (1., 2.) and bullet lists (-, *) for related items
- Use [link text](url) for hyperlinks
- Use \\\`inline code\\\` for short code snippets
- Use triple backticks for code blocks:
  \\\`\\\`\\\`
  code here
  \\\`\\\`\\\`
- Use tables with pipes and hyphens:
  | Col1 | Col2 |
  |------|------|
  | A    | B    |
- Keep paragraphs short and well-spaced for readability

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
    
    // Get the technical model name and provider from the helper function
    const apiModelName = getApiModelName(modelName);
    const provider = getModelProvider(modelName);
    
    // If web search is disabled, call the model directly with standard chat format
    if (!settings?.webSearchEnabled) {
      console.log(`🚀 Generating response without web search using model: ${apiModelName} via ${provider}`);
      
      // Determine the appropriate API URL and headers based on provider
      let apiUrl: string;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      switch (provider) {
        case 'openrouter':
          apiUrl = (settings?.openRouterBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
          if (settings?.openRouterApiKey) {
            headers['Authorization'] = `Bearer ${settings.openRouterApiKey}`;
            headers['HTTP-Referer'] = 'https://localhost:3000';
            headers['X-Title'] = 'LLMChat';
          }
          break;
        case 'deepseek':
          apiUrl = (settings?.deepseekBaseUrl || 'https://api.deepseek.com/v1').replace(/\/$/, '') + '/chat/completions';
          if (settings?.deepseekApiKey) {
            headers['Authorization'] = `Bearer ${settings.deepseekApiKey}`;
          }
          break;
        case 'local':
        default:
          apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
          break;
      }
      
      console.log(`🌐 API URL: ${apiUrl}`);
      
      // Determine the appropriate max_tokens value based on provider
      let maxTokens: number;
      if (provider === 'deepseek' || provider === 'openrouter') {
        // For cloud APIs, use a reasonable default (they don't accept -1)
        maxTokens = settings?.maxTokens && settings.maxTokens > 0 ? settings.maxTokens : 2048;
      } else {
        // For local APIs, use -1 to indicate no limit, or the user's setting
        maxTokens = settings?.maxTokens ?? -1;
      }
      
      let requestBody;
      
      // MODIFICATO: Gestione speciale per i modelli Gemma
      if (apiModelName.includes("gemma")) {
        // Per i modelli Gemma, usa un formato semplice con un solo messaggio utente
        // che include il contesto della conversazione
        
        // Formatta la conversazione come testo
        let conversationText = "Previous conversation:\n\n";
        
        // Prendi gli ultimi 6 messaggi per mantenere la richiesta leggera
        const recentMessages = messages.slice(-6);
        
        for (const message of recentMessages) {
          const role = message.isUserMessage ? "User" : "Assistant";
          conversationText += `${role}: ${message.content.trim()}\n\n`;
        }
        
        // Aggiungi la richiesta esplicita per la risposta
        conversationText += "\nBased on the conversation above, please respond as the assistant.";
        
        requestBody = {
          model: apiModelName,
          messages: [
            {
              role: 'user',
              content: conversationText
            }
          ],
          temperature: settings?.temperature ?? 0.7,
          max_tokens: maxTokens,
          stream: false
        };
      } else {
        // Per gli altri modelli, usa il formato standard
        const llamaMessages = convertMessagesToLlamaFormat(messages, modelName);
        requestBody = {
          model: apiModelName,
          messages: llamaMessages,
          temperature: settings?.temperature ?? 0.7,
          max_tokens: maxTokens,
          stream: false
        };
      }
      
      console.log(`Request body (simplified):`, JSON.stringify(requestBody).substring(0, 500) + "...");
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${text}`);
      }
      
      const data = await response.json();
      let content;
      
      // Estrai il contenuto dalla risposta in base al formato del modello
      if (apiModelName.includes("gemma")) {
        // Per i modelli Gemma, cerca il contenuto nel formato corretto
        content = data.choices?.[0]?.message?.content;
        
        // Log per debug
        console.log("Gemma response structure:", JSON.stringify(data).substring(0, 500) + "...");
      } else {
        content = data.choices?.[0]?.message?.content;
      }
      
      if (!content) throw new Error('No content in API response');
      
      // Clean and return
      content = content.replace(/^(Assistente|Assistant):\s*/i, '').trim();
      return removeThinkingTags(content);
    }
    
    // Se web search è abilitato, usa il formato di richiesta alternativo
    console.log(`Generating response using model: ${apiModelName} via ${provider}`);
    
    // Determine the appropriate API URL and headers based on provider
    let apiUrl: string;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    switch (provider) {
      case 'openrouter':
        apiUrl = (settings?.openRouterBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
        if (settings?.openRouterApiKey) {
          headers['Authorization'] = `Bearer ${settings.openRouterApiKey}`;
          headers['HTTP-Referer'] = 'https://localhost:3000';
          headers['X-Title'] = 'LLMChat';
        }
        break;
      case 'deepseek':
        apiUrl = (settings?.deepseekBaseUrl || 'https://api.deepseek.com/v1').replace(/\/$/, '') + '/chat/completions';
        if (settings?.deepseekApiKey) {
          headers['Authorization'] = `Bearer ${settings.deepseekApiKey}`;
        }
        break;
      case 'local':
      default:
        apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
        break;
    }
    
    // If web search is disabled, strip any 'Citations:' sections from previous AI messages
    let contextMessages: Message[] = messages;
    if (!settings?.webSearchEnabled) {
      contextMessages = messages.map(msg => {
        if (!msg.isUserMessage) {
          const idx = msg.content.indexOf('Citations:');
          if (idx !== -1) {
            return { ...msg, content: msg.content.slice(0, idx).trim() };
          }
        }
        return msg;
      });
    }
    // Prepare the conversation context as text
    let conversationText = "### Conversation:\n\n";
    
    // Extract the most recent messages to keep the request lighter
    const recentMessages = contextMessages.slice(-6);
    
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
    conversationText += "### Instructions:\nRespond as the assistant in the conversation above, using markdown syntax for headings, lists, bold, italics, links, code blocks, and tables. Keep paragraphs concise and well-spaced. ";
    
    // Add specific instructions if web search is enabled
    if (settings?.webSearchEnabled && settings?.webSearchResults) {
      conversationText +=
        "Use information from the web search results when relevant, and format the entire response in **Markdown** using headings (#, ##, ###), **bold**, *italics*, numbered and bullet lists, [links](url), `inline code`, triple-backtick code blocks, tables, and horizontal rules (---). ";
      conversationText +=
        "Cite each source with [1], [2], [3], [4], etc.; ensure at least 4 citations in total (duplicate if necessary) and include a 'Citations:' section at the end with clickable links. ";
      conversationText +=
        "IMPORTANT: Respond exclusively with the markdown-formatted answer in the same language as the user, without any additional commentary.";
      // New instruction: ensure using at least 4 distinct web search sources
      conversationText +=
        " Be sure to include at least four distinct sources from the 'Potentially Relevant Web Search Results', citing them with [1] through [4] in your response.";
    }
    
    // Cache implementation for repeated requests
    const cacheKey = JSON.stringify({ 
      conversation: conversationText, 
      model: apiModelName,
      webSearch: settings?.webSearchEnabled || false
    });
    // Use cache only when web search is disabled
    if (!settings?.webSearchEnabled) {
      const cachedResponse = responseCache.get(cacheKey);
      if (cachedResponse) {
        console.log("Using cached response");
        return cachedResponse;
      }
    }
    
    // Build system prompt based on web search setting
    const baseSystemPrompt = `You are a helpful, precise, and friendly AI assistant. Your task is to provide the next assistant response in the conversation using Markdown formatting.

FORMATTING GUIDELINES:
- Use #, ##, ### for headings
- Use **bold** for emphasis
- Use *italics* for emphasis
- Use numbered lists (1., 2.) and bullet lists (-, *)
- Use [link text](url) for hyperlinks
- Use \`inline code\` for short code snippets
- Use triple backticks to denote code blocks
- Use tables with pipes (|) and hyphens (-)
- Use --- for horizontal rules
- Keep paragraphs concise and separated by blank lines

Respond exclusively with the markdown-formatted answer in the same language as the user.`;
    const systemPrompt = settings?.webSearchEnabled && settings?.webSearchResults
      ? baseSystemPrompt + `

When web search is enabled, use the provided 'Potentially Relevant Web Search Results' to enrich your response. Prefix your answer with "**Answer:**". For each fact you include, add an inline citation in the format [n](URL) immediately after it. After completing the answer, include a "**Citations:**" section listing **all** the sources you received (even if some were not cited), each as "[n]: [Title](URL)". Use **at least 4** citations and there is no maximum limit.`
      : baseSystemPrompt;

    // Determine the appropriate max_tokens value based on provider
    let maxTokens: number;
    if (provider === 'deepseek' || provider === 'openrouter') {
      // For cloud APIs, use a reasonable default (they don't accept -1)
      maxTokens = settings?.maxTokens && settings.maxTokens > 0 ? settings.maxTokens : 2048;
    } else {
      // For local APIs, use -1 to indicate no limit, or the user's setting
      maxTokens = settings?.maxTokens ?? -1;
    }

    let requestBody;
    
    // MODIFICATO: Gestione speciale per i modelli Gemma
    if (apiModelName.includes("gemma")) {
      // Per i modelli Gemma, usa un formato semplice con un solo messaggio utente
      requestBody = {
        model: apiModelName,
        messages: [
          {
            role: 'user',
            content: conversationText
          }
        ],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: maxTokens,
        stream: false
      };
    } else {
      // Per gli altri modelli, usa il formato standard
      const adaptedMessages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationText }
      ];
      
      requestBody = {
        model: apiModelName,
        messages: adaptedMessages,
        temperature: settings?.temperature ?? 0.7,
        max_tokens: maxTokens,
        stream: false
      };
    }
    
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
        headers,
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
      let content;
      
      // MODIFICATO: Gestione dell'estrazione del contenuto per i modelli Gemma
      if (apiModelName.includes("gemma")) {
        content = data.choices?.[0]?.message?.content;
        console.log("Gemma response structure:", JSON.stringify(data).substring(0, 500) + "...");
      } else {
        content = data.choices?.[0]?.message?.content;
      }
      
      // If there's no content, return an error message
      if (!content) {
        throw new Error("No content in API response");
      }
      
      // Filter thinking tags
      const filteredResponse = removeThinkingTags(content);
      let finalResponse = filteredResponse;
      if (settings?.webSearchEnabled) {
        // Post-processing: ensure at least 4 citations in the final response
        const headerKeyword = "Citations:";
        const headerPos = finalResponse.indexOf(headerKeyword);
        if (headerPos !== -1) {
          const beforeHeader = finalResponse.slice(0, headerPos + headerKeyword.length);
          const rest = finalResponse.slice(headerPos + headerKeyword.length);
          const restLines = rest.split(/\r?\n/);
          const citationLines = restLines
            .filter(line => /^\s*\[\d+\]:/.test(line))
            .map(line => line.trim());
          if (citationLines.length > 0 && citationLines.length < 4) {
            const newCitationLines = [...citationLines];
            const lastLine = citationLines[citationLines.length - 1];
            while (newCitationLines.length < 4) {
              const nextIdx = newCitationLines.length + 1;
              const duplicated = lastLine.replace(/^\[\d+\]:/, `[${nextIdx}]:`);
              newCitationLines.push(duplicated);
            }
            finalResponse = beforeHeader + "\n\n" + newCitationLines.join("\n");
          }
        }
      } else {
        // Remove any citations section if web search disabled
        finalResponse = finalResponse
          .replace(/### Citations:[\s\S]*$/i, '')
          .replace(/Citations:[\s\S]*$/i, '')
          .trim();
      }
      // Save the response in the cache
      responseCache.set(cacheKey, finalResponse);
      return finalResponse;
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
    
    // Check for common connection errors
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed') || errorMessage.includes('connect')) {
      return `❌ **Connection Error**\n\nCannot connect to the AI model server. Please check that:\n\n1. **LM Studio is running** and serving on port 1234\n2. **The model is loaded** in LM Studio\n3. **Local server is enabled** in LM Studio settings\n\nTry starting LM Studio, loading a model, and enabling the local server, then try again.`;
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return `❌ **Authentication Error**\n\nAPI authentication failed. Please check your API keys in the settings and try again.`;
    }
    
    if (errorMessage.includes('404')) {
      return `❌ **Model Not Found**\n\nThe selected model "${modelName}" is not available. Please try selecting a different model or check that the model is loaded in LM Studio.`;
    }
    
    if (errorMessage.includes('429')) {
      return `❌ **Rate Limit Exceeded**\n\nToo many requests. Please wait a moment and try again.`;
    }
    
    return `❌ **Error**: ${errorMessage}\n\nPlease check the console for more details or try with a different model.`;
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
    // Get the technical model name and provider from the helper function
    const apiModelName = getApiModelName(modelName);
    const provider = getModelProvider(modelName);
    
    // Determine the appropriate API URL and headers based on provider
    let apiUrl: string;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    switch (provider) {
      case 'openrouter':
        apiUrl = (settings?.openRouterBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
        if (settings?.openRouterApiKey) {
          headers['Authorization'] = `Bearer ${settings.openRouterApiKey}`;
          headers['HTTP-Referer'] = 'https://localhost:3000';
          headers['X-Title'] = 'LLMChat';
        }
        break;
      case 'deepseek':
        apiUrl = (settings?.deepseekBaseUrl || 'https://api.deepseek.com/v1').replace(/\/$/, '') + '/chat/completions';
        if (settings?.deepseekApiKey) {
          headers['Authorization'] = `Bearer ${settings.deepseekApiKey}`;
        }
        break;
      case 'local':
      default:
        apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
        break;
    }
    
    console.log(`Improving text with model: ${apiModelName} via ${provider} at URL: ${apiUrl}`);
    
    // Determine the appropriate max_tokens value based on provider
    let maxTokens: number;
    if (provider === 'deepseek' || provider === 'openrouter') {
      // For cloud APIs, use a reasonable default (they don't accept -1)
      maxTokens = settings?.maxTokens && settings.maxTokens > 0 ? settings.maxTokens : 1000;
    } else {
      // For local APIs, use -1 to indicate no limit, or the user's setting
      maxTokens = settings?.maxTokens ?? -1;
    }
    
    // Cache implementation for repeated requests
    const cacheKey = JSON.stringify({ text, model: apiModelName, action: 'improve' });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Using cached response for text improvement");
      return cachedResponse;
    }
    
    let requestBody;
    
    // MODIFICATO: Gestione speciale per i modelli Gemma
    if (apiModelName.includes("gemma")) {
      // Per i modelli Gemma, usa un formato semplice con un solo messaggio utente
      requestBody = {
        model: apiModelName,
        messages: [
          {
            role: 'user',
            content: `You are a prompt engineering expert. Your task is to improve the text I'll send you to make it clearer, more specific, and structured. Respond only with the improved version of the prompt, without explanations or additional text. Here's the text to improve: "${text}"`
          }
        ],
        temperature: settings?.temperature ?? 0.7,
        max_tokens: maxTokens,
        stream: false
      };
    } else {
      // Per gli altri modelli, usa il formato standard con messaggio di sistema
      const messages = [
        {
          role: 'system',
          content: 'You are a prompt engineering expert. Your task is to improve the user\'s text to make it clearer, more specific, and structured to get better responses from an AI model. Respond only with the improved version of the prompt, without explanations or additional text.'
        },
        {
          role: 'user',
          content: text
        }
      ];
      
      requestBody = {
        model: apiModelName,
        messages: messages,
        temperature: settings?.temperature ?? 0.7,
        max_tokens: maxTokens,
        stream: false
      };
    }
    
    // Configure the timeout for the request - Use a longer timeout for models that might be slower
    const isLargeModel = apiModelName.includes("12b") || apiModelName.includes("32b");
    const timeoutDuration = isLargeModel ? ServerConfig.API_TIMEOUT * 2 : ServerConfig.API_TIMEOUT;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      // Execute the request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
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
      let content;
      
      // MODIFICATO: Gestione dell'estrazione del contenuto per i modelli Gemma
      if (apiModelName.includes("gemma")) {
        content = data.choices?.[0]?.message?.content;
        console.log("Gemma response structure:", JSON.stringify(data).substring(0, 500) + "...");
      } else {
        content = data.choices?.[0]?.message?.content;
      }
      
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