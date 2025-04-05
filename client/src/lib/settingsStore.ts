// Definizione del tipo per le impostazioni API
export interface ApiSettings {
  apiUrl: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
}

// Valori predefiniti
const defaultSettings: ApiSettings = {
  apiUrl: "",
  temperature: 0.7,
  maxTokens: -1,
  stream: false
};

// Chiave per localStorage
const SETTINGS_STORAGE_KEY = "llm_chat_api_settings";

// Funzioni per gestire le impostazioni
export function getSettings(): ApiSettings {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings);
    }
  } catch (error) {
    console.error("Errore nel caricamento delle impostazioni:", error);
  }
  return defaultSettings;
}

export function saveSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    // Invia un evento custom per notificare i componenti interessati
    window.dispatchEvent(new CustomEvent("api-settings-changed", { detail: settings }));
  } catch (error) {
    console.error("Errore nel salvataggio delle impostazioni:", error);
  }
}

export function resetSettings(): ApiSettings {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error("Errore nel reset delle impostazioni:", error);
  }
  return defaultSettings;
}