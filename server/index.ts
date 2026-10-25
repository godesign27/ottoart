import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { registerLocalStorageRoutes } from "./localObjectStorage";

const isLocalDev = process.env.LOCAL_DEV === "1";

// Validate required environment variables for object storage
function validateObjectStorageEnvironment() {
  const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
  const privateDir = process.env.PRIVATE_OBJECT_DIR || "";

  if (!publicPaths || publicPaths.trim() === "") {
    throw new Error(
      "PUBLIC_OBJECT_SEARCH_PATHS environment variable is not set. " +
      "Please create a bucket in the 'Object Storage' tool pane and configure the environment variable."
    );
  }

  if (!privateDir || privateDir.trim() === "") {
    throw new Error(
      "PRIVATE_OBJECT_DIR environment variable is not set. " +
      "Please create a bucket in the 'Object Storage' tool pane and configure the environment variable."
    );
  }

  // Validate that paths are properly formatted
  const paths = publicPaths.split(",").map(p => p.trim()).filter(p => p.length > 0);
  if (paths.length === 0) {
    throw new Error(
      "PUBLIC_OBJECT_SEARCH_PATHS contains no valid paths. " +
      "Provide comma-separated bucket paths (e.g., '/bucket1/public,/bucket2/assets')"
    );
  }

  for (const path of paths) {
    if (!path.startsWith("/")) {
      throw new Error(
        `Invalid path in PUBLIC_OBJECT_SEARCH_PATHS: "${path}". ` +
        "Paths must start with '/' and follow the format '/bucket-name/object-path'"
      );
    }
  }

  if (!privateDir.startsWith("/")) {
    throw new Error(
      `Invalid PRIVATE_OBJECT_DIR: "${privateDir}". ` +
      "Path must start with '/' and follow the format '/bucket-name/object-path'"
    );
  }

  log(`Object storage environment validated:`);
  log(`  PUBLIC_OBJECT_SEARCH_PATHS: ${publicPaths}`);
  log(`  PRIVATE_OBJECT_DIR: ${privateDir}`);
}

const app = express();

// Must run before express.json so the raw upload body reaches it intact.
if (isLocalDev) {
  registerLocalStorageRoutes(app);
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from attached_assets directory
app.use('/attached_assets', express.static('attached_assets'));

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
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate object storage environment before starting server
  try {
    if (!isLocalDev) validateObjectStorageEnvironment();
  } catch (error) {
    console.error("Environment validation failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: isLocalDev ? "127.0.0.1" : "0.0.0.0",
    reusePort: !isLocalDev,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
