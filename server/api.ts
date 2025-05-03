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
  
  let result: LlamaMessage[] = [];
  
  // Per tutti i modelli, utilizziamo il formato standard con messaggio di sistema
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
  
  return result;
}

export async function generateAIResponse(
  messages: Message[], 
  modelName = "Llama 3.1 8b Instruct",
  settings?: ApiRequestSettings
): Promise<string> {
  try {
    if (!messages || messages.length === 0) {
      return "Non ci sono messaggi da elaborare.";
    }
    
    // Ottieni il nome del modello tecnico dalla funzione helper
    const apiModelName = getApiModelName(modelName);
    
    // Usa l'URL dell'API dalle impostazioni o quello di default dalla configurazione centralizzata
    const apiUrl = settings?.apiUrl || ServerConfig.DEFAULT_API_URL;
    
    console.log(`Generating response using model: ${apiModelName} at ${apiUrl}`);
    
    // Prepara il contesto della conversazione come testo
    let conversationText = "### Conversazione:\n\n";
    
    // Estrai gli ultimi messaggi per mantenere la richiesta più leggera
    const recentMessages = messages.slice(-6);
    
    // Formatta la conversazione come testo
    for (const message of recentMessages) {
      const role = message.isUserMessage ? "Utente" : "Assistente";
      conversationText += `${role}: ${message.content.trim()}\n\n`;
    }
    
    // Aggiungi una richiesta esplicita per la risposta
    conversationText += "### Istruzioni:\nRispondi come faresti se fossi l'assistente nella conversazione sopra riportata. Fornisci SOLO la risposta, senza prefissi come 'Assistente:'.";
    
    // Implementazione di cache per richieste ripetute
    const cacheKey = JSON.stringify({ conversation: conversationText, model: apiModelName });
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse) {
      console.log("Using cached response");
      return cachedResponse;
    }
    
    // Crea messaggi con lo stesso formato di improveText che sappiamo funzionare
    const adaptedMessages: LlamaMessage[] = [
      {
        role: 'system',
        content: `Sei un assistente AI italiano utile, preciso e amichevole. Il tuo compito è fornire la prossima risposta dell'assistente nella conversazione. Rispondi in modo naturale e appropriato al contesto della conversazione.`
      },
      {
        role: 'user',
        content: conversationText
      }
    ];
    
    // Crea il corpo della richiesta usando lo stesso formato di improveText
    const requestBody = {
      model: apiModelName,
      messages: adaptedMessages,
      temperature: settings?.temperature ?? 0.7,
      max_tokens: settings?.maxTokens ?? -1, // Usa -1 come in improveText
      stream: false // Esplicitamente impostato a false
    };
    
    // Log della richiesta per debug
    console.log(`Request body (simplified):`, JSON.stringify(requestBody).substring(0, 500) + "...");
    
    // Configura il timeout per la richiesta
    const isLargeModel = apiModelName.includes("12b") || apiModelName.includes("70b");
    const timeoutDuration = isLargeModel ? ServerConfig.API_TIMEOUT * 2 : ServerConfig.API_TIMEOUT;
    console.log(`Setting timeout to ${timeoutDuration}ms for model ${apiModelName}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      // Esegui la richiesta con gli stessi header e parametri di improveText
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
      
      // Pulizia della risposta - rimuovi prefissi come "Assistente:" se presenti
      content = content.replace(/^(Assistente|Assistant):\s*/i, '').trim();
      
      // Salva la risposta nella cache
      responseCache.set(cacheKey, content);
      
      return content;
    } catch (fetchError) {
      // Pulizia del timeout in caso di errore
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error generating AI response:', error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return `Mi dispiace, la generazione della risposta sta richiedendo troppo tempo. Il modello "${modelName}" potrebbe essere momentaneamente sovraccarico. Puoi attendere qualche minuto e riprovare o selezionare un modello più piccolo.`;
    }
    
    // Errore più dettagliato per aiutare nel debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Detailed error for model ${modelName}: ${errorMessage}`);
    
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
    
    // Crea messaggi per il miglioramento del prompt - tutti i modelli usano lo stesso formato
    const messages: LlamaMessage[] = [
      {
        role: 'system',
        content: `Sei un esperto di prompt engineering. Il tuo compito è riscrivere il prompt fornito dall'utente in modo che sia più chiaro, dettagliato e strutturato, con l'obiettivo di ottenere risposte più precise e pertinenti da un modello di intelligenza artificiale. Restituisci esclusivamente la versione ottimizzata del prompt, senza aggiungere spiegazioni o testo aggiuntivo.`
      },
      {
        role: 'user',
        content: text
      }
    ];
    
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
      max_tokens: settings?.maxTokens ?? 1000,
      stream: false
    };
    
    // Configura il timeout per la richiesta - Usa un timeout più lungo per modelli che potrebbero essere più lenti
    const isLargeModel = apiModelName.includes("12b") || apiModelName.includes("32b");
    const timeoutDuration = isLargeModel ? ServerConfig.API_TIMEOUT * 2 : ServerConfig.API_TIMEOUT;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
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
    } catch (fetchError) {
      // Pulizia del timeout in caso di errore
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error improving text:', error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      return `Mi dispiace, il miglioramento del testo sta richiedendo troppo tempo. Il modello "${modelName}" potrebbe essere momentaneamente sovraccarico. Puoi attendere qualche minuto e riprovare o selezionare un modello più piccolo.`;
    }
    
    return `Mi dispiace, non sono riuscito a migliorare il testo. Errore: ${error instanceof Error ? error.message : String(error)}`;
  }
}