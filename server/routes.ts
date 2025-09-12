import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertTagSchema, insertOrderSchema, insertMessageSchema, insertPageSettingsSchema, insertSiteSettingsSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Type declarations for global rate limiting
declare global {
  var uploadRateLimit: Map<string, number[]> | undefined;
  var finalizeRateLimit: Map<string, number[]> | undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { category, featured } = req.query;
      let products = await storage.getProducts();
      
      if (category) {
        const categoryData = await storage.getCategoryBySlug(category as string);
        if (categoryData) {
          products = await storage.getProductsByCategory(categoryData.id);
        }
      }
      
      if (featured === 'true') {
        products = await storage.getFeaturedProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      console.log("Received product data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Product validation error:", error);
      if (error instanceof Error && 'issues' in error) {
        console.error("Validation issues:", (error as any).issues);
      }
      res.status(400).json({ 
        message: "Invalid product data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.post("/api/categories/reorder", async (req, res) => {
    try {
      const { categoryIds } = req.body;
      if (!Array.isArray(categoryIds)) {
        return res.status(400).json({ message: "categoryIds must be an array" });
      }
      const categories = await storage.reorderCategories(categoryIds);
      res.json(categories);
    } catch (error) {
      console.error("Failed to reorder categories:", error);
      res.status(400).json({ message: "Failed to reorder categories" });
    }
  });

  // Tags
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  app.post("/api/tags", async (req, res) => {
    try {
      const validatedData = insertTagSchema.parse(req.body);
      const tag = await storage.createTag(validatedData);
      res.status(201).json(tag);
    } catch (error) {
      res.status(400).json({ message: "Invalid tag data" });
    }
  });

  // Orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  // Messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const success = await storage.markMessageAsRead(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json({ message: "Message marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  // Page Settings
  app.get("/api/page-settings", async (req, res) => {
    try {
      const pageSettings = await storage.getPageSettings();
      res.json(pageSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page settings" });
    }
  });

  app.get("/api/page-settings/:page", async (req, res) => {
    try {
      const pageSetting = await storage.getPageSetting(req.params.page);
      if (!pageSetting) {
        return res.status(404).json({ message: "Page setting not found" });
      }
      res.json(pageSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch page setting" });
    }
  });

  app.put("/api/page-settings/:page", async (req, res) => {
    try {
      const validatedData = insertPageSettingsSchema.parse({
        page: req.params.page,
        enabled: req.body.enabled
      });
      const pageSetting = await storage.setPageSetting(validatedData);
      res.json(pageSetting);
    } catch (error) {
      res.status(400).json({ message: "Invalid page setting data" });
    }
  });

  // Site Settings
  app.get("/api/site-settings", async (req, res) => {
    try {
      const siteSettings = await storage.getSiteSettings();
      res.json(siteSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch site settings" });
    }
  });

  app.get("/api/site-settings/:key", async (req, res) => {
    try {
      const siteSetting = await storage.getSiteSetting(req.params.key);
      if (!siteSetting) {
        return res.status(404).json({ message: "Site setting not found" });
      }
      res.json(siteSetting);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch site setting" });
    }
  });

  app.post("/api/site-settings/:key", async (req, res) => {
    try {
      const validatedData = insertSiteSettingsSchema.parse({
        key: req.params.key,
        value: req.body.value
      });
      const siteSetting = await storage.setSiteSetting(validatedData);
      res.json(siteSetting);
    } catch (error) {
      res.status(400).json({ message: "Invalid site setting data" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const products = await storage.getProducts();
      const orders = await storage.getOrders();
      const messages = await storage.getMessages();
      
      const stats = {
        totalRevenue: orders.reduce((sum, order) => sum + parseFloat(order.totalAmount), 0),
        totalOrders: orders.length,
        activeProducts: products.filter(p => p.status === 'active').length,
        unreadMessages: messages.filter(m => !m.isRead).length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Object Storage Routes
  // Serve public assets
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (for uploaded images) - with ACL enforcement
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // Check if the user has permission to access this object
      // No userId is provided since this is an unauthenticated route
      // This means only public objects will be accessible
      const hasAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        // userId is intentionally omitted for unauthenticated requests
        // This allows public objects but denies private ones
      });

      if (!hasAccess) {
        console.warn(`Access denied to object: ${req.path}`);
        return res.status(403).json({ error: "Access denied" });
      }

      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for new image - secured endpoint
  app.post("/api/objects/upload", async (req, res) => {
    // Basic security check - require admin API key for uploads
    const adminApiKey = process.env.ADMIN_API_KEY || "dev-admin-key-2024"; // Development fallback
    if (!adminApiKey) {
      console.error("ADMIN_API_KEY not configured - upload endpoint disabled for security");
      return res.status(503).json({ error: "Upload service unavailable - not configured" });
    }

    const providedKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!providedKey || providedKey !== adminApiKey) {
      console.warn(`Unauthorized upload attempt from ${req.ip}`);
      return res.status(401).json({ error: "Unauthorized - Admin API key required" });
    }

    // Rate limiting - simple in-memory protection
    const clientIp = req.ip;
    const now = Date.now();
    const rateLimitKey = `upload_${clientIp}`;
    const rateLimitWindow = 60 * 1000; // 1 minute
    const maxRequests = 10;

    // Simple rate limiting (in production, use Redis or proper rate limiting)
    if (!global.uploadRateLimit) {
      global.uploadRateLimit = new Map<string, number[]>();
    }

    const requests = global.uploadRateLimit.get(rateLimitKey) || [];
    const recentRequests = requests.filter((time: number) => now - time < rateLimitWindow);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: "Too many requests - try again later" });
    }

    recentRequests.push(now);
    global.uploadRateLimit.set(rateLimitKey, recentRequests);

    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Set ACL policy for uploaded image - secured endpoint
  app.put("/api/objects/finalize", async (req, res) => {
    // Basic security check - require admin API key for finalize
    const adminApiKey = process.env.ADMIN_API_KEY || "dev-admin-key-2024"; // Development fallback
    if (!adminApiKey) {
      console.error("ADMIN_API_KEY not configured - finalize endpoint disabled for security");
      return res.status(503).json({ error: "Finalize service unavailable - not configured" });
    }

    const providedKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!providedKey || providedKey !== adminApiKey) {
      console.warn(`Unauthorized finalize attempt from ${req.ip}`);
      return res.status(401).json({ error: "Unauthorized - Admin API key required" });
    }

    // Enhanced input validation
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { imageURL, visibility = "public", owner = "system" } = req.body;

    if (!imageURL || typeof imageURL !== 'string' || imageURL.trim() === '') {
      return res.status(400).json({ error: "imageURL is required and must be a non-empty string" });
    }

    // Validate visibility setting
    if (!['public', 'private'].includes(visibility)) {
      return res.status(400).json({ error: "visibility must be either 'public' or 'private'" });
    }

    // Validate owner
    if (!owner || typeof owner !== 'string' || owner.trim() === '') {
      return res.status(400).json({ error: "owner is required and must be a non-empty string" });
    }

    // Rate limiting - reuse the same mechanism as upload
    const clientIp = req.ip;
    const now = Date.now();
    const rateLimitKey = `finalize_${clientIp}`;
    const rateLimitWindow = 60 * 1000; // 1 minute
    const maxRequests = 20; // Higher limit since finalize is usually called after upload

    if (!global.finalizeRateLimit) {
      global.finalizeRateLimit = new Map<string, number[]>();
    }

    const requests = global.finalizeRateLimit.get(rateLimitKey) || [];
    const recentRequests = requests.filter((time: number) => now - time < rateLimitWindow);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: "Too many requests - try again later" });
    }

    recentRequests.push(now);
    global.finalizeRateLimit.set(rateLimitKey, recentRequests);

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(imageURL.trim());

      // Set ACL policy with validated parameters
      await objectStorageService.trySetObjectEntityAclPolicy(imageURL.trim(), {
        owner: owner.trim(),
        visibility: visibility as "public" | "private",
      });

      res.status(200).json({
        objectPath: objectPath,
        url: objectPath,
        visibility: visibility,
        owner: owner.trim()
      });
    } catch (error) {
      console.error("Error finalizing image upload:", error);
      
      // Don't expose internal error details to client
      if (error instanceof Error && error.message && error.message.includes("Object not found")) {
        return res.status(404).json({ error: "Object not found" });
      }
      
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
