// Define the Message type directly in this file since there seems to be an issue with imports
interface Message {
  id: number;
  chatId: string;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

import { apiRequest } from "./queryClient";
import { getSettings } from "./settingsStore";

/**
 * Checks if the title is the default one ("New Chat")
 */
export function isDefaultTitle(title: string): boolean {
  return title === "New Chat";
}

/**
 * Generates a title for the chat based on the first user message
 * and updates the chat with the new title
 */
export async function regenerateChatTitle(chatId: string, options?: {
  modelName?: string;
  temperature?: number;
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
}): Promise<boolean> {
  try {
    console.log(`[TitleGenerator] Starting title generation for chat ${chatId}`);
    
    // Get user settings
    const settings = getSettings();
    
    // Check if automatic title generation is enabled
    if (!settings.autoGenerateTitle) {
      console.log("[TitleGenerator] Automatic title generation disabled");
      return false;
    }
    
    // Get the chat
    console.log(`[TitleGenerator] Retrieving chat information ${chatId}`);
    const chatResponse = await apiRequest("GET", `/api/chats/${chatId}`);
    const chat = await chatResponse.json();
    
    // Check if the title has already been customized
    if (!isDefaultTitle(chat.title)) {
      console.log("[TitleGenerator] Title is already customized:", chat.title);
      return false;
    }
    
    // Get chat messages
    console.log(`[TitleGenerator] Retrieving messages for chat ${chatId}`);
    const messagesResponse = await apiRequest("GET", `/api/chats/${chatId}/messages`);
    const messages: Message[] = await messagesResponse.json();
    
    // Find the first user message
    const firstUserMessage = messages.find(msg => msg.isUserMessage);
    
    if (!firstUserMessage) {
      console.log("[TitleGenerator] No user message found");
      return false;
    }
    
    console.log("[TitleGenerator] First user message:", firstUserMessage.content);
    
    // Simple approach: extract the first significant words from the user message
    let title = "";
    
    try {
      // First try with the improve-text endpoint if available
      console.log("[TitleGenerator] Attempting with improve-text endpoint");
      const response = await apiRequest("POST", "/api/improve-text", {
        text: `Create a very short title (maximum 3 words) for this message without using quotes or text formatting: "${firstUserMessage.content.substring(0, 100)}"`,
        modelName: options?.modelName || "meta-llama-3.1-8b-instruct", // Use the model passed in options
        temperature: options?.temperature || 0.7
      });
      
      const data = await response.json();
      if (data && data.improvedText && typeof data.improvedText === 'string') {
        // Filter any <think> and </think> tags and content between them
        let improvedText = data.improvedText.trim();
        
        // Filter thinking tags and their content for models like deepseek r1
        const thinkRegex = /<think>[\s\S]*?<\/think>/g;
        improvedText = improvedText.replace(thinkRegex, '').trim();
        
        title = improvedText;
      } else {
        throw new Error("Invalid response format");
      }
    } catch (apiError) {
      console.warn("[TitleGenerator] Error with improve-text, using fallback:", apiError);
      
      // Fallback: use the first words of the message
      const cleanedMessage = firstUserMessage.content
        .replace(/[^\w\s]/gi, '') // Remove punctuation
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim();
      
      const words = cleanedMessage.split(' ');
      const significantWords = words.filter((word: string) => word.length > 2); // Ignore words that are too short
      
      if (significantWords.length > 0) {
        // Take up to 3 significant words
        title = significantWords.slice(0, 3).join(' ');
      } else {
        // If there are no significant words, use the first words
        title = words.slice(0, 3).join(' ');
      }
    }
    
    // Capitalize the first letter of the title
    if (title && title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    // Limit the title length
    if (title.length > 30) {
      title = title.substring(0, 27) + "...";
    }
    
    // Make sure the title is not empty
    if (!title || title.trim().length === 0) {
      title = "New conversation";
    }
    
    console.log(`[TitleGenerator] Generated title: "${title}"`);
    
    // Update the chat title
    console.log(`[TitleGenerator] Updating title for chat ${chatId}`);
    await apiRequest("PATCH", `/api/chats/${chatId}`, { title });
    
    console.log(`[TitleGenerator] Title successfully updated`);
    return true;
    
  } catch (error) {
    console.error("[TitleGenerator] Error during title generation:", error);
    return false;
  }
}