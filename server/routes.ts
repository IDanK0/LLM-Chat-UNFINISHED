import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateAIResponse } from "./api";
import { insertChatSchema, insertMessageSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { ServerConfig } from "./config";

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
      const chatId = req.params.id; // Modificato: rimosso parseInt
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
        content: "Buon pomeriggio, come posso essere utile oggi?\n\nPuoi chiedermi qualsiasi cosa in italiano. Sono qui per aiutarti a trovare informazioni, scrivere contenuti o risolvere problemi.",
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
      const chatId = req.params.id; // Modificato: rimosso parseInt
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
      const chatId = req.params.id; // Modificato: rimosso parseInt
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
      const chatId = req.params.id; // Modificato: rimosso parseInt
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

  // NUOVO ENDPOINT: Migliora il testo dell'utente
  app.post("/api/improve-text", async (req: Request, res: Response) => {
    try {
      const { text, modelName, apiSettings } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: "Il testo da migliorare è richiesto" });
      }
      
      console.log("Richiesta ricevuta per migliorare testo:", text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      
      // Ottieni il nome del modello tecnico dalla mappa usando il nome UI o usa il default
      let apiModelName: string;
      if (modelName === "Gemma 3 12b it Instruct") {
        apiModelName = "gemma-3-12b-it";
      } else {
        apiModelName = ServerConfig.MODEL_NAME_MAP[modelName] || "meta-llama-3.1-8b-instruct";
      }
      
      // Usa l'URL dell'API dalle impostazioni o quello di default dalla configurazione centralizzata
      const apiUrl = apiSettings?.apiUrl || ServerConfig.DEFAULT_API_URL;
      
      console.log(`Improving text with model: ${apiModelName} at URL: ${apiUrl}`);
      
      // Crea messaggi per il miglioramento del prompt in base al modello
      let messages: any[];
      
      if (apiModelName === "gemma-3-12b-it") {
        // Per Gemma, usa solo messaggi utente senza sistema
        messages = [
          {
            role: 'user',
            content: `Sei un esperto di prompt engineering. Il tuo compito è migliorare il testo che ti invierò per renderlo più chiaro, specifico e strutturato. Rispondi solo con la versione migliorata del prompt, senza spiegazioni o altro testo. Ecco il testo da migliorare: "${text}"`
          }
        ];
      } else {
        // Per altri modelli, usa il formato standard con messaggio di sistema
        messages = [
          {
            role: 'system',
            content: 'Sei un esperto di prompt engineering. Il tuo compito è migliorare il testo dell\'utente per renderlo più chiaro, specifico e strutturato per ottenere risposte migliori da un modello di AI. Rispondi solo con la versione migliorata del prompt, senza spiegazioni o altro testo.'
          },
          {
            role: 'user',
            content: text
          }
        ];
      }
      
      console.log(`Sending request to ${apiUrl} with messages:`, JSON.stringify(messages, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: apiModelName,
          messages: messages,
          temperature: apiSettings?.temperature || 0.7,
          max_tokens: apiSettings?.maxTokens || -1,
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
      
      // CORREZIONE: Estrai il testo dalla struttura corretta del formato OpenAI
      // La risposta ha il formato: { choices: [{ message: { content: "..." } }] }
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error("Formato di risposta API non valido - choices non trovato:", data);
        throw new Error("Formato di risposta API non valido: choices non trovato");
      }
      
      const choice = data.choices[0];
      if (!choice || !choice.message || !choice.message.content) {
        console.error("Formato di risposta API non valido - message o content non trovato:", choice);
        throw new Error("Formato di risposta API non valido: message.content non trovato");
      }
      
      const improvedText = choice.message.content;
      console.log("Improved text extracted:", improvedText.substring(0, 50) + (improvedText.length > 50 ? '...' : ''));
      
      // Invia la risposta al client nel formato atteso
      const responseObj = { improvedText };
      console.log("Sending response to client:", { improvedTextLength: improvedText.length });
      
      res.json(responseObj);
    } catch (error) {
      console.error('Error improving text:', error);
      res.status(500).json({ 
        message: "Impossibile migliorare il testo", 
        error: error instanceof Error ? error.message : "Errore sconosciuto" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}