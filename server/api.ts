import fetch from 'node-fetch';
import { Message } from '@shared/schema';

// Interfaccia per i messaggi nel formato richiesto dall'API
interface LlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Mappa per convertire i nomi dei modelli visualizzati nell'UI ai nomi tecnici per l'API
const MODEL_NAME_MAP: Record<string, string> = {
  "Llama 3.1 8b Instruct": "meta-llama-3.1-8b-instruct",
  "Gemma 3 12b it Instruct": "gemma-3-12b-it"
};
  
// Converte i messaggi dal formato DB al formato API
function convertMessagesToLlamaFormat(messages: Message[]): LlamaMessage[] {
  // Aggiungi un messaggio di sistema all'inizio
  const systemMessage: LlamaMessage = {
    role: 'system',
    content: 'Sei un assistente AI italiano utile, preciso e amichevole. Oggi è ' + 
             new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
             '. Rispondi in modo accurato e naturale.'
  };
  // Converti i messaggi dal database al formato richiesto dall'API
  const conversationMessages = messages.map(msg => ({
    role: msg.isUserMessage ? 'user' : 'assistant' as 'system' | 'user' | 'assistant',
    content: msg.content
  }));
  
  // Aggiungi il messaggio di sistema all'inizio dell'array
  return [systemMessage, ...conversationMessages];
}

export async function generateAIResponse(messages: Message[], modelName = "Llama 3.1 8b Instruct"): Promise<string> {
  try {
    // Converti i messaggi nel formato richiesto dall'API
    const formattedMessages = convertMessagesToLlamaFormat(messages);
    
    // Ottieni il nome del modello tecnico dalla mappa usando il nome UI o usa il default
    const apiModelName = MODEL_NAME_MAP[modelName] || "meta-llama-3.1-8b-instruct";
    console.log(`Sending request to API with model: ${apiModelName}`);
    console.log('Messages:', JSON.stringify(formattedMessages, null, 2));
    const response = await fetch('https://8dfb-2001-b07-5d38-71ae-b374-ce7b-cce3-f552.ngrok-free.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: apiModelName,  // Usa il nome del modello selezionato
        messages: formattedMessages,
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
