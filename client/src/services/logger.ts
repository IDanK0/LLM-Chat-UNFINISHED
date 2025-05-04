/**
 * Client-side logging system for displaying formatted logs in the browser
 */

// CSS styles for the browser console
const styleMap: Record<LogLevel | 'module' | 'timestamp', string> = {
  debug: 'color: gray',
  info: 'color: #3498db',
  success: 'color: #2ecc71',
  warn: 'color: #f39c12',
  error: 'color: #e74c3c; font-weight: bold',
  module: 'color: #9b59b6',
  timestamp: 'color: gray',
};

// Log level configuration
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

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

  // Prepare message parts
  const parts: string[] = [];
  const styles: string[] = [];
  
  // Add timestamp if requested
  if (config.showTimestamp) {
    parts.push(`%c[${getTimestamp()}]`);
    styles.push('color: gray');
  }
  
  // Format the level
  if (config.showLevel) {
    const levelText = level.toUpperCase().padEnd(7);
    parts.push(`%c${levelText}`);
    styles.push(styleMap[level]);
  }
  
  // Add module name if requested
  if (config.showModule && module) {
    parts.push(`%c[${module}]`);
    styles.push('color: #9b59b6');
  }
  
  // Add the main message
  parts.push(`%c${message}`);
  styles.push('color: inherit');
  
  // Log to console
  const formatString = parts.join(' ');
  
  switch (level) {
    case 'error':
      console.error(formatString, ...styles, data);
      break;
    case 'warn':
      console.warn(formatString, ...styles, data);
      break;
    case 'debug':
      console.debug(formatString, ...styles, data);
      break;
    default:
      console.log(formatString, ...styles, data);
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

// Set debug level in development
if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
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