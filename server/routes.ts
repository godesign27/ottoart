import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema, insertTagSchema, insertOrderSchema, insertMessageSchema, insertPageSettingsSchema, insertBioSettingsSchema, insertContactSettingsSchema, insertSiteSettingsSchema, insertCartItemSchema, insertGalleryItemSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

// Initialize Stripe only if the secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not configured - payment features will be disabled');
}

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

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const order = await storage.updateOrderStatus(id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(400).json({ message: "Failed to update order status" });
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

  // Gallery Items
  app.get("/api/gallery", async (req, res) => {
    try {
      const galleryItems = await storage.getGalleryItems();
      res.json(galleryItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery items" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const galleryItem = await storage.getGalleryItem(req.params.id);
      if (!galleryItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }
      res.json(galleryItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery item" });
    }
  });

  app.post("/api/gallery", async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.parse(req.body);
      const galleryItem = await storage.createGalleryItem(validatedData);
      res.status(201).json(galleryItem);
    } catch (error) {
      console.error("Gallery item validation error:", error);
      res.status(400).json({ 
        message: "Invalid gallery item data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/gallery/:id", async (req, res) => {
    try {
      const validatedData = insertGalleryItemSchema.partial().parse(req.body);
      const galleryItem = await storage.updateGalleryItem(req.params.id, validatedData);
      if (!galleryItem) {
        return res.status(404).json({ message: "Gallery item not found" });
      }
      res.json(galleryItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid gallery item data" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const success = await storage.deleteGalleryItem(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Gallery item not found" });
      }
      res.json({ message: "Gallery item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery item" });
    }
  });

  app.post("/api/gallery/reorder", async (req, res) => {
    try {
      const { itemIds } = req.body;
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ message: "itemIds must be an array" });
      }
      const galleryItems = await storage.reorderGalleryItems(itemIds);
      res.json(galleryItems);
    } catch (error) {
      console.error("Failed to reorder gallery items:", error);
      res.status(400).json({ message: "Failed to reorder gallery items" });
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

  // Bio Settings
  app.get("/api/bio-settings", async (req, res) => {
    try {
      const bioSettings = await storage.getBioSettings();
      res.json(bioSettings || {
        heroData: {
          headline: "Art That Moves You",
          description: "I don't just create pieces—I build experiences that spark curiosity, boldness, and reflection. This is more than art on a wall—it's energy you can feel every time you walk by.",
          backgroundImage: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&h=800"
        },
        ctaData: {
          enabled: true,
          headline: "From Vision to Canvas—Made Just for You",
          description: "I don't just create pieces—I build experiences that spark curiosity, boldness, and reflection. This is more than art on a wall—it's energy you can feel every time you walk by.",
          buttonText: "Claim Your Artwork",
          buttonUrl: "/contact",
          backgroundImage: ""
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bio settings" });
    }
  });

  app.put("/api/bio-settings", async (req, res) => {
    try {
      const validatedData = insertBioSettingsSchema.parse(req.body);
      const bioSettings = await storage.setBioSettings(validatedData);
      res.json(bioSettings);
    } catch (error) {
      console.error("Bio settings validation error:", error);
      res.status(400).json({ message: "Invalid bio settings data" });
    }
  });

  // Contact Settings
  app.get("/api/contact-settings", async (req, res) => {
    try {
      const contactSettings = await storage.getContactSettings();
      res.json(contactSettings || {
        getInTouchText: "I'd love to hear from you! Whether you're interested in commissioning a piece, purchasing artwork, or collaborating on a project, please don't hesitate to reach out.",
        contactInfo: {
          email: "hello@ottoart.com",
          phone: "(555) 123-4567",
          address: "123 Artist Lane, Chicago, IL 60601"
        },
        studioHours: {
          monday: "9:00 AM - 6:00 PM",
          tuesday: "9:00 AM - 6:00 PM",
          wednesday: "9:00 AM - 6:00 PM",
          thursday: "9:00 AM - 6:00 PM",
          friday: "9:00 AM - 6:00 PM",
          saturday: "10:00 AM - 4:00 PM",
          sunday: "By appointment only"
        },
        commissionsText: "I accept commissioned work and am always excited to discuss custom pieces. Please include details about your vision, preferred size, timeline, and budget. I typically respond to inquiries within 24-48 hours."
      });
    } catch (error) {
      console.error("Contact settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch contact settings" });
    }
  });

  app.put("/api/contact-settings", async (req, res) => {
    try {
      const validatedData = insertContactSettingsSchema.parse(req.body);
      const contactSettings = await storage.setContactSettings(validatedData);
      res.json(contactSettings);
    } catch (error) {
      console.error("Contact settings validation error:", error);
      res.status(400).json({ message: "Invalid contact settings data" });
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

  // Cart
  app.get("/api/cart", async (req, res) => {
    try {
      const cartItems = await storage.getCartItems();
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedData = insertCartItemSchema.parse(req.body);
      const cartItem = await storage.addToCart(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ message: "Cart item removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove cart item" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const cartItemId = req.params.id;
      const updateData = insertCartItemSchema.partial().parse(req.body);
      const updatedItem = await storage.updateCartItem(cartItemId, updateData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.delete("/api/cart", async (req, res) => {
    try {
      const success = await storage.clearCart();
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Stripe Payment Routes
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      // Check if Stripe is configured
      if (!stripe) {
        return res.status(503).json({ 
          message: "Payment processing is not configured. Please contact support." 
        });
      }
      
      const { customerInfo } = req.body;
      
      // SECURITY: Get cart items from server storage, not client
      const cartItems = await storage.getCartItems();
      
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      // SECURITY: Validate each cart item and recalculate total from actual product prices
      let serverCalculatedTotal = 0;
      const validatedItems = [];
      
      for (const cartItem of cartItems) {
        const product = await storage.getProduct(cartItem.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${cartItem.productId} not found` });
        }
        if (product.status !== 'active') {
          return res.status(400).json({ message: `Product ${product.name} is not available` });
        }
        
        // Use actual product price, not client-supplied price
        const actualPrice = parseFloat(product.price);
        serverCalculatedTotal += actualPrice * cartItem.quantity;
        
        validatedItems.push({
          productId: cartItem.productId,
          productName: product.name,
          quantity: cartItem.quantity,
          unitPrice: actualPrice,
          totalPrice: actualPrice * cartItem.quantity
        });
      }
      
      // Convert to cents and ensure it's an integer
      const amountInCents = Math.round(serverCalculatedTotal * 100);
      
      if (amountInCents <= 0) {
        return res.status(400).json({ message: "Invalid total amount" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          customerName: customerInfo?.customerName || "",
          customerEmail: customerInfo?.customerEmail || "",
          itemCount: validatedItems.length.toString(),
          serverCalculatedTotal: serverCalculatedTotal.toFixed(2),
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: serverCalculatedTotal,
        items: validatedItems
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
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
