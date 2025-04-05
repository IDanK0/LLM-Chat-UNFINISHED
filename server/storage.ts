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
