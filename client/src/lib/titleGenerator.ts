import { apiRequest } from "./queryClient";
import { getSettings } from "./settingsStore";
import { Message } from "./types";

/**
 * Verifica se il titolo è quello predefinito ("Nuova Chat")
 */
export function isDefaultTitle(title: string): boolean {
  return title === "Nuova Chat";
}

/**
 * Genera un titolo per la chat basato sul primo messaggio dell'utente
 * e aggiorna la chat con il nuovo titolo
 */
export async function regenerateChatTitle(chatId: string, options?: {
  modelName?: string;
  temperature?: number;
  apiKey?: string;
  apiUrl?: string;
  apiVersion?: string;
}): Promise<boolean> {
  try {
    console.log(`[TitleGenerator] Avvio generazione titolo per chat ${chatId}`);
    
    // Ottieni le impostazioni dell'utente
    const settings = getSettings();
    
    // Verifica se la generazione automatica dei titoli è abilitata
    if (!settings.autoGenerateTitle) {
      console.log("[TitleGenerator] Generazione automatica dei titoli disabilitata");
      return false;
    }
    
    // Ottieni la chat
    console.log(`[TitleGenerator] Recupero informazioni chat ${chatId}`);
    const chatResponse = await apiRequest("GET", `/api/chats/${chatId}`);
    const chat = await chatResponse.json();
    
    // Verifica se il titolo è già stato personalizzato
    if (!isDefaultTitle(chat.title)) {
      console.log("[TitleGenerator] Il titolo è già personalizzato:", chat.title);
      return false;
    }
    
    // Ottieni i messaggi della chat
    console.log(`[TitleGenerator] Recupero messaggi della chat ${chatId}`);
    const messagesResponse = await apiRequest("GET", `/api/chats/${chatId}/messages`);
    const messages: Message[] = await messagesResponse.json();
    
    // Trova il primo messaggio dell'utente
    const firstUserMessage = messages.find(msg => msg.isUserMessage);
    
    if (!firstUserMessage) {
      console.log("[TitleGenerator] Nessun messaggio utente trovato");
      return false;
    }
    
    console.log("[TitleGenerator] Primo messaggio utente:", firstUserMessage.content);
    
    // Approccio semplice: estrai le prime parole significative dal messaggio utente
    let title = "";
    
    try {
      // Prima prova con l'endpoint improve-text se disponibile
      console.log("[TitleGenerator] Tentativo con endpoint improve-text");
      const response = await apiRequest("POST", "/api/improve-text", {
        text: `Crea un titolo brevissimo (massimo 3 parole) per questo messaggio senza usare virgolette o formattazione del testo: "${firstUserMessage.content.substring(0, 100)}"`,
        modelName: options?.modelName || "meta-llama-3.1-8b-instruct", // Usa il modello passato nelle opzioni
        temperature: options?.temperature || 0.5
      });
      
      const data = await response.json();
      if (data && data.improvedText && typeof data.improvedText === 'string') {
        // Filtra eventuali tag <think> e </think> e il contenuto tra essi
        let improvedText = data.improvedText.trim();
        
        // Filtra i tag di pensiero e il loro contenuto per modelli come deepseek r1
        const thinkRegex = /<think>[\s\S]*?<\/think>/g;
        improvedText = improvedText.replace(thinkRegex, '').trim();
        
        title = improvedText;
      } else {
        throw new Error("Formato risposta non valido");
      }
    } catch (apiError) {
      console.warn("[TitleGenerator] Errore con improve-text, uso fallback:", apiError);
      
      // Fallback: usa le prime parole del messaggio
      const cleanedMessage = firstUserMessage.content
        .replace(/[^\w\s]/gi, '') // Rimuovi punteggiatura
        .replace(/\s+/g, ' ')     // Normalizza spazi
        .trim();
      
      const words = cleanedMessage.split(' ');
      const significantWords = words.filter(word => word.length > 2); // Ignora parole troppo corte
      
      if (significantWords.length > 0) {
        // Prendi fino a 3 parole significative
        title = significantWords.slice(0, 3).join(' ');
      } else {
        // Se non ci sono parole significative, usa le prime parole
        title = words.slice(0, 3).join(' ');
      }
    }
    
    // Capitalizza la prima lettera del titolo
    if (title && title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }
    
    // Limita la lunghezza del titolo
    if (title.length > 30) {
      title = title.substring(0, 27) + "...";
    }
    
    // Assicurati che il titolo non sia vuoto
    if (!title || title.trim().length === 0) {
      title = "Nuova conversazione";
    }
    
    console.log(`[TitleGenerator] Titolo generato: "${title}"`);
    
    // Aggiorna il titolo della chat
    console.log(`[TitleGenerator] Aggiornamento titolo della chat ${chatId}`);
    await apiRequest("PATCH", `/api/chats/${chatId}`, { title });
    
    console.log(`[TitleGenerator] Titolo aggiornato con successo`);
    return true;
    
  } catch (error) {
    console.error("[TitleGenerator] Errore durante la generazione del titolo:", error);
    return false;
  }
}