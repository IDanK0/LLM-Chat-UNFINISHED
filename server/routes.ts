import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse } from "./api";
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
  
  // Update a chat
  app.patch("/api/chats/:id", async (req: Request, res: Response) => {
    try {
      const chatId = parseInt(req.params.id);
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
      const chatId = parseInt(req.params.id);
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
      const { modelName, apiSettings } = req.body; // Estrai il nome del modello e le impostazioni API dalla richiesta
      
      // Create user message
      const userMessage = await storage.createMessage(messageData);
      
      // Retrieve chat history
      const chatHistory = await storage.getMessages(messageData.chatId);
      
      // Generate AI response using the complete chat history, selected model, and API settings
      const aiResponseContent = await generateAIResponse(chatHistory, modelName, apiSettings);
      
      // Create AI response message
      const aiResponse = await storage.createMessage({
        chatId: messageData.chatId,
        content: aiResponseContent,
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

  // Endpoint per generare titoli per le chat usando l'AI
  app.post("/api/generate-title", async (req, res) => {
    try {
      const { context, prompt } = req.body;
      
      // Usa l'API di AI per generare un titolo basato sul contesto della conversazione
      const response = await generateAIResponse([
        {
          id: 0,
          chatId: 0,
          content: `${prompt}\n\nContesto della conversazione:\n${context}`,
          isUserMessage: true,
          createdAt: new Date().toISOString()
}
      ]);
      
      // Estrai il titolo generato dall'AI
      let title = response.trim();
      
      // Limita la lunghezza del titolo se necessario
      if (title.length > 50) {
        title = title.substring(0, 47) + "...";
      }
      
      res.json({ title });
    } catch (error) {
      console.error("Errore nella generazione del titolo:", error);
      res.status(500).json({ error: "Impossibile generare il titolo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}