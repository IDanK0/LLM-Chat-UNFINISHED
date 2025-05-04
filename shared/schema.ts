import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chats = pgTable("chats", {
  id: text("id").primaryKey(), // Modified: from serial to text
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: text("chat_id").notNull(), // Modified: from integer to text
  content: text("content").notNull(),
  isUserMessage: boolean("is_user_message").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  userId: true,
  title: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  content: true,
  isUserMessage: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;