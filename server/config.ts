// Import shared model configuration
import { MODEL_NAME_MAP } from '../client/src/lib/modelConfig';

// Centralized configuration for API and other server settings
export const ServerConfig = {
  // Default URL for the API
  DEFAULT_API_URL: 'http://127.0.0.1:1234/v1/chat/completions',
  
  // Other server configurations can be added here
  API_TIMEOUT: 3600000, // increased to 60 minutes
  
  // Model map imported from shared configuration
  MODEL_NAME_MAP
};