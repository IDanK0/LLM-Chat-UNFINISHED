import fetch from 'node-fetch';
import { Message } from '@shared/schema';

// Interfaccia per i messaggi nel formato richiesto dall'API
interface LlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Interfaccia per le impostazioni API
interface ApiRequestSettings {
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean; // Mantenuto per compatibilità ma non verrà utilizzato
}

// Mappa per convertire i nomi dei modelli visualizzati nell'UI ai nomi tecnici per l'API
const MODEL_NAME_MAP: Record<string, string> = {
  "Llama 3.1 8b Instruct": "meta-llama-3.1-8b-instruct",
  "Gemma 3 12b it Instruct": "gemma-3-12b-it"
};
  
// Converti i messaggi dal formato DB al formato API - Ottimizzato
function convertMessagesToLlamaFormat(messages: Message[]): LlamaMessage[] {
  // Data corrente formattata per il messaggio di sistema
  const formattedDate = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  // Costruisci il messaggio di sistema una volta sola
  const systemMessage: LlamaMessage = {
    role: 'system',
    content: `Sei un assistente AI italiano utile, preciso e amichevole. Oggi è ${formattedDate}. Rispondi in modo accurato e naturale.`
  };
  
  // Pre-allocare l'array di output con la dimensione corretta migliora le prestazioni
  const result: LlamaMessage[] = new Array(messages.length + 1);
  result[0] = systemMessage;
  
  // Mappa ottimizzata dei messaggi
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    result[i + 1] = {
      role: msg.isUserMessage ? 'user' : 'assistant',
      content: msg.content
    };
  }

  return result;
}
export async function generateAIResponse(
  messages: Message[], 
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  try {
    // Converti i messaggi nel formato richiesto dall'API
    const formattedMessages = convertMessagesToLlamaFormat(messages);
    
    // Ottieni il nome del modello tecnico dalla mappa usando il nome UI o usa il default
    const apiModelName = MODEL_NAME_MAP[modelName] || "meta-llama-3.1-8b-instruct";
    
    // Usa l'URL dell'API dalle impostazioni o quello di default
    const apiUrl = settings?.apiUrl || 'http://172.24.64.1:8080/v1/chat/completions';
    
    console.log(`Sending request to API with model: ${apiModelName}`);
    
    // Implementazione di cache per richieste ripetute
    const cacheKey = JSON.stringify({ messages: formattedMessages, model: apiModelName });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Cache hit, returning cached response");
      return cachedResponse;
    }
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: apiModelName,  // Usa il nome del modello selezionato
        messages: formattedMessages,
        temperature: settings?.temperature ?? 0.7,
        max_tokens: settings?.maxTokens ?? -1,
        stream: false  // Forzato sempre a false indipendentemente dalle impostazioni utente
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Memorizza nella cache
    responseCache.set(cacheKey, content);
    
    return content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return 'Mi dispiace, ma al momento non riesco a generare una risposta. Riprova più tardi.';
  }
}

// Implementazione di una cache semplice per migliorare le prestazioni
class SimpleCache {
  private cache: Map<string, string>;
  private maxSize: number;
  
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key: string): string | undefined {
    return this.cache.get(key);
  }
  
  set(key: string, value: string): void {
    // Se la cache è piena, rimuovi la voce più vecchia
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

const responseCache = new SimpleCache();