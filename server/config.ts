// Importazione della configurazione condivisa dei modelli
import { MODEL_NAME_MAP } from '../client/src/lib/modelConfig';

// Configurazione centralizzata per API e altre impostazioni server
export const ServerConfig = {
  // URL di default per l'API
  DEFAULT_API_URL: 'http://127.0.0.1:8080/v1/chat/completions',
  
  // Altre configurazioni server possono essere aggiunte qui
  API_TIMEOUT: 30000, // timeout in ms
  
  // Mappa dei modelli importata dalla configurazione condivisa
  MODEL_NAME_MAP
};