/**
 * Advanced logging system to improve readability and clarity of terminal messages
 */

// ANSI colors for text formatting in the terminal
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  // Text colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  // Background colors
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

// Log level configuration
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

interface LoggerConfig {
  showTimestamp: boolean;
  showLevel: boolean;
  showModule: boolean;
  enabled: boolean;
  minLevel: LogLevel;
}

// Default settings
const config: LoggerConfig = {
  showTimestamp: true,
  showLevel: true,
  showModule: true,
  enabled: true,
  minLevel: 'info', // Default minimum level
};

// Log levels ordered by importance
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  success: 2,
  warn: 3,
  error: 4,
};

/**
 * Formats a timestamp for logs
 * @returns Formatted timestamp
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

/**
 * Main logging function
 * @param level Message level
 * @param message Message to log
 * @param module Module or component name
 * @param data Additional data to log (optional)
 */
function log(level: LogLevel, message: string, module: string, data?: any): void {
  if (!config.enabled || logLevels[level] < logLevels[config.minLevel]) {
    return;
  }

  let formattedMessage = '';
  
  // Add timestamp if requested
  if (config.showTimestamp) {
    formattedMessage += `${colors.dim}[${getTimestamp()}]${colors.reset} `;
  }
  
  // Format the level with appropriate color
  if (config.showLevel) {
    let levelColor = colors.white;
    let levelText = level.toUpperCase();
    
    switch (level) {
      case 'debug':
        levelColor = colors.dim + colors.white;
        break;
      case 'info':
        levelColor = colors.blue;
        break;
      case 'success':
        levelColor = colors.green;
        break;
      case 'warn':
        levelColor = colors.yellow;
        break;
      case 'error':
        levelColor = colors.red;
        break;
    }
    
    formattedMessage += `${levelColor}${levelText.padEnd(7)}${colors.reset} `;
  }
  
  // Add module name if requested
  if (config.showModule && module) {
    formattedMessage += `${colors.cyan}[${module}]${colors.reset} `;
  }
  
  // Add the main message
  formattedMessage += message;
  
  // Log to console
  switch (level) {
    case 'error':
      console.error(formattedMessage);
      if (data) console.error(data);
      break;
    case 'warn':
      console.warn(formattedMessage);
      if (data) console.warn(data);
      break;
    default:
      console.log(formattedMessage);
      if (data && level === 'debug') console.log(data);
  }
}

/**
 * Creates a logger specific to a module
 * @param moduleName Module name
 * @returns Logger object with methods for each level
 */
export function createLogger(moduleName: string) {
  return {
    debug: (message: string, data?: any) => log('debug', message, moduleName, data),
    info: (message: string, data?: any) => log('info', message, moduleName, data),
    success: (message: string, data?: any) => log('success', message, moduleName, data),
    warn: (message: string, data?: any) => log('warn', message, moduleName, data),
    error: (message: string, data?: any) => log('error', message, moduleName, data),
  };
}

/**
 * Configures global logger options
 * @param options Configuration options
 */
export function configureLogger(options: Partial<LoggerConfig>): void {
  Object.assign(config, options);
}

/**
 * Sets the minimum log level
 * @param level Minimum level to display
 */
export function setLogLevel(level: LogLevel): void {
  config.minLevel = level;
}

/**
 * Enables or disables all logs
 * @param enabled Enabled state
 */
export function enableLogging(enabled: boolean): void {
  config.enabled = enabled;
}

// Export default logger for the app
export const logger = createLogger('App');

// Export for compatibility with import *
export default {
  createLogger,
  configureLogger,
  setLogLevel,
  enableLogging,
  logger,
}; 