import { 
  users, type User, type InsertUser,
  chats, type Chat, type InsertChat,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// Function to generate random IDs similar to UUID
function generateRandomId(): string {
  // Example format: "67f26d4f-53f8-8012-810c-6475c02b3249"
  const hexChars = '0123456789abcdef';
  const sections = [8, 4, 4, 4, 12]; // Number of characters for each section
  
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
  getChat(id: string): Promise<Chat | undefined>; // Modified: from number to string
  createChat(chat: InsertChat): Promise<Chat>;
  updateChat(id: string, data: Partial<InsertChat>): Promise<Chat | undefined>; // Modified: from number to string
  deleteChat(id: string): Promise<boolean>; // Modified: from number to string
  
  getMessages(chatId: string): Promise<Message[]>; // Modified: from number to string
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<string, Chat>; // Modified: from number to string
  private messages: Map<number, Message>;
  private currentUserId: number;
  // Removed currentChatId since we now use random IDs
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
    
    // Don't create example chats
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
  
  async getChat(id: string): Promise<Chat | undefined> { // Modified: from number to string
    return this.chats.get(id);
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = generateRandomId(); // Modified: now we use the generateRandomId function
    const chat: Chat = { 
      ...insertChat, 
      id, 
      createdAt: new Date() 
    };
    this.chats.set(id, chat);
    return chat;
  }
  
  async updateChat(id: string, data: Partial<InsertChat>): Promise<Chat | undefined> { // Modified: from number to string
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
  
  async deleteChat(id: string): Promise<boolean> { // Modified: from number to string
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
  
  async getMessages(chatId: string): Promise<Message[]> { // Modified: from number to string
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    // Create a complete object with all necessary fields
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