export interface Chat {
  id: number;
  userId: number;
  title: string;
  createdAt: string;
}

export interface Message {
  id: number;
  chatId: number;
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}

export interface ChatWithMessages extends Chat {
  messages: Message[];
}
