import { 
  users, type User, type InsertUser,
  chats, type Chat, type InsertChat,
  messages, type Message, type InsertMessage
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getChats(userId: number): Promise<Chat[]>;
  getChat(id: number): Promise<Chat | undefined>;
  createChat(chat: InsertChat): Promise<Chat>;
  
  getMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chats: Map<number, Chat>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentChatId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.chats = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentChatId = 1;
    this.currentMessageId = 1;
    
    // Create a default user
    const defaultUser: User = {
      id: this.currentUserId++,
      username: "user",
      password: "password"
    };
    this.users.set(defaultUser.id, defaultUser);
    
    // Create sample chats
    const sampleChats = [
      { title: "Saluti Italiane", userId: defaultUser.id },
      { title: "Doppiaggio e Adattamento Scopi", userId: defaultUser.id },
      { title: "Scheda Video per LLM Locale", userId: defaultUser.id },
      { title: "GPU per AI Locale e LLM", userId: defaultUser.id },
      { title: "Modelli Owen e Specifiche Tecniche", userId: defaultUser.id }
    ];
    
    sampleChats.forEach((chatData) => {
      const chat: Chat = {
        id: this.currentChatId++,
        userId: chatData.userId,
        title: chatData.title,
        createdAt: new Date()
      };
      this.chats.set(chat.id, chat);
      
      // Add a welcome message to each chat
      const welcomeMessage: Message = {
        id: this.currentMessageId++,
        chatId: chat.id,
        content: "Buon giorno! Come posso aiutarti oggi?",
        isUserMessage: false,
        createdAt: new Date()
      };
      this.messages.set(welcomeMessage.id, welcomeMessage);
    });
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
  
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }
  
  async createChat(insertChat: InsertChat): Promise<Chat> {
    const id = this.currentChatId++;
    const chat: Chat = { 
      ...insertChat, 
      id, 
      createdAt: new Date() 
    };
    this.chats.set(id, chat);
    return chat;
  }
  
  async getMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
