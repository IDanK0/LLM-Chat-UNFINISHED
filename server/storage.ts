import { 
  users, type User, type InsertUser,
  chats, type Chat, type InsertChat,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// Funzione per generare ID randomici simili a UUID
function generateRandomId(): string {
  // Formato esempio: "67f26d4f-53f8-8012-810c-6475c02b3249"
  const hexChars = '0123456789abcdef';
  const sections = [8, 4, 4, 4, 12]; // Numero di caratteri per ogni sezione
  
  let result = '';
  for (let i = 0; i < sections.length; i++) {
    for (let j = 0; j < sections[i]; j++) {
      result += hexChars[Math.floor(Math.random() * hexChars.length)];
    }
    if (i < sections.length - 1) {
      result += '-';
    }
  }
  
  return result;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getChats(userId: number): Promise<Chat[]>;
  getChat(id: string): Promise<Chat | undefined>; // Modificato: da number a string
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: string, data: Partial<InsertChat>): Promise<Chat | undefined>; // Modificato: da number a string
  deleteChat(id: string): Promise<boolean>; // Modificato: da number a string
  
  getMessages(chatId: string): Promise<Message[]>; // Modificato: da number a string
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<string, Chat>; // Modificato: da number a string
  private messages: Map<number, Message>;
  private currentUserId: number;
  // Rimosso currentChatId poiché ora utilizziamo ID randomici
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    
    // Create a default user
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "user",
      password: "password"
    };
    this.users.set(defaultUser.id, defaultUser);
    
    // Non creare chat di esempio
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chats.values())
      .filter(chat => chat.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getChat(id: string): Promise<Chat | undefined> { // Modificato: da number a string
    return this.chats.get(id);
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = generateRandomId(); // Modificato: ora utilizziamo la funzione generateRandomId
    const chat: Chat = { 
      ...insertChat, 
      id, 
      createdAt: new Date() 
    };
    this.chats.set(id, chat);
    return chat;
  }
  
  async updateChat(id: string, data: Partial<InsertChat>): Promise<Chat | undefined> { // Modificato: da number a string
    const chat = this.chats.get(id);
    if (!chat) {
      return undefined;
    }
    
    const updatedChat: Chat = { 
      ...chat, 
      ...data 
    };
    this.chats.set(id, updatedChat);
    return updatedChat;
  }
  
  async deleteChat(id: string): Promise<boolean> { // Modificato: da number a string
    // Delete the chat
    const deleted = this.chats.delete(id);
    
    // Delete related messages
    if (deleted) {
      // Convert to array, then filter and delete
      const messagesToDelete = Array.from(this.messages.entries())
        .filter(([_, message]) => message.chatId === id)
        .map(([id, _]) => id);
      
      messagesToDelete.forEach(messageId => {
        this.messages.delete(messageId);
      });
    }
    
    return deleted;
  }
  
  async getMessages(chatId: string): Promise<Message[]> { // Modificato: da number a string
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    // Creiamo un oggetto completo con tutti i campi necessari
    const message: Message = { 
      id,
      chatId: insertMessage.chatId,
      content: insertMessage.content,
      isUserMessage: insertMessage.isUserMessage === undefined ? true : insertMessage.isUserMessage,
      createdAt: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();