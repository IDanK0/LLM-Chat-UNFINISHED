import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse } from "./api";
import { insertChatSchema, insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ServerConfig } from "./config";
import extractKeywordsRouter from "./routes/extract-keywords"; // Import the router for keyword extraction
import { getHealthCheck } from "./utils/connectionMonitor";
import { getApiModelName, getModelProvider } from "../client/src/lib/modelConfig";

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

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      const health = await getHealthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        error: "Health check failed",
        timestamp: Date.now()
      });
    }
  });

  // Register the router for keyword extraction
  app.use("/api/extract-keywords", extractKeywordsRouter);

  // Get all chats for a user
  app.get("/api/chats", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default user for simplicity
      const chats = await storage.getChats(userId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  // Get a specific chat
  app.get("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id; // Modified: removed parseInt
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.json(chat);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  // Create a new chat
  app.post("/api/chats", async (req: Request, res: Response) => {
    try {
      const userId = 1; // Using default user for simplicity
      const chatData = insertChatSchema.parse({ 
        ...req.body, 
        userId 
      });
      
      const chat = await storage.createChat(chatData);
      
      // Add initial AI message
      await storage.createMessage({
        chatId: chat.id,
        content: "Good afternoon, how can I help you today?\n\nYou can ask me anything. I'm here to help you find information, write content, or solve problems.",
        isUserMessage: false
      });
      
      res.status(201).json(chat);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create chat" });
    }
  });
  
  // Update a chat
  app.patch("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id; // Modified: removed parseInt
      const chat = await storage.getChat(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      const updatedChat = await storage.updateChat(chatId, req.body);
      res.json(updatedChat);
    } catch (error) {
      res.status(500).json({ message: "Failed to update chat" });
    }
  });
  
  // Delete a chat
  app.delete("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id; // Modified: removed parseInt
      const deleted = await storage.deleteChat(chatId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Chat not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete chat" });
    }
  });

  // Get messages for a chat
  app.get("/api/chats/:id/messages", async (req: Request, res: Response) => {
    try {
      const chatId = req.params.id; // Modified: removed parseInt
      const messages = await storage.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const { modelName, apiSettings } = req.body; // Extract model name and API settings from the request
      
      // Create user message
      const userMessage = await storage.createMessage(messageData);
      
      // Retrieve chat history
      const chatHistory = await storage.getMessages(messageData.chatId);
      
      // Generate AI response using the complete chat history, selected model, and API settings
      let aiResponse = await generateAIResponse(chatHistory, modelName, apiSettings);
      
      // Ensure the response is clean
      aiResponse = aiResponse.replace(/\s*undefined\s*$/g, '').trim();
      
      // Create AI response message
      const aiResponseMessage = await storage.createMessage({
        chatId: messageData.chatId,
        content: aiResponse,
        isUserMessage: false
      });
      
      res.status(201).json({ userMessage, aiResponseMessage });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // NEW ENDPOINT: Improve user text
  app.post("/api/improve-text", async (req: Request, res: Response) => {
    try {
      const { text, modelName, apiSettings } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Text to improve is required" });
      }
      
      console.log("Request received to improve text:", text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      
      // Get the technical model name from the map using the UI name or use the default
      const apiModelName = getApiModelName(modelName);
      const provider = getModelProvider(modelName);
      
      // Determine the appropriate API URL based on provider
      let apiUrl: string;
      switch (provider) {
        case 'openrouter':
          apiUrl = (apiSettings?.openRouterBaseUrl || 'https://openrouter.ai/api/v1').replace(/\/$/, '') + '/chat/completions';
          break;
        case 'deepseek':
          apiUrl = (apiSettings?.deepseekBaseUrl || 'https://api.deepseek.com/v1').replace(/\/$/, '') + '/chat/completions';
          break;
        case 'local':
        default:
          apiUrl = apiSettings?.apiUrl || ServerConfig.DEFAULT_API_URL;
          break;
      }
      
      console.log(`Improving text with model: ${apiModelName} via ${provider} at URL: ${apiUrl}`);
      
      // Determine the appropriate max_tokens value based on provider
      let maxTokens: number;
      if (provider === 'deepseek' || provider === 'openrouter') {
        // For cloud APIs, use a reasonable default (they don't accept -1)
        maxTokens = apiSettings?.maxTokens && apiSettings.maxTokens > 0 ? apiSettings.maxTokens : 2048;
      } else {
        // For local APIs, use -1 to indicate no limit, or the user's setting
        maxTokens = apiSettings?.maxTokens ?? -1;
      }
      
      console.log(`Improving text with model: ${apiModelName} at URL: ${apiUrl}`);
      
      // Create messages for prompt improvement based on the model
      let messages: any[];
      
      if (apiModelName === "gemma-3-12b-it") {
        // For Gemma, use only user messages without system
        messages = [
          {
            role: 'user',
            content: `You are a prompt engineering expert. Your task is to improve the text I'll send you to make it clearer, more specific, and structured. Respond only with the improved version of the prompt, without explanations or additional text. Here's the text to improve: "${text}"`
          }
        ];
      } else {
        // For other models, use the standard format with system message
        messages = [
          {
            role: 'system',
            content: 'You are a prompt engineering expert. Your task is to improve the user\'s text to make it clearer, more specific, and structured to get better responses from an AI model. Respond only with the improved version of the prompt, without explanations or additional text.'
          },
          {
            role: 'user',
            content: text
          }
        ];
      }
      
      console.log(`Sending request to ${apiUrl} with messages:`, JSON.stringify(messages, null, 2));
      
      // Set up headers based on provider
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      switch (provider) {
        case 'openrouter':
          if (apiSettings?.openRouterApiKey) {
            headers['Authorization'] = `Bearer ${apiSettings.openRouterApiKey}`;
            headers['HTTP-Referer'] = 'https://localhost:3000';
            headers['X-Title'] = 'LLMChat';
          }
          break;
        case 'deepseek':
          if (apiSettings?.deepseekApiKey) {
            headers['Authorization'] = `Bearer ${apiSettings.deepseekApiKey}`;
          }
          break;
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: apiModelName,
          messages: messages,
          temperature: apiSettings?.temperature || 0.7,
          max_tokens: maxTokens,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error response: ${response.status} ${errorText}`);
        throw new Error(`API response error: ${response.status} ${errorText}`);
      }

      console.log("API response received successfully");
      const data = await response.json();
      console.log("API response data structure:", JSON.stringify(data).substring(0, 100) + "...");
      
      // CORRECTION: Extract text from the correct OpenAI format structure
      // The response has the format: { choices: [{ message: { content: "..." } }] }
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error("Invalid API response format - choices not found:", data);
        throw new Error("Invalid API response format: choices not found");
      }
      
      const choice = data.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        console.error("Invalid API response format - message or content not found:", choice);
        throw new Error("Invalid API response format: message.content not found");
      }
      
      // Filter any thinking tags from the response
      const improvedText = removeThinkingTags(choice.message.content);
      console.log("Improved text extracted:", improvedText.substring(0, 50) + (improvedText.length > 50 ? '...' : ''));
      
      // Send the response to the client in the expected format
      const responseObj = { improvedText };
      console.log("Sending response to client:", { improvedTextLength: improvedText.length });
      
      res.json(responseObj);
    } catch (error) {
      console.error('Error improving text:', error);
      res.status(500).json({ 
        message: "Unable to improve text", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}