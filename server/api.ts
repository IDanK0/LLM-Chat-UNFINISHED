
import fetch from 'node-fetch';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateAIResponse(userMessage: string, chatId: number): Promise<string> {
  try {
    // Get chat history from storage
    const messages = await storage.getMessages(chatId);
    
    // Convert messages to the format expected by the API
    const messageHistory = messages.map(msg => ({
      role: msg.isUserMessage ? 'user' : 'assistant',
      content: msg.content
    }));

    const response = await fetch('https://30a0-93-56-113-174.ngrok-free.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: 'you are an AI assistant.' },
          ...messageHistory,
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Mi dispiace, ma al momento non riesco a generare una risposta. Riprova più tardi.';
  }
}
