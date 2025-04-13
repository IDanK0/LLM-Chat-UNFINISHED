import { ServerConfig } from './config';
import { Message } from '@/lib/types';
import { getApiModelName } from '../client/src/lib/modelConfig';

// Interfaccia per le impostazioni della richiesta API
interface ApiRequestSettings {
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean; // Mantenuto per compatibilità ma non verrà utilizzato
}

// Interfaccia per i messaggi formattati per Llama
interface LlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Implementazione di una cache semplice per migliorare le prestazioni
class SimpleCache {
  private cache: Map<string, { value: string, timestamp: number }>;
  private maxSize: number;

  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): string | undefined {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < 3600000) { // Cache valida per un'ora
      return item.value;
    }
    return undefined;
  }

  set(key: string, value: string): void {
    // Se la cache è piena, rimuovi la voce più vecchia
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Istanza della cache
const responseCache = new SimpleCache();

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
    for (const message of messages) {
      result.push({
        role: message.isUserMessage ? 'user' : 'assistant',
        content: message.content
      });
    }
  } else {
    // Per modelli come Llama, utilizziamo il formato standard con messaggio di sistema
    result.push({
      role: 'system',
      content: systemContent
    });
    
    for (const message of messages) {
      result.push({
        role: message.isUserMessage ? 'user' : 'assistant',
        content: message.content
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
    // Ottieni il nome del modello tecnico dalla funzione helper
    const apiModelName = getApiModelName(modelName);
    
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
      console.log("Using cached response");
      return cachedResponse;
    }
    
    // Crea il corpo della richiesta
    const requestBody = {
      model: apiModelName,
      messages: formattedMessages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: settings?.maxTokens ?? 1000
    };
    
    // Log della richiesta per debug
    console.log(`Request body:`, JSON.stringify(requestBody, null, 2));
    
    // Configura il timeout per la richiesta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ServerConfig.API_TIMEOUT);
    
    // Esegui la richiesta
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    // Pulisci il timeout
    clearTimeout(timeoutId);
    
    // Verifica se la richiesta ha avuto successo
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API response error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Ottieni la risposta JSON
    const data = await response.json();
    
    // Estrai il contenuto della risposta
    let content = data.choices && data.choices[0]?.message?.content;
    
    // Se non c'è contenuto, restituisci un messaggio di errore
    if (!content) {
      throw new Error("No content in API response");
    }
    
    // Salva la risposta nella cache
    responseCache.set(cacheKey, content);
    
    return content;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return `Mi dispiace, ma al momento non riesco a generare una risposta. Riprova con un altro modello o contatta l'assistenza.`;
  }
}

export async function improveText(
  text: string,
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  if (!text || text.trim().length === 0) {
    return "Il testo fornito è vuoto. Inserisci un testo da migliorare.";
  }
  
  try {
    // Ottieni il nome del modello tecnico dalla funzione helper
    const apiModelName = getApiModelName(modelName);
    
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
          content: `Sei un esperto di prompt engineering. Il tuo compito è riscrivere il prompt fornito dall'utente in modo che sia più chiaro, dettagliato e strutturato, con l'obiettivo di ottenere risposte più precise e pertinenti da un modello di intelligenza artificiale. Restituisci esclusivamente la versione ottimizzata del prompt, senza aggiungere spiegazioni o testo aggiuntivo. Ecco il testo da migliorare: "${text}"`
        }
      ];
    } else {
      // Per altri modelli, usa il formato standard con messaggio di sistema
      messages = [
        {
          role: 'system',
          content: `Sei un esperto di prompt engineering. Il tuo compito è riscrivere il prompt fornito dall'utente in modo che sia più chiaro, dettagliato e strutturato, con l'obiettivo di ottenere risposte più precise e pertinenti da un modello di intelligenza artificiale. Restituisci esclusivamente la versione ottimizzata del prompt, senza aggiungere spiegazioni o testo aggiuntivo.`
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
      console.log("Using cached response for text improvement");
      return cachedResponse;
    }
    
    // Crea il corpo della richiesta
    const requestBody = {
      model: apiModelName,
      messages: messages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: settings?.maxTokens ?? 1000
    };
    
    // Configura il timeout per la richiesta
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ServerConfig.API_TIMEOUT);
    
    // Esegui la richiesta
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    // Pulisci il timeout
    clearTimeout(timeoutId);
    
    // Verifica se la richiesta ha avuto successo
    if (!response.ok) {
      throw new Error(`API response error: ${response.status} ${response.statusText}`);
    }
    
    // Ottieni la risposta JSON
    const data = await response.json();
    
    // Estrai il contenuto della risposta
    let content = data.choices && data.choices[0]?.message?.content;
    
    // Se non c'è contenuto, restituisci un messaggio di errore
    if (!content) {
      throw new Error("No content in API response");
    }
    
    // Salva la risposta nella cache
    responseCache.set(cacheKey, content);
    
    return content;
  } catch (error) {
    console.error('Error improving text:', error);
    return `Mi dispiace, non sono riuscito a migliorare il testo. Errore: ${error instanceof Error ? error.message : String(error)}`;
  }
}