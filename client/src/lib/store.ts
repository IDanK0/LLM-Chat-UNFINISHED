import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface AppState {
  // UI States
  isSidebarOpen: boolean;
  isLoading: boolean;
  currentChatId: string | null;
  
  // Settings
  selectedModel: string;
  apiSettings: {
    temperature: number;
    maxTokens: number;
    webSearchEnabled: boolean;
    openRouterApiKey?: string;
    deepseekApiKey?: string;
  };
  
  // Error handling
  lastError: string | null;
  retryCount: number;
}

export type AppAction = 
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CURRENT_CHAT_ID'; payload: string | null }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'UPDATE_API_SETTINGS'; payload: Partial<AppState['apiSettings']> }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'INCREMENT_RETRY_COUNT' }
  | { type: 'RESET_RETRY_COUNT' };

const initialState: AppState = {
  isSidebarOpen: false,
  isLoading: false,
  currentChatId: null,
  selectedModel: 'Qwen3 0.6b',
  apiSettings: {
    temperature: 0.7,
    maxTokens: -1,
    webSearchEnabled: false,
  },
  lastError: null,
  retryCount: 0,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_SIDEBAR_OPEN':
      return { ...state, isSidebarOpen: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_CURRENT_CHAT_ID':
      return { ...state, currentChatId: action.payload };
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'UPDATE_API_SETTINGS':
      return { 
        ...state, 
        apiSettings: { ...state.apiSettings, ...action.payload } 
      };
    case 'SET_ERROR':
      return { ...state, lastError: action.payload };
    case 'INCREMENT_RETRY_COUNT':
      return { ...state, retryCount: state.retryCount + 1 };
    case 'RESET_RETRY_COUNT':
      return { ...state, retryCount: 0 };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export const useIsSidebarOpen = () => {
  const { state } = useAppStore();
  return state.isSidebarOpen;
};

export const useIsLoading = () => {
  const { state } = useAppStore();
  return state.isLoading;
};

export const useCurrentChatId = () => {
  const { state } = useAppStore();
  return state.currentChatId;
};

export const useSelectedModel = () => {
  const { state } = useAppStore();
  return state.selectedModel;
};

export const useApiSettings = () => {
  const { state } = useAppStore();
  return state.apiSettings;
};

export const useLastError = () => {
  const { state } = useAppStore();
  return state.lastError;
};

export const useCanRetry = () => {
  const { state } = useAppStore();
  return state.retryCount < 3;
};

// Action creators
export const useAppActions = () => {
  const { dispatch } = useAppStore();
  
  return {
    setSidebarOpen: (open: boolean) => 
      dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open }),
    setLoading: (loading: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: loading }),
    setCurrentChatId: (chatId: string | null) => 
      dispatch({ type: 'SET_CURRENT_CHAT_ID', payload: chatId }),
    setSelectedModel: (model: string) => 
      dispatch({ type: 'SET_SELECTED_MODEL', payload: model }),
    updateApiSettings: (settings: Partial<AppState['apiSettings']>) => 
      dispatch({ type: 'UPDATE_API_SETTINGS', payload: settings }),
    setError: (error: string | null) => 
      dispatch({ type: 'SET_ERROR', payload: error }),
    incrementRetryCount: () => 
      dispatch({ type: 'INCREMENT_RETRY_COUNT' }),
    resetRetryCount: () => 
      dispatch({ type: 'RESET_RETRY_COUNT' }),
  };
};

// Provider component utility
export const createAppProvider = () => {
  return function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);
    
    return React.createElement(AppContext.Provider, 
      { value: { state, dispatch } }, 
      children
    );
  };
};
