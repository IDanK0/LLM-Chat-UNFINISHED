interface Chat {
  id: string; // Modificato: da number a string
  userId: number;
  title: string;
  createdAt: string;
}

interface ChatWithMessages extends Chat {
  messages: Message[];
}

interface Message {
  id: number;
  chatId: string; // Modificato: da number a string
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}