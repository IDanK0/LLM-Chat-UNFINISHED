export interface ApiSettings {
  apiUrl: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  animationSpeed: number; // Nuova impostazione per la velocità dell'animazione (parole al secondo)
  autoGenerateTitle: boolean; // Nuova impostazione per la generazione automatica dei titoli
}

const DEFAULT_SETTINGS: ApiSettings = {
  apiUrl: '',
  temperature: 0.7,
  maxTokens: -1,
  stream: true,
  animationSpeed: 15,  // Default: 15 parole al secondo
  autoGenerateTitle: true // Default: attivato
};

export function getSettings(): ApiSettings {
  try {
    const saved = localStorage.getItem('apiSettings');
    if (saved) {
      // Assicurati che le impostazioni salvate abbiano tutti i campi necessari
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
      };
    }
  } catch (error) {
    console.error('Errore nel caricamento delle impostazioni:', error);
  }
  
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ApiSettings): void {
  try {
    localStorage.setItem('apiSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Errore nel salvataggio delle impostazioni:', error);
  }
}

export function resetSettings(): ApiSettings {
  try {
    localStorage.setItem('apiSettings', JSON.stringify(DEFAULT_SETTINGS));
  } catch (error) {
    console.error('Errore nel reset delle impostazioni:', error);
  }
  return DEFAULT_SETTINGS;
}