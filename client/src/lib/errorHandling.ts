import { useToast } from "@/hooks/use-toast";

export type ErrorType = 'network' | 'validation' | 'server' | 'timeout' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  details?: string;
  retryable: boolean;
}

/**
 * Analizza un errore e determina il tipo e la strategia di recovery
 */
export function analyzeError(error: unknown): ErrorInfo {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      retryable: true
    };
  }

  if (error instanceof Error) {
    const errorMessage = error.message;
    
    // Timeout errors
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return {
        type: 'timeout',
        message: 'Request timed out. The server might be busy.',
        retryable: true
      };
    }

    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        retryable: true
      };
    }

    // Validation errors
    if (errorMessage.includes('400') || errorMessage.includes('validation')) {
      return {
        type: 'validation',
        message: 'Invalid request. Please check your input.',
        details: errorMessage,
        retryable: false
      };
    }

    // Authorization errors
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return {
        type: 'server',
        message: 'Authentication failed. Please check your API keys.',
        retryable: false
      };
    }

    return {
      type: 'unknown',
      message: `Unexpected error: ${errorMessage}`,
      details: errorMessage,
      retryable: false
    };
  }

  return {
    type: 'unknown',
    message: 'An unknown error occurred',
    details: String(error),
    retryable: false
  };
}

/**
 * Hook per la gestione centralizzata degli errori
 */
export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = (error: unknown, context?: string) => {
    const errorInfo = analyzeError(error);
    
    toast({
      title: "Error",
      description: errorInfo.message,
      variant: "destructive",
    });

    // Log error for debugging
    console.error(`Error in ${context || 'unknown context'}:`, {
      error,
      type: errorInfo.type,
      retryable: errorInfo.retryable,
      details: errorInfo.details
    });

    return errorInfo;
  };

  return { handleError };
}

/**
 * Retry utility con backoff exponenziale
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorInfo = analyzeError(error);
      
      // Non ritentare se l'errore non è ritrattabile
      if (!errorInfo.retryable) {
        throw error;
      }
      
      // Ultimo tentativo fallito
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Backoff exponenziale
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
