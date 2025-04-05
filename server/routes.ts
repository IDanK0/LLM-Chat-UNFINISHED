import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatSchema, insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
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
      const chatId = parseInt(req.params.id);
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
        content: "Buon pomeriggio, come posso essere utile?",
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

  // Get messages for a chat
  app.get("/api/chats/:id/messages", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
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
      
      // Create user message
      const userMessage = await storage.createMessage(messageData);
      
      // Create AI response message
      const aiResponse = await storage.createMessage({
        chatId: messageData.chatId,
        content: "Grazie per il tuo messaggio. Come posso aiutarti ulteriormente?",
        isUserMessage: false
      });
      
      res.status(201).json({ userMessage, aiResponse });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
