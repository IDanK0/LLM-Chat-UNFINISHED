// Importazione della configurazione condivisa dei modelli
import { MODEL_NAME_MAP } from '../client/src/lib/modelConfig';

// Configurazione centralizzata per API e altre impostazioni server
export const ServerConfig = {
  // URL di default per l'API
  DEFAULT_API_URL: 'http://127.0.0.1:1234/v1/chat/completions',
  
  // Altre configurazioni server possono essere aggiunte qui
  API_TIMEOUT: 3600000, // aumentato a 60 minuti
  
  // Mappa dei modelli importata dalla configurazione condivisa
  MODEL_NAME_MAP
};