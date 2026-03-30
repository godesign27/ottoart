import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import OpenAI from "openai";
import { Resend } from "resend";
import { storage } from "./storage";

// Initialize Resend for email notifications
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
import { insertProductSchema, insertCategorySchema, insertTagSchema, insertOrderSchema, insertMessageSchema, insertPageSettingsSchema, insertBioSettingsSchema, insertContactSettingsSchema, insertSocialSettingsSchema, insertRoomBackgroundSchema, insertArtWallSimulationSchema, insertSiteSettingsSchema, insertCartItemSchema, insertGalleryItemSchema, insertFavoriteSchema, insertSubscriptionPlanSchema, insertBoardSchema, insertBoardStarSchema, insertArtShowSchema, insertArtShowQrCodeSchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { setupAuth, isAuthenticated } from "./replitAuth";

// Initialize Stripe only if the secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  });
} else {
  console.warn('STRIPE_SECRET_KEY not configured - payment features will be disabled');
}

// Initialize OpenAI with Replit AI Integrations
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

// Type declarations for global rate limiting
declare global {
  var uploadRateLimit: Map<string, number[]> | undefined;
  var finalizeRateLimit: Map<string, number[]> | undefined;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication middleware - from blueprint:javascript_log_in_with_replit
  await setupAuth(app);

  // Authentication routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName } = req.body;
      
      // Only allow updating firstName and lastName (email and profileImageUrl come from auth provider)
      const updateData: Partial<InsertUser> = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      const user = await storage.updateUser(userId, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Favorites routes (protected)
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.body;
      const validatedData = insertFavoriteSchema.parse({
        userId,
        productId
      });
      const favorite = await storage.addFavorite(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(400).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:productId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const success = await storage.removeFavorite(userId, productId);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Favorite not found" });
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:productId/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { productId } = req.params;
      const isFavorite = await storage.isFavorite(userId, productId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Subscription Plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.get("/api/subscription-plans/slug/:slug", async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlanBySlug(req.params.slug);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan by slug:", error);
      res.status(500).json({ message: "Failed to fetch subscription plan" });
    }
  });

  app.get("/api/subscription-plans/:id", async (req, res) => {
    try {
      const plan = await storage.getSubscriptionPlan(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      res.status(500).json({ message: "Failed to fetch subscription plan" });
    }
  });

  app.post("/api/subscription-plans", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      
      // Create Stripe product and price if Stripe is configured
      let stripeProductId: string | undefined;
      let stripePriceId: string | undefined;
      
      if (stripe) {
        try {
          // Create Stripe product
          const stripeProduct = await stripe.products.create({
            name: validatedData.name,
            description: validatedData.description,
            metadata: {
              plan_slug: validatedData.slug,
            },
          });
          stripeProductId = stripeProduct.id;
          
          // Create Stripe price (monthly recurring)
          const stripePrice = await stripe.prices.create({
            unit_amount: Math.round(parseFloat(validatedData.price) * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            product: stripeProductId,
            metadata: {
              plan_slug: validatedData.slug,
            },
          });
          stripePriceId = stripePrice.id;
          
          console.log(`Created Stripe product ${stripeProductId} and price ${stripePriceId} for plan ${validatedData.name}`);
        } catch (stripeError) {
          console.error("Error creating Stripe product/price:", stripeError);
          // Continue without Stripe integration if it fails
        }
      }
      
      // Create the subscription plan with Stripe IDs
      const planData = {
        ...validatedData,
        ...(stripeProductId && { stripeProductId }),
        ...(stripePriceId && { stripePriceId }),
      };
      
      const plan = await storage.createSubscriptionPlan(planData);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(400).json({ 
        message: "Invalid subscription plan data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.put("/api/subscription-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
      const plan = await storage.updateSubscriptionPlan(req.params.id, validatedData);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(400).json({ message: "Invalid subscription plan data" });
    }
  });

  app.patch("/api/subscription-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
      const plan = await storage.updateSubscriptionPlan(req.params.id, validatedData);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(400).json({ message: "Invalid subscription plan data" });
    }
  });

  // Utility endpoint to fix existing subscription plans with missing Stripe configuration
  app.post("/api/subscription-plans/fix-stripe", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe not configured" });
      }

      const plans = await storage.getSubscriptionPlans();
      const plansToFix = plans.filter(plan => !plan.stripePriceId);
      
      const results = [];
      
      for (const plan of plansToFix) {
        try {
          // Create Stripe product
          const stripeProduct = await stripe.products.create({
            name: plan.name,
            description: plan.description,
            metadata: {
              plan_slug: plan.slug,
              plan_id: plan.id,
            },
          });
          
          // Create Stripe price (monthly recurring)
          const stripePrice = await stripe.prices.create({
            unit_amount: Math.round(parseFloat(plan.price) * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            product: stripeProduct.id,
            metadata: {
              plan_slug: plan.slug,
              plan_id: plan.id,
            },
          });
          
          // Update the subscription plan with Stripe IDs
          await storage.updateSubscriptionPlan(plan.id, {
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
          });
          
          results.push({
            planId: plan.id,
            planName: plan.name,
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
            status: 'success',
          });
          
          console.log(`Fixed Stripe configuration for plan ${plan.name} (${plan.id})`);
        } catch (stripeError) {
          console.error(`Error fixing plan ${plan.name}:`, stripeError);
          results.push({
            planId: plan.id,
            planName: plan.name,
            status: 'error',
            error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
          });
        }
      }
      
      res.json({
        message: `Processed ${plansToFix.length} subscription plans`,
        results,
      });
    } catch (error) {
      console.error("Error fixing subscription plans:", error);
      res.status(500).json({ 
        message: "Error fixing subscription plans",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.delete("/api/subscription-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteSubscriptionPlan(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      res.json({ message: "Subscription plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ message: "Failed to delete subscription plan" });
    }
  });

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

  app.get("/api/products/gallery", async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const galleryProducts = allProducts.filter(p => p.showInGallery && p.status === 'active');
      res.json(galleryProducts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery products" });
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

  app.post("/api/products/:id/duplicate", async (req, res) => {
    try {
      const original = await storage.getProduct(req.params.id);
      if (!original) {
        return res.status(404).json({ message: "Product not found" });
      }
      const { id, createdAt, updatedAt, sku, slug, ...rest } = original;
      const timestamp = Date.now();
      const duplicateData = {
        ...rest,
        name: `${original.name} (Copy)`,
        price: original.price ?? "0",
        status: "draft",
        sku: sku ? `${sku}-copy-${timestamp}` : null,
        slug: slug ? `${slug}-copy-${timestamp}` : null,
      };
      const newProduct = await storage.createProduct(duplicateData as any);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error("Duplicate product error:", error);
      res.status(500).json({ message: "Failed to duplicate product" });
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

      // Send email notification for new order using Resend
      const notifyEmail = process.env.NOTIFY_EMAIL || "ottoart27@gmail.com";
      
      if (resend) {
        try {
          const items = validatedData.items as Array<{ name: string; quantity: number; price: number }>;
          const itemsList = items.map((item: { name: string; quantity: number; price: number }) => 
            `<li>${item.name} x ${item.quantity} - $${(item.price * item.quantity / 100).toFixed(2)}</li>`
          ).join('');
          
          await resend.emails.send({
            from: 'Otto Art <hello@ottoart.app>',
            to: notifyEmail,
            subject: `New Order: $${(validatedData.total / 100).toFixed(2)}`,
            html: `
              <h2>New Order Received!</h2>
              <p><strong>Customer:</strong> ${validatedData.customerName}</p>
              <p><strong>Email:</strong> ${validatedData.customerEmail}</p>
              <h3>Items:</h3>
              <ul>${itemsList}</ul>
              <p><strong>Total:</strong> $${(validatedData.total / 100).toFixed(2)}</p>
              <hr>
              <h3>Shipping Address:</h3>
              <p>${validatedData.shippingAddress}</p>
              <hr>
              <p><em>View this order in your admin panel.</em></p>
            `
          });
        } catch (emailError) {
          console.error('Failed to send order notification email:', emailError);
        }
      }

      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  // User orders (protected route)
  app.get("/api/user/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userEmail = req.user.claims.email;
      const orders = await storage.getOrdersByEmail(userEmail);
      res.json(orders);
    } catch (error) {
      console.error("Failed to fetch user orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
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

      // Send email notification using Resend
      if (resend) {
        try {
          await resend.emails.send({
            from: 'Otto Art <hello@ottoart.app>',
            to: 'ottoart27@gmail.com',
            subject: validatedData.subject ? `Contact Form: ${validatedData.subject}` : "New Contact Form Inquiry",
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${validatedData.name}</p>
              <p><strong>Email:</strong> ${validatedData.email}</p>
              ${validatedData.subject ? `<p><strong>Subject:</strong> ${validatedData.subject}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p>${validatedData.message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><em>This message was sent via the Otto Art website contact form.</em></p>
            `
          });
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
          // Don't fail the whole request if Brevo fails
        }
      }

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

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/published", async (req, res) => {
    try {
      const events = await storage.getPublishedEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch published events" });
    }
  });

  app.get("/api/events/featured", async (req, res) => {
    try {
      const event = await storage.getFeaturedEvent();
      res.json(event || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured event" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const { insertEventSchema } = await import("@shared/schema");
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Failed to create event:", error);
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const { insertEventSchema } = await import("@shared/schema");
      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Failed to update event:", error);
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const success = await storage.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Commission Requests
  app.get("/api/commissions", async (req, res) => {
    try {
      const commissions = await storage.getCommissionRequests();
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commission requests" });
    }
  });

  app.get("/api/commissions/:id", async (req, res) => {
    try {
      const commission = await storage.getCommissionRequest(req.params.id);
      if (!commission) {
        return res.status(404).json({ message: "Commission request not found" });
      }
      res.json(commission);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch commission request" });
    }
  });

  app.post("/api/commissions", async (req, res) => {
    try {
      const { insertCommissionRequestSchema } = await import("@shared/schema");
      const validatedData = insertCommissionRequestSchema.parse(req.body);
      
      // Create commission request in database
      const commission = await storage.createCommissionRequest(validatedData);

      // Also create a message in the inbox
      const messageData = {
        name: validatedData.fullName,
        email: validatedData.email,
        subject: `Commission Request: ${validatedData.commissionType}`,
        message: `Commission Type: ${validatedData.commissionType}\nSize Preference: ${validatedData.sizePreference}\nBudget Range: ${validatedData.budgetRange}\nPreferred Contact: ${validatedData.preferredContact || 'Not specified'}\nPhone: ${validatedData.phone || 'Not provided'}\n\nVision:\n${validatedData.vision}${validatedData.referenceFileUrl ? `\n\nReference Image: ${validatedData.referenceFileUrl}` : ''}`
      };
      await storage.createMessage(messageData);

      // Send email notification using Resend
      const notifyEmail = process.env.NOTIFY_EMAIL || "ottoart27@gmail.com";
      if (resend) {
        try {
          // Send notification to owner
          console.log(`[Resend] Sending commission notification to: ${notifyEmail}`);
          const ownerResult = await resend.emails.send({
            from: 'Otto Art <hello@ottoart.app>',
            to: notifyEmail,
            subject: `New Commission Request: ${validatedData.commissionType}`,
            html: `
              <h2>New Commission Request</h2>
              <p><strong>Name:</strong> ${validatedData.fullName}</p>
              <p><strong>Email:</strong> ${validatedData.email}</p>
              ${validatedData.phone ? `<p><strong>Phone:</strong> ${validatedData.phone}</p>` : ''}
              <p><strong>Preferred Contact:</strong> ${validatedData.preferredContact || 'Not specified'}</p>
              <hr>
              <p><strong>Commission Type:</strong> ${validatedData.commissionType}</p>
              <p><strong>Size Preference:</strong> ${validatedData.sizePreference}</p>
              <p><strong>Budget Range:</strong> ${validatedData.budgetRange}</p>
              <hr>
              <p><strong>Vision:</strong></p>
              <p>${validatedData.vision.replace(/\n/g, '<br>')}</p>
              ${validatedData.referenceFileUrl ? `<p><strong>Reference Image:</strong> <a href="${validatedData.referenceFileUrl}">View Image</a></p>` : ''}
              <hr>
              <p><em>This commission request was submitted via the Otto Art website.</em></p>
            `
          });
          console.log(`[Resend] Owner notification result:`, JSON.stringify(ownerResult));

          // Send confirmation email to the user
          console.log(`[Resend] Sending confirmation to customer: ${validatedData.email}`);
          const customerResult = await resend.emails.send({
            from: 'Otto Art <hello@ottoart.app>',
            to: validatedData.email,
            subject: "Commission request received",
            html: `
              <h2>Thank you for your commission request!</h2>
              <p>Hi ${validatedData.fullName},</p>
              <p>I've received your commission request for <strong>${validatedData.commissionType}</strong> and I'm excited to learn more about your vision.</p>
              <p>I'll review your request and get back to you within <strong>48 hours</strong>.</p>
              <p>In the meantime, feel free to explore more of my work at <a href="https://ottoart.app">ottoart.app</a>.</p>
              <p>Looking forward to creating something special together!</p>
              <p>Best,<br>Otto</p>
            `
          });
          console.log(`[Resend] Customer confirmation result:`, JSON.stringify(customerResult));
        } catch (emailError: any) {
          console.error('[Resend] Failed to send commission emails:', emailError?.message || emailError);
        }
      } else {
        console.log('[Resend] Resend not initialized - RESEND_API_KEY may be missing');
      }

      res.status(201).json(commission);
    } catch (error) {
      console.error("Failed to create commission request:", error);
      res.status(400).json({ message: "Invalid commission request data" });
    }
  });

  app.put("/api/commissions/:id", async (req, res) => {
    try {
      const { insertCommissionRequestSchema } = await import("@shared/schema");
      const validatedData = insertCommissionRequestSchema.partial().parse(req.body);
      const commission = await storage.updateCommissionRequest(req.params.id, validatedData);
      if (!commission) {
        return res.status(404).json({ message: "Commission request not found" });
      }
      res.json(commission);
    } catch (error) {
      console.error("Failed to update commission request:", error);
      res.status(400).json({ message: "Invalid commission request data" });
    }
  });

  app.put("/api/commissions/:id/read", async (req, res) => {
    try {
      const success = await storage.markCommissionAsRead(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Commission request not found" });
      }
      res.json({ message: "Commission marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark commission as read" });
    }
  });

  app.delete("/api/commissions/:id", async (req, res) => {
    try {
      const success = await storage.deleteCommissionRequest(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Commission request not found" });
      }
      res.json({ message: "Commission request deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete commission request" });
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
          email: "ottoart27@gmail.com",
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

  // Social Settings
  app.get("/api/social-settings", async (req, res) => {
    try {
      const socialSettings = await storage.getSocialSettings();
      res.json(socialSettings || {
        instagram: "https://instagram.com/ottoart",
        twitter: "https://twitter.com/ottoart", 
        facebook: "https://facebook.com/ottoart",
        linkedin: "https://linkedin.com/in/ottoart",
        youtube: "",
        tiktok: "",
        pinterest: "",
        showInHeader: true,
        showInFooter: true,
        openInNewTab: true,
        socialSharing: true,
        metaDescription: "Contemporary artist specializing in abstract paintings and mixed media works.",
        ogImage: "",
        twitterCard: "summary_large_image"
      });
    } catch (error) {
      console.error("Social settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch social settings" });
    }
  });

  app.put("/api/social-settings", async (req, res) => {
    try {
      const validatedData = insertSocialSettingsSchema.parse(req.body);
      const socialSettings = await storage.setSocialSettings(validatedData);
      res.json(socialSettings);
    } catch (error) {
      console.error("Social settings validation error:", error);
      res.status(400).json({ message: "Invalid social settings data" });
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

  // Cart - uses x-cart-session header for per-visitor cart isolation
  app.get("/api/cart", async (req, res) => {
    try {
      const sessionId = req.headers['x-cart-session'] as string;
      if (!sessionId) {
        return res.json([]); // Return empty cart if no session
      }
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const sessionId = req.headers['x-cart-session'] as string;
      if (!sessionId) {
        return res.status(400).json({ message: "Cart session required" });
      }
      const validatedData = insertCartItemSchema.parse({ ...req.body, sessionId });
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
      const sessionId = req.headers['x-cart-session'] as string;
      if (!sessionId) {
        return res.status(400).json({ message: "Cart session required" });
      }
      const success = await storage.clearCart(sessionId);
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Newsletter subscription schema
  const newsletterSchema = z.object({
    email: z.string().email("Invalid email format"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });

  // Newsletter Subscription
  app.post("/api/newsletter-subscription", async (req, res) => {
    try {
      // Validate request body with Zod
      const validationResult = newsletterSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: validationResult.error.issues
        });
      }

      const { email, firstName, lastName } = validationResult.data;

      // Check if Brevo API key is configured
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (!brevoApiKey) {
        console.error('BREVO_API_KEY not configured');
        return res.status(500).json({ message: "Newsletter service not configured" });
      }

      // Get the default mailing list ID from environment or use a fallback
      const brevoListId = process.env.BREVO_LIST_ID;

      // Prepare contact data for Brevo
      const contactData: any = {
        email: email.trim().toLowerCase(),
        updateEnabled: true,
        emailBlacklisted: false,
      };

      // Add attributes if provided
      if (firstName || lastName) {
        contactData.attributes = {};
        if (firstName) contactData.attributes.FIRSTNAME = firstName.trim();
        if (lastName) contactData.attributes.LASTNAME = lastName.trim();
      }

      // Add to mailing list if configured
      if (brevoListId) {
        const listIdNum = parseInt(brevoListId);
        if (!isNaN(listIdNum)) {
          contactData.listIds = [listIdNum];
        }
      }

      // Send to Brevo API
      const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'api-key': brevoApiKey,
        },
        body: JSON.stringify(contactData),
      });

      if (brevoResponse.ok) {
        // Send notification email for new subscriber using Resend
        if (resend) {
          const notifyEmail = process.env.NOTIFY_EMAIL || "ottoart27@gmail.com";
          try {
            await resend.emails.send({
              from: 'Otto Art <hello@ottoart.app>',
              to: notifyEmail,
              subject: "New Newsletter Subscriber",
              html: `
                <h2>New Newsletter Subscriber!</h2>
                <p><strong>Email:</strong> ${email}</p>
                ${firstName ? `<p><strong>First Name:</strong> ${firstName}</p>` : ''}
                ${lastName ? `<p><strong>Last Name:</strong> ${lastName}</p>` : ''}
                <hr>
                <p><em>This person just joined your mailing list.</em></p>
              `
            });
          } catch (emailError) {
            console.error('Failed to send subscriber notification email:', emailError);
          }
        }
        
        res.status(201).json({ message: "Successfully subscribed to newsletter" });
      } else if (brevoResponse.status === 409) {
        // Contact already exists - need to ensure they're added to the list if specified
        if (brevoListId) {
          const listIdNum = parseInt(brevoListId);
          if (!isNaN(listIdNum)) {
            try {
              const addToListResponse = await fetch(`https://api.brevo.com/v3/contacts/lists/${listIdNum}/contacts/add`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'api-key': brevoApiKey,
                },
                body: JSON.stringify({
                  emails: [email.trim().toLowerCase()]
                }),
              });
              
              if (addToListResponse.ok || addToListResponse.status === 409) {
                // Successfully added to list or already in list
                res.status(200).json({ message: "Successfully subscribed to newsletter" });
              } else {
                console.error('Failed to add existing contact to list:', addToListResponse.status);
                res.status(500).json({ message: "Failed to subscribe to newsletter" });
              }
            } catch (listError) {
              console.error('Error adding contact to list:', listError);
              res.status(500).json({ message: "Failed to subscribe to newsletter" });
            }
          } else {
            res.status(200).json({ message: "Successfully subscribed to newsletter" });
          }
        } else {
          res.status(200).json({ message: "Successfully subscribed to newsletter" });
        }
      } else {
        const errorData = await brevoResponse.json().catch(() => null);
        console.error('Brevo API error:', brevoResponse.status, errorData);
        res.status(500).json({ message: "Failed to subscribe to newsletter" });
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      res.status(500).json({ message: "Failed to subscribe to newsletter" });
    }
  });

  // Get Brevo contact lists (development/admin endpoint)
  app.get("/api/admin/brevo-lists", async (req, res) => {
    // Restrict to development environment for security
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ message: "Not found" });
    }

    try {
      const brevoApiKey = process.env.BREVO_API_KEY;
      if (!brevoApiKey) {
        return res.status(500).json({ message: "Brevo API key not configured" });
      }

      const brevoResponse = await fetch('https://api.brevo.com/v3/contacts/lists', {
        method: 'GET',
        headers: {
          'api-key': brevoApiKey,
          'accept': 'application/json',
        },
      });

      if (brevoResponse.ok) {
        const data = await brevoResponse.json();
        res.json({
          lists: data.lists?.map((list: any) => ({
            id: list.id,
            name: list.name,
            totalSubscribers: list.totalSubscribers || 0
          })) || [],
          currentListId: process.env.BREVO_LIST_ID || null
        });
      } else {
        const errorData = await brevoResponse.json().catch(() => null);
        console.error('Brevo lists API error:', brevoResponse.status, errorData);
        res.status(500).json({ message: "Failed to fetch Brevo lists" });
      }
    } catch (error) {
      console.error('Brevo lists fetch error:', error);
      res.status(500).json({ message: "Failed to fetch Brevo lists" });
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

  // Room Backgrounds
  app.get("/api/room-backgrounds", async (req, res) => {
    try {
      const backgrounds = await storage.getRoomBackgrounds();
      res.json(backgrounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room backgrounds" });
    }
  });

  app.get("/api/room-backgrounds/:id", async (req, res) => {
    try {
      const background = await storage.getRoomBackground(req.params.id);
      if (!background) {
        return res.status(404).json({ message: "Room background not found" });
      }
      res.json(background);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch room background" });
    }
  });

  app.post("/api/room-backgrounds", async (req, res) => {
    try {
      const validatedData = insertRoomBackgroundSchema.parse(req.body);
      const background = await storage.createRoomBackground(validatedData);
      res.status(201).json(background);
    } catch (error) {
      res.status(400).json({ message: "Invalid room background data" });
    }
  });

  app.put("/api/room-backgrounds/:id", async (req, res) => {
    try {
      const validatedData = insertRoomBackgroundSchema.parse(req.body);
      const background = await storage.updateRoomBackground(req.params.id, validatedData);
      if (!background) {
        return res.status(404).json({ message: "Room background not found" });
      }
      res.json(background);
    } catch (error) {
      res.status(400).json({ message: "Invalid room background data" });
    }
  });

  app.delete("/api/room-backgrounds/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRoomBackground(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Room background not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room background" });
    }
  });

  // Art Wall Simulations
  app.get("/api/art-wall-simulations", async (req, res) => {
    try {
      const simulations = await storage.getArtWallSimulations();
      res.json(simulations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch art wall simulations" });
    }
  });

  app.get("/api/art-wall-simulations/:id", async (req, res) => {
    try {
      const simulation = await storage.getArtWallSimulation(req.params.id);
      if (!simulation) {
        return res.status(404).json({ message: "Art wall simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch art wall simulation" });
    }
  });

  app.post("/api/art-wall-simulations", async (req, res) => {
    try {
      const validatedData = insertArtWallSimulationSchema.parse(req.body);
      const simulation = await storage.createArtWallSimulation(validatedData);
      res.status(201).json(simulation);
    } catch (error) {
      console.error("Art wall simulation creation error:", error);
      res.status(400).json({ message: "Invalid art wall simulation data" });
    }
  });

  app.put("/api/art-wall-simulations/:id", async (req, res) => {
    try {
      const validatedData = insertArtWallSimulationSchema.parse(req.body);
      const simulation = await storage.updateArtWallSimulation(req.params.id, validatedData);
      if (!simulation) {
        return res.status(404).json({ message: "Art wall simulation not found" });
      }
      res.json(simulation);
    } catch (error) {
      console.error("Art wall simulation update error:", error);
      res.status(400).json({ message: "Invalid art wall simulation data" });
    }
  });

  app.delete("/api/art-wall-simulations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteArtWallSimulation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Art wall simulation not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete art wall simulation" });
    }
  });

  // Stripe subscription endpoints - from blueprint:javascript_stripe
  
  // Create subscription for a plan
  app.post("/api/create-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing unavailable" });
      }

      // Get subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Validate that plan has Stripe configuration
      if (!plan.stripePriceId) {
        return res.status(400).json({ message: "Subscription plan is not configured for payments" });
      }

      // Check if user already has a subscription to this plan (active or pending)
      const existingSubscription = await storage.getUserSubscriptionByPlan(userId, planId);
      if (existingSubscription && ['active', 'pending', 'incomplete'].includes(existingSubscription.status)) {
        return res.status(400).json({ 
          message: "User already has a subscription to this plan",
          existingSubscription: {
            id: existingSubscription.id,
            status: existingSubscription.status
          }
        });
      }

      // Get or create Stripe customer
      let stripeCustomerId = existingSubscription?.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const user = await storage.getUser(userId);
        const customer = await stripe.customers.create({
          email: user?.email || '',
          metadata: {
            userId: userId,
          },
        });
        stripeCustomerId = customer.id;
      }

      // Create Stripe subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: plan.stripePriceId || '',
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      // Create user subscription record
      const userSubscription = await storage.createUserSubscription({
        userId,
        planId,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId,
        status: 'pending',
        currentPeriodStart: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
      });

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        userSubscriptionId: userSubscription.id,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // Get user subscriptions
  app.get("/api/user-subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error: any) {
      console.error("Error fetching user subscriptions:", error);
      res.status(500).json({ message: "Error fetching subscriptions" });
    }
  });

  // Get all user subscriptions for admin
  app.get("/api/user-subscriptions/all", isAuthenticated, async (req: any, res) => {
    try {
      const subscriptions = await storage.getAllUserSubscriptions();
      res.json(subscriptions);
    } catch (error: any) {
      console.error("Error fetching all user subscriptions:", error);
      res.status(500).json({ message: "Error fetching all subscriptions" });
    }
  });

  // Cancel subscription
  app.post("/api/cancel-subscription/:userSubscriptionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { userSubscriptionId } = req.params;
      
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing unavailable" });
      }

      // Get user subscription
      const userSubscription = await storage.getUserSubscription(userSubscriptionId);
      if (!userSubscription || userSubscription.userId !== userId) {
        return res.status(404).json({ message: "Subscription not found" });
      }

      // Cancel at period end in Stripe
      const stripeSubscription = await stripe.subscriptions.update(
        userSubscription.stripeSubscriptionId!,
        { cancel_at_period_end: true }
      );

      // Update user subscription
      await storage.updateUserSubscription(userSubscriptionId, {
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      });

      res.json({ 
        message: "Subscription will be cancelled at period end",
        cancelAt: new Date(stripeSubscription.current_period_end * 1000),
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Error cancelling subscription: " + error.message });
    }
  });

  // Create Stripe Checkout Session for subscription
  app.post("/api/checkout/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { planId } = req.body;
      
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing unavailable" });
      }

      // Get subscription plan
      const plan = await storage.getSubscriptionPlan(planId);
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }
      
      // Validate that plan has Stripe configuration
      if (!plan.stripePriceId) {
        return res.status(400).json({ message: "Subscription plan is not configured for payments" });
      }

      // Check if user already has a subscription to this plan (active or pending)
      const existingSubscription = await storage.getUserSubscriptionByPlan(userId, planId);
      if (existingSubscription && ['active', 'pending', 'incomplete'].includes(existingSubscription.status)) {
        return res.status(400).json({ 
          message: "User already has a subscription to this plan",
          existingSubscription: {
            id: existingSubscription.id,
            status: existingSubscription.status
          }
        });
      }

      // Get user info for customer creation
      const user = await storage.getUser(userId);
      
      // Build base URL more reliably
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || req.get('host');
      const baseUrl = `${protocol}://${host}`;
      
      // Create Stripe Checkout Session
      console.log("Creating checkout session with baseUrl:", baseUrl);
      console.log("Success URL will be:", `${baseUrl}/mail-club/success?session_id={CHECKOUT_SESSION_ID}`);
      console.log("Cancel URL will be:", `${baseUrl}/mail-club`);
      
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: plan.stripePriceId,
          quantity: 1,
        }],
        success_url: `${baseUrl}/mail-club/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/mail-club`,
        customer_email: user?.email || '',
        metadata: {
          userId: userId,
          planId: planId,
          planName: plan.name,
        },
        subscription_data: {
          metadata: {
            userId: userId,
            planId: planId,
            planName: plan.name,
          },
        },
      });
      
      console.log("Created session with URL:", session.url);

      res.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
    }
  });

  // Stripe webhook handler - requires raw body for signature verification
  app.post("/api/stripe-webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripe || !endpointSecret) {
      return res.status(400).send('Webhook Error: Missing configuration');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as any;
          if (invoice.subscription) {
            // Update subscription status to active
            const userSubscription = await storage.getUserSubscriptionByStripeId(invoice.subscription);
            if (userSubscription) {
              await storage.updateUserSubscription(userSubscription.id, {
                status: 'active',
                updatedAt: new Date(),
              });
            }
          }
          break;
          
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as any;
          if (failedInvoice.subscription) {
            // Update subscription status to past_due
            const userSubscription = await storage.getUserSubscriptionByStripeId(failedInvoice.subscription);
            if (userSubscription) {
              await storage.updateUserSubscription(userSubscription.id, {
                status: 'past_due',
                updatedAt: new Date(),
              });
            }
          }
          break;
          
        case 'customer.subscription.updated':
          const subscription = event.data.object as any;
          const userSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
          if (userSubscription) {
            await storage.updateUserSubscription(userSubscription.id, {
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: new Date(),
            });
          }
          break;
          
        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as any;
          const deletedUserSubscription = await storage.getUserSubscriptionByStripeId(deletedSubscription.id);
          if (deletedUserSubscription) {
            await storage.updateUserSubscription(deletedUserSubscription.id, {
              status: 'cancelled',
              updatedAt: new Date(),
            });
          }
          break;

        case 'checkout.session.completed':
          const session = event.data.object as any;
          
          // Only handle subscription checkouts
          if (session.mode === 'subscription' && session.subscription) {
            const { userId, planId } = session.metadata;
            
            if (userId && planId) {
              // Get the subscription from Stripe to get current period info
              const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
              
              // Create user subscription record
              await storage.createUserSubscription({
                userId,
                planId,
                stripeSubscriptionId: session.subscription,
                stripeCustomerId: session.customer,
                status: stripeSubscription.status,
                currentPeriodStart: stripeSubscription.current_period_start 
                  ? new Date(stripeSubscription.current_period_start * 1000) 
                  : null,
                currentPeriodEnd: stripeSubscription.current_period_end 
                  ? new Date(stripeSubscription.current_period_end * 1000) 
                  : null,
              });
              
              console.log(`Created subscription for user ${userId} on plan ${planId}`);
            }
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  });

  // Certificate of Authenticity email endpoint
  app.post('/api/certificates/send', async (req, res) => {
    try {
      const { artistName, artworkTitle, medium, dimensions, year, edition, buyerName, buyerEmail, saleDate, certNumber } = req.body;

      if (!buyerEmail) {
        return res.status(400).json({ message: "Buyer email is required" });
      }

      if (!resend) {
        return res.status(503).json({ message: "Email service not configured" });
      }

      const formattedDate = saleDate
        ? new Date(saleDate + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "";

      const artistLine = artistName ? `<p style="margin:4px 0 0;font-size:13px;color:#9ca3af;letter-spacing:0.05em;">by ${artistName}</p>` : '';

      const detailRows = [
        medium && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;width:120px;">Medium</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${medium}</td></tr>`,
        dimensions && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Dimensions</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${dimensions}</td></tr>`,
        year && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Year</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${year}</td></tr>`,
        edition && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Edition</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${edition}</td></tr>`,
        buyerName && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Acquired by</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${buyerName}</td></tr>`,
        formattedDate && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Date</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${formattedDate}</td></tr>`,
        certNumber && `<tr><td style="padding:6px 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;">Certificate No.</td><td style="padding:6px 0;font-size:13px;color:#1f2937;">${certNumber}</td></tr>`,
      ].filter(Boolean).join('');

      await resend.emails.send({
        from: 'Otto Art <hello@ottoart.app>',
        to: buyerEmail,
        subject: `Certificate of Authenticity — ${artworkTitle || 'Your Artwork'}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="margin:0;padding:0;background:#f5f4f1;font-family:Georgia,'Times New Roman',serif;">
            <div style="max-width:600px;margin:40px auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">

              <!-- Decorative top bar -->
              <div style="height:4px;background:linear-gradient(90deg,#c9b99a,#e9e3d8,#c9b99a);"></div>

              <div style="padding:48px 56px;">
                <!-- Header -->
                <div style="text-align:center;margin-bottom:32px;">
                  <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#9ca3af;font-family:sans-serif;">Otto Art</p>
                  <div style="display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
                    <div style="height:1px;width:50px;background:#d1c7b4;display:inline-block;vertical-align:middle;"></div>
                    <span style="color:#c9b99a;font-size:16px;margin:0 12px;vertical-align:middle;">✦</span>
                    <div style="height:1px;width:50px;background:#d1c7b4;display:inline-block;vertical-align:middle;"></div>
                  </div>
                  <h1 style="margin:0;font-size:26px;font-weight:normal;letter-spacing:0.06em;color:#1f2937;">Certificate of Authenticity</h1>
                  <div style="height:1px;background:#d1c7b4;margin:20px auto 0;width:180px;"></div>
                </div>

                <!-- Statement -->
                <p style="text-align:center;font-size:14px;color:#6b7280;line-height:1.8;margin:0 0 32px;font-family:sans-serif;">
                  This document certifies that the work described below is an original creation${artistName ? ` by ${artistName}` : ''} and is genuine and authentic.
                </p>

                <!-- Artwork box -->
                <div style="background:#faf9f7;border:1px solid #e9e3d8;border-radius:4px;padding:28px 32px;margin-bottom:28px;">
                  <div style="text-align:center;margin-bottom:20px;border-bottom:1px solid #e9e3d8;padding-bottom:16px;">
                    <p style="margin:0;font-size:22px;font-weight:bold;color:#111827;">${artworkTitle || 'Untitled'}</p>
                    ${artistLine}
                  </div>
                  <table style="width:100%;border-collapse:collapse;">
                    ${detailRows}
                  </table>
                </div>

                <!-- Signature area -->
                <div style="display:table;width:100%;margin-top:32px;">
                  <div style="display:table-cell;width:50%;padding-right:16px;vertical-align:bottom;">
                    <div style="border-top:1px solid #6b7280;padding-top:8px;">
                      <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;font-family:sans-serif;">Artist Signature</p>
                      ${artistName ? `<p style="margin:4px 0 0;font-size:13px;color:#4b5563;font-family:sans-serif;">${artistName}</p>` : ''}
                    </div>
                  </div>
                  <div style="display:table-cell;width:50%;padding-left:16px;vertical-align:bottom;">
                    <div style="border-top:1px solid #6b7280;padding-top:8px;">
                      <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;font-family:sans-serif;">Date</p>
                      <p style="margin:4px 0 0;font-size:13px;color:#4b5563;font-family:sans-serif;">${formattedDate || '&nbsp;'}</p>
                    </div>
                  </div>
                </div>

                <!-- Footer -->
                <div style="text-align:center;margin-top:40px;padding-top:24px;border-top:1px solid #e9e3d8;">
                  <p style="margin:0;font-size:11px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;font-family:sans-serif;">ottoart.app</p>
                </div>
              </div>

              <!-- Bottom bar -->
              <div style="height:4px;background:linear-gradient(90deg,#c9b99a,#e9e3d8,#c9b99a);"></div>
            </div>
          </body>
          </html>
        `,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Certificate email error:", error);
      res.status(500).json({ message: "Failed to send certificate" });
    }
  });

  // AI Social Post Generator endpoint
  app.post('/api/posts/generate', async (req, res) => {
    try {
      const { product, platforms } = req.body;
      if (!product || !platforms || !platforms.length) {
        return res.status(400).json({ message: "Product and platforms are required" });
      }

      const productInfo = [
        `Title: ${product.name}`,
        product.medium ? `Medium: ${product.medium}` : null,
        product.dimensions ? `Dimensions: ${product.dimensions}` : null,
        product.year ? `Year: ${product.year}` : null,
        product.rarity ? `Edition: ${product.rarity}` : null,
        product.price ? `Price: $${product.price}` : null,
        product.description ? `Description: ${product.description}` : null,
      ].filter(Boolean).join("\n");

      const platformSpecs: Record<string, string> = {
        instagram: "Instagram (max 2,200 chars, visual storytelling tone, 20-30 hashtags grouped at the end, emojis welcome, warm and personal artist voice)",
        twitter: "Twitter/X (max 260 chars including hashtags, punchy and concise, 3-5 hashtags inline, no fluff)",
        facebook: "Facebook (max 500 chars, conversational and inviting, 3-5 hashtags, call to action like 'available now' or 'link in bio')",
        tiktok: "TikTok (max 150 chars caption, energetic and trendy, 5-8 hashtags, hook the viewer fast)",
        pinterest: "Pinterest (max 500 chars, descriptive and keyword-rich for search, 5-10 hashtags, focus on style/aesthetic/home decor context)",
      };

      const selectedSpecs = platforms
        .filter((p: string) => platformSpecs[p])
        .map((p: string) => `- ${platformSpecs[p]}`)
        .join("\n");

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a creative social media manager for an independent artist named Otto. Your writing is authentic, evocative, and artistically minded. You write posts that feel personal and genuine — never corporate. You tailor each post precisely to the platform's format and culture."
          },
          {
            role: "user",
            content: `Generate social media posts for this artwork:\n\n${productInfo}\n\nCreate a unique post for each of these platforms:\n${selectedSpecs}\n\nRespond ONLY with valid JSON in this format (include only the requested platforms as keys):\n{\n  "instagram": "...",\n  "twitter": "...",\n  "facebook": "...",\n  "tiktok": "...",\n  "pinterest": "..."\n}`
          }
        ],
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error("No content generated");
      res.json(JSON.parse(content));
    } catch (error) {
      console.error("Post generation error:", error);
      res.status(500).json({ message: "Failed to generate posts" });
    }
  });

  // AI Artwork Analysis endpoint
  app.post('/api/ai/analyze-artwork', async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert art curator and creative copywriter. Analyze artwork images and provide compelling titles and descriptions that capture the essence of the piece. Your writing should be sophisticated yet accessible, evocative, and designed to engage collectors and art enthusiasts. Focus on visual elements, emotional impact, technique, and artistic merit."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this artwork and provide:\n1. A compelling, artistic title (keep it concise, 2-6 words)\n2. A rich, engaging description (2-3 paragraphs) that captures the essence of the work, its visual impact, technique, and emotional resonance. Write in a voice that blends art curation with creative copywriting.\n\nRespond in this exact JSON format:\n{\n  \"title\": \"your title here\",\n  \"description\": \"your description here\"\n}"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 800,
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        return res.status(500).json({ message: "Failed to generate artwork analysis" });
      }

      // Parse the JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(500).json({ message: "Invalid response format from AI" });
      }

      const analysis = JSON.parse(jsonMatch[0]);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing artwork:", error);
      res.status(500).json({ message: "Failed to analyze artwork" });
    }
  });

  // ==================== BOARDS ====================

  // Get all boards (admin)
  app.get('/api/boards', async (req, res) => {
    try {
      const allBoards = await storage.getBoards();
      const boardsWithCounts = await Promise.all(allBoards.map(async (board) => {
        const items = await storage.getBoardItems(board.id);
        const stars = await storage.getBoardStars(board.id);
        return { ...board, itemCount: items.length, starCount: stars.length };
      }));
      res.json(boardsWithCounts);
    } catch (error) {
      console.error("Error fetching boards:", error);
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  // Create board
  app.post('/api/boards', async (req, res) => {
    try {
      const parsed = insertBoardSchema.parse(req.body);
      const board = await storage.createBoard(parsed);
      res.status(201).json(board);
    } catch (error) {
      console.error("Error creating board:", error);
      res.status(500).json({ message: "Failed to create board" });
    }
  });

  // Public board routes (must come before /api/boards/:id to avoid param matching)
  app.get('/api/boards/public/:slug', async (req, res) => {
    try {
      const board = await storage.getBoardBySlug(req.params.slug);
      if (!board || board.status !== 'active') {
        return res.status(404).json({ message: "Board not found" });
      }
      const items = await storage.getBoardItems(board.id);
      res.json({ board, items });
    } catch (error) {
      console.error("Error fetching public board:", error);
      res.status(500).json({ message: "Failed to fetch board" });
    }
  });

  app.post('/api/boards/public/:slug/star', async (req, res) => {
    try {
      const board = await storage.getBoardBySlug(req.params.slug);
      if (!board || board.status !== 'active') {
        return res.status(404).json({ message: "Board not found" });
      }
      const { productId, curatorName, curatorEmail, action } = req.body;
      if (!productId || !curatorName || !curatorEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (action === 'unstar') {
        await storage.removeBoardStar(board.id, productId, curatorEmail);
        res.json({ success: true, action: 'unstarred' });
      } else {
        const star = await storage.addBoardStar({
          boardId: board.id,
          productId,
          curatorName,
          curatorEmail,
        });
        res.json({ success: true, action: 'starred', star });
      }
    } catch (error) {
      console.error("Error starring board item:", error);
      res.status(500).json({ message: "Failed to star item" });
    }
  });

  app.get('/api/boards/public/:slug/stars', async (req, res) => {
    try {
      const board = await storage.getBoardBySlug(req.params.slug);
      if (!board || board.status !== 'active') {
        return res.status(404).json({ message: "Board not found" });
      }
      const stars = await storage.getBoardStars(board.id);
      res.json(stars);
    } catch (error) {
      console.error("Error fetching board stars:", error);
      res.status(500).json({ message: "Failed to fetch board stars" });
    }
  });

  // Get single board (admin)
  app.get('/api/boards/:id', async (req, res) => {
    try {
      const board = await storage.getBoard(req.params.id);
      if (!board) return res.status(404).json({ message: "Board not found" });
      res.json(board);
    } catch (error) {
      console.error("Error fetching board:", error);
      res.status(500).json({ message: "Failed to fetch board" });
    }
  });

  // Update board
  app.patch('/api/boards/:id', async (req, res) => {
    try {
      const board = await storage.updateBoard(req.params.id, req.body);
      if (!board) return res.status(404).json({ message: "Board not found" });
      res.json(board);
    } catch (error) {
      console.error("Error updating board:", error);
      res.status(500).json({ message: "Failed to update board" });
    }
  });

  // Delete board
  app.delete('/api/boards/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteBoard(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Board not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting board:", error);
      res.status(500).json({ message: "Failed to delete board" });
    }
  });

  // Get board items
  app.get('/api/boards/:id/items', async (req, res) => {
    try {
      const items = await storage.getBoardItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error fetching board items:", error);
      res.status(500).json({ message: "Failed to fetch board items" });
    }
  });

  // Add item to board
  app.post('/api/boards/:id/items', async (req, res) => {
    try {
      const item = await storage.addBoardItem({
        boardId: req.params.id,
        productId: req.body.productId,
        sortOrder: req.body.sortOrder || 0,
      });
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding board item:", error);
      res.status(500).json({ message: "Failed to add board item" });
    }
  });

  // Reorder board items
  app.put('/api/boards/:id/items/reorder', async (req, res) => {
    try {
      const { itemIds } = req.body;
      if (!Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ message: "itemIds must be a non-empty array" });
      }
      for (let i = 0; i < itemIds.length; i++) {
        await storage.updateBoardItemOrder(itemIds[i], i);
      }
      const items = await storage.getBoardItems(req.params.id);
      res.json(items);
    } catch (error) {
      console.error("Error reordering board items:", error);
      res.status(500).json({ message: "Failed to reorder board items" });
    }
  });

  // Remove item from board
  app.delete('/api/boards/:id/items/:itemId', async (req, res) => {
    try {
      const deleted = await storage.removeBoardItem(req.params.itemId);
      if (!deleted) return res.status(404).json({ message: "Board item not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing board item:", error);
      res.status(500).json({ message: "Failed to remove board item" });
    }
  });

  // Get board stars (admin)
  app.get('/api/boards/:id/stars', async (req, res) => {
    try {
      const stars = await storage.getBoardStars(req.params.id);
      res.json(stars);
    } catch (error) {
      console.error("Error fetching board stars:", error);
      res.status(500).json({ message: "Failed to fetch board stars" });
    }
  });

  // ===================== ART SHOWS (POS) =====================

  // Get all art shows (admin)
  app.get('/api/art-shows', async (req, res) => {
    try {
      const shows = await storage.getArtShows();
      res.json(shows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch art shows" });
    }
  });

  // Create art show (admin)
  app.post('/api/art-shows', async (req, res) => {
    try {
      const data = insertArtShowSchema.parse(req.body);
      const show = await storage.createArtShow(data);
      res.status(201).json(show);
    } catch (error) {
      res.status(400).json({ message: "Invalid art show data" });
    }
  });

  // Get single art show (admin)
  app.get('/api/art-shows/:id', async (req, res) => {
    try {
      const show = await storage.getArtShow(req.params.id);
      if (!show) return res.status(404).json({ message: "Art show not found" });
      res.json(show);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch art show" });
    }
  });

  // Update art show (admin)
  app.patch('/api/art-shows/:id', async (req, res) => {
    try {
      const show = await storage.updateArtShow(req.params.id, req.body);
      if (!show) return res.status(404).json({ message: "Art show not found" });
      res.json(show);
    } catch (error) {
      res.status(500).json({ message: "Failed to update art show" });
    }
  });

  // Delete art show (admin)
  app.delete('/api/art-shows/:id', async (req, res) => {
    try {
      const deleted = await storage.deleteArtShow(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Art show not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete art show" });
    }
  });

  // Get QR codes for a show (admin)
  app.get('/api/art-shows/:id/qr-codes', async (req, res) => {
    try {
      const codes = await storage.getArtShowQrCodes(req.params.id);
      res.json(codes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QR codes" });
    }
  });

  // Create QR code for a show (admin)
  app.post('/api/art-shows/:id/qr-codes', async (req, res) => {
    try {
      const data = insertArtShowQrCodeSchema.parse({ ...req.body, showId: req.params.id });
      const code = await storage.createArtShowQrCode(data);
      res.status(201).json(code);
    } catch (error) {
      res.status(400).json({ message: "Invalid QR code data" });
    }
  });

  // Update QR code (admin)
  app.patch('/api/art-shows/qr-codes/:codeId', async (req, res) => {
    try {
      const code = await storage.updateArtShowQrCode(req.params.codeId, req.body);
      if (!code) return res.status(404).json({ message: "QR code not found" });
      res.json(code);
    } catch (error) {
      res.status(500).json({ message: "Failed to update QR code" });
    }
  });

  // Delete QR code (admin)
  app.delete('/api/art-shows/qr-codes/:codeId', async (req, res) => {
    try {
      const deleted = await storage.deleteArtShowQrCode(req.params.codeId);
      if (!deleted) return res.status(404).json({ message: "QR code not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete QR code" });
    }
  });

  // Public: Get QR code info (for checkout page when customer scans)
  app.get('/api/pos/:codeId', async (req, res) => {
    try {
      const code = await storage.getArtShowQrCode(req.params.codeId);
      if (!code) return res.status(404).json({ message: "QR code not found" });
      const show = await storage.getArtShow(code.showId);
      if (!show || show.status !== 'active') return res.status(404).json({ message: "Art show not found or not active" });
      res.json({ ...code, show });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch QR code info" });
    }
  });

  // Public: Send receipt email after successful POS payment
  app.post('/api/pos/send-receipt', async (req, res) => {
    try {
      const { paymentIntentId, customerName, customerEmail, label, price, showName, artistName } = req.body;

      if (!customerEmail || !paymentIntentId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify the payment intent succeeded before sending receipt
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing not configured" });
      }

      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      } catch (e) {
        return res.status(400).json({ message: "Invalid payment intent" });
      }

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment has not succeeded" });
      }

      const amountFormatted = `$${(paymentIntent.amount / 100).toFixed(2)}`;
      const artistLine = artistName ? `<p style="margin:0;color:#6b7280;font-size:14px;">${artistName}</p>` : '';

      if (resend) {
        // Receipt to customer
        try {
          await resend.emails.send({
            from: 'Otto Art <hello@ottoart.app>',
            to: customerEmail,
            subject: `Your purchase receipt — ${amountFormatted}`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111827;">
                <h2 style="margin:0 0 4px;">Thank you, ${customerName}!</h2>
                <p style="margin:0 0 24px;color:#6b7280;">Your payment was successful.</p>

                <div style="background:#f9fafb;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
                  <p style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;">${showName || 'Art Show'}</p>
                  ${artistLine}
                  <p style="margin:8px 0 4px;font-weight:600;font-size:16px;">${label}</p>
                  <p style="margin:0;font-size:28px;font-weight:700;">${amountFormatted}</p>
                </div>

                <p style="color:#6b7280;font-size:14px;">If you have any questions about your purchase, please reply to this email.</p>
                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                <p style="color:#9ca3af;font-size:12px;margin:0;">Otto Art · Payment processed securely by Stripe</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send POS receipt to customer:', emailError);
        }

        // Notification to artist
        const notifyEmail = process.env.NOTIFY_EMAIL || 'ottoart27@gmail.com';
        try {
          await resend.emails.send({
            from: 'Otto Art <hello@ottoart.app>',
            to: notifyEmail,
            subject: `Art Show Sale — ${amountFormatted} from ${customerName}`,
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
                <h2>New Art Show Sale!</h2>
                <p><strong>Amount:</strong> ${amountFormatted}</p>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Item:</strong> ${label}</p>
                <p><strong>Show:</strong> ${showName || 'N/A'}</p>
                <p><strong>Payment ID:</strong> ${paymentIntentId}</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Failed to send POS sale notification to artist:', emailError);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('POS receipt error:', error);
      res.status(500).json({ message: "Failed to send receipt" });
    }
  });

  // Public: Create payment intent for POS checkout
  app.post('/api/pos/:codeId/payment-intent', async (req, res) => {
    try {
      if (!stripe) return res.status(503).json({ message: "Payment processing not configured" });
      const code = await storage.getArtShowQrCode(req.params.codeId);
      if (!code) return res.status(404).json({ message: "QR code not found" });
      const show = await storage.getArtShow(code.showId);
      if (!show || show.status !== 'active') return res.status(404).json({ message: "Art show not active" });

      const amountInCents = Math.round(parseFloat(code.price) * 100);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          qrCodeId: code.id,
          showId: show.id,
          showName: show.name,
          label: code.label,
          customerName: req.body.customerName || '',
          customerEmail: req.body.customerEmail || '',
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("POS payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
