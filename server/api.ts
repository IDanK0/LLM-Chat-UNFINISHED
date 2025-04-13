import fetch from 'node-fetch';
import { Message } from '@shared/schema';
import { ServerConfig } from './config';

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
  
// Converti i messaggi dal formato DB al formato API - Ottimizzato
function convertMessagesToLlamaFormat(messages: Message[], modelName: string): LlamaMessage[] {
  // Data corrente formattata per il messaggio di sistema
  const formattedDate = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const systemContent = `Sei un assistente AI italiano utile, preciso e amichevole. Oggi è ${formattedDate}. Rispondi in modo accurato e naturale.`;
  
  // Identifica se stiamo usando un modello Gemma
  const isGemmaModel = modelName === "Gemma 3 12b it Instruct" || modelName === "gemma-3-12b-it";
  
  let result: LlamaMessage[] = [];
  
  if (isGemmaModel) {
    // Per Gemma, iniziamo direttamente con i messaggi user/assistant
    // Il primo messaggio deve essere dell'utente
    if (messages.length === 0) {
      // Se non ci sono messaggi, creiamo un primo messaggio utente con le istruzioni
      result.push({
        role: 'user',
        content: systemContent
      });
    } else {
      // Verifichiamo se il primo messaggio è dell'utente
      if (messages[0].isUserMessage) {
        // Se il primo messaggio è dell'utente, lo incorporiamo con il contenuto del sistema
        result.push({
          role: 'user',
          content: `${systemContent}\n\n${messages[0].content}`
        });
      } else {
        // Se il primo messaggio è dell'assistente, inseriamo prima un messaggio utente con le istruzioni
        result.push({
          role: 'user',
          content: systemContent
        });
        result.push({
          role: 'assistant',
          content: messages[0].content
        });
      }
      
      // Aggiungi il resto dei messaggi, mantenendo l'alternanza
      let expectedRole = result[result.length - 1].role === 'user' ? 'assistant' : 'user';
      
      for (let i = 1; i < messages.length; i++) {
        const role = messages[i].isUserMessage ? 'user' : 'assistant';
        
        // Verifica che stiamo mantenendo l'alternanza
        if (role === expectedRole) {
          result.push({
            role: role,
            content: messages[i].content
          });
          expectedRole = expectedRole === 'user' ? 'assistant' : 'user';
        } else {
          console.log(`Skipping message with role ${role} as it breaks alternation pattern`);
        }
      }
    }
  } else {
    // Per modelli come Llama, utilizziamo il formato standard con messaggio di sistema
    result.push({
      role: 'system',
      content: systemContent
    });
    
    // Aggiungi tutti i messaggi
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      result.push({
        role: msg.isUserMessage ? 'user' : 'assistant',
        content: msg.content
      });
    }
  }

  return result;
}

export async function generateAIResponse(
  messages: Message[], 
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  try {
    // Ottieni il nome del modello tecnico dalla mappa usando il nome UI o usa il default
    let apiModelName: string;
    if (modelName === "Gemma 3 12b it Instruct") {
      apiModelName = "gemma-3-12b-it";
    } else {
      apiModelName = ServerConfig.MODEL_NAME_MAP[modelName] || "meta-llama-3.1-8b-instruct";
    }
    
    // Converti i messaggi nel formato richiesto dall'API in base al modello
    const formattedMessages = convertMessagesToLlamaFormat(messages, modelName);
    
    // Usa l'URL dell'API dalle impostazioni o quello di default dalla configurazione centralizzata
    const apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
    
    console.log(`Sending request to API at ${apiUrl} with model: ${apiModelName}`);
    console.log(`Formatted messages:`, JSON.stringify(formattedMessages, null, 2));
    
    // Implementazione di cache per richieste ripetute
    const cacheKey = JSON.stringify({ messages: formattedMessages, model: apiModelName });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Cache hit, returning cached response");
      return cachedResponse;
    }

    // Crea il corpo della richiesta
    const requestBody = {
      model: apiModelName,
      messages: formattedMessages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: settings?.maxTokens ?? -1,
      stream: false
    };

    console.log(`Request body: ${JSON.stringify(requestBody, null, 2)}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error response: ${response.status} ${errorText}`);
      throw new Error(`API response error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Formato di risposta API non valido - choices non trovato:", data);
      throw new Error("Formato di risposta API non valido: choices non trovato");
    }
    
    const content = data.choices[0].message.content;
    
    // Memorizza nella cache
    responseCache.set(cacheKey, content);
    
    return content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `Mi dispiace, ma al momento non riesco a generare una risposta. Riprova con un altro modello o contatta l'assistenza.`;
  }
}

// NUOVA FUNZIONE: Migliora il testo dell'utente tramite prompt engineering
export async function improveText(
  text: string,
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  try {
    if (!text || text.trim() === '') {
      throw new Error('Il testo da migliorare non può essere vuoto');
    }
    
    // Ottieni il nome del modello tecnico dalla mappa usando il nome UI o usa il default
    let apiModelName: string;
    if (modelName === "Gemma 3 12b it Instruct") {
      apiModelName = "gemma-3-12b-it";
    } else {
      apiModelName = ServerConfig.MODEL_NAME_MAP[modelName] || "meta-llama-3.1-8b-instruct";
    }
    
    // Usa l'URL dell'API dalle impostazioni o quello di default dalla configurazione centralizzata
    const apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
    
    console.log(`Improving text with model: ${apiModelName} at URL: ${apiUrl}`);
    
    // Crea messaggi per il miglioramento del prompt
    let messages: LlamaMessage[] = [];
    
    // Gestisci in modo diverso i messaggi per Gemma vs altri modelli
    if (apiModelName === "gemma-3-12b-it") {
      // Per Gemma, usa solo messaggi utente senza sistema
      messages = [
        {
          role: 'user',
          content: `Sei un esperto di prompt engineering. Il tuo compito è migliorare il testo che ti invierò per renderlo più chiaro, specifico e strutturato. Rispondi solo con la versione migliorata del prompt, senza spiegazioni o altro testo. Ecco il testo da migliorare: "${text}"`
        }
      ];
    } else {
      // Per altri modelli, usa il formato standard con messaggio di sistema
      messages = [
        {
          role: 'system',
          content: 'Sei un esperto di prompt engineering. Il tuo compito è migliorare il testo dell\'utente per renderlo più chiaro, specifico e strutturato per ottenere risposte migliori da un modello di AI. Rispondi solo con la versione migliorata del prompt, senza spiegazioni o altro testo.'
        },
        {
          role: 'user',
          content: text
        }
      ];
    }
    
    // Implementazione di cache per richieste ripetute
    const cacheKey = JSON.stringify({ text, model: apiModelName, action: 'improve' });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Cache hit, returning cached improved text");
      return cachedResponse;
    }

    // Crea il corpo della richiesta
    const requestBody = {
      model: apiModelName,
      messages: messages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: settings?.maxTokens ?? -1,
      stream: false
    };

    console.log(`Request body for text improvement: ${JSON.stringify(requestBody, null, 2)}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error response: ${response.status} ${errorText}`);
      throw new Error(`API response error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Formato di risposta API non valido - choices non trovato:", data);
      throw new Error("Formato di risposta API non valido: choices non trovato");
    }
    
    const improvedText = data.choices[0].message.content;
    
    // Memorizza nella cache
    responseCache.set(cacheKey, improvedText);
    
    return improvedText;
  } catch (error) {
    console.error('Error improving text:', error);
    throw error;
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