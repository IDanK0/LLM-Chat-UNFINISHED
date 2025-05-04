interface Chat {
  id: string; // Modified: from number to string
  userId: number;
  title: string;
  createdAt: string;
}

interface ChatWithMessages extends Chat {
  messages: Message[];
}

interface Message {
  id: number;
  chatId: string; // Modified: from number to string
  content: string;
  isUserMessage: boolean;
  createdAt: string;
}