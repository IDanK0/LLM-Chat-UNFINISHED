import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { createLogger, setLogLevel } from "./utils/logger";

// Create a logger for the main server
const logger = createLogger('Server');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware for logging API requests
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let level: 'info' | 'error' | 'warn' = 'info';
      
      // Use different levels based on status code
      if (res.statusCode >= 500) {
        level = 'error';
      } else if (res.statusCode >= 400) {
        level = 'warn';
      }
      
      // Basic information for the log
      const logInfo = { 
        method: req.method, 
        path, 
        status: res.statusCode, 
        duration: `${duration}ms` 
      };
      
      // Main log
      logger[level](`${req.method} ${path} ${res.statusCode} in ${duration}ms`, logInfo);
      
      // Only for verbose debug, separate log with response body
      if (level !== 'info' && capturedJsonResponse) {
        const jsonString = JSON.stringify(capturedJsonResponse);
        const truncated = jsonString.length > 100 ? jsonString.slice(0, 100) + "…" : jsonString;
        logger.debug(`Response: ${truncated}`);
      }
    }
  });

  next();
});

// Endpoint to configure log level (development only)
if (app.get("env") === "development") {
  app.post("/api/debug/log-level", (req, res) => {
    const { level } = req.body;
    
    if (!level || !['debug', 'info', 'warn', 'error'].includes(level)) {
      return res.status(400).json({ 
        message: "Invalid level. Use one of: debug, info, warn, error" 
      });
    }
    
    setLogLevel(level as 'debug' | 'info' | 'warn' | 'error');
    logger.info(`Log level set to: ${level}`);
    
    return res.json({ 
      message: `Log level set to: ${level}`,
      level
    });
  });
}

(async () => {
  logger.info("Starting server...");
  
  try {
    // First register API routes
    const server = await registerRoutes(app);

    // Then setup error handling
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      logger.error(`Error: ${message}`, err);
      res.status(status).json({ message });
    });

    // Environment configuration - after API routes
    if (app.get("env") === "development") {
      logger.info("Configuring development environment");
      await setupVite(app, server);
      // Set debug log level in development
      setLogLevel('debug');
    } else {
      logger.info("Configuring production environment");
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    
    server.listen(port, () => {
      logger.success(`Server started and listening on port ${port}`);
      logger.info("------------------------------------------------------------");
      logger.info("  Use the /api/debug/log-level endpoint to change the log level");
      logger.info("  POST { \"level\": \"debug\" } to see all messages");
      logger.info("  POST { \"level\": \"info\" } to see only info, warn, error");
      logger.info("  POST { \"level\": \"warn\" } to see only warn, error");
      logger.info("  POST { \"level\": \"error\" } to see only errors");
      logger.info("------------------------------------------------------------");
    });
  } catch (error) {
    logger.error("Error during server startup:", error);
    process.exit(1);
  }
})();
