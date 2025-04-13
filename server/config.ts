// Configurazione centralizzata per API e altre impostazioni server
export const ServerConfig = {
  // URL di default per l'API
  DEFAULT_API_URL: 'http://127.0.0.1:8080/v1/chat/completions',
  
  // Altre configurazioni server possono essere aggiunte qui
  API_TIMEOUT: 30000, // timeout in ms
  
  // Mappa dei modelli (spostata da api.ts e routes.ts)
  MODEL_NAME_MAP: {
    "Llama 3.1 8b Instruct": "meta-llama-3.1-8b-instruct",
    "Gemma 3 12b it Instruct": "gemma-3-12b-it"
  }
};