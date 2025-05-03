// Configurazione centralizzata dei modelli
// Questo file serve sia per il frontend che per il backend attraverso l'API

export interface ModelConfig {
  displayName: string;  // Nome mostrato nell'interfaccia utente
  apiName: string;      // Nome tecnico utilizzato per le chiamate API
  supportsImages: boolean; // Indica se il modello supporta l'elaborazione di immagini
}

// Array di tutti i modelli disponibili
export const availableModels: ModelConfig[] = [
  {
    displayName: "Qwen3 0.6b",
    apiName: "qwen3-0.6b",
    supportsImages: false
  },
  {
    displayName: "Qwen3 4b",
    apiName: "qwen3-4b",
    supportsImages: false
  },
  {
    displayName: "Deepseek R1 Distill Llama 8b",
    apiName: "deepseek-r1-distill-llama-8b",
    supportsImages: false
  },
  {
    displayName: "Llama 3.1 8b Instruct",
    apiName: "meta-llama-3.1-8b-instruct",
    supportsImages: false
  },
  {
    displayName: "Gemma 3 12b it",
    apiName: "gemma-3-12b-it-qat",
    supportsImages: true
  }
  // Per aggiungere un nuovo modello, basta inserire una nuova voce qui
];

// Modello predefinito
export const defaultModel = availableModels[0].displayName;

// Funzione helper per ottenere il nome API da un nome visualizzato
export function getApiModelName(displayName: string): string {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.apiName : availableModels[0].apiName; // Fallback al primo modello
}

// Funzione helper per verificare se un modello supporta le immagini
export function modelSupportsImages(displayName: string): boolean {
  const model = availableModels.find(m => m.displayName === displayName);
  return model ? model.supportsImages : false; // Fallback a false per sicurezza
}
// Genera la mappa dei modelli per la retrocompatibilità
export const MODEL_NAME_MAP = availableModels.reduce((map, model) => {
  map[model.displayName] = model.apiName;
  return map;
}, {} as Record<string, string>);