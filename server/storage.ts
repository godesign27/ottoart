import { 
  type User, 
  type InsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Tag,
  type InsertTag,
  type Order,
  type InsertOrder,
  type Message,
  type InsertMessage,
  type SiteSettings,
  type InsertSiteSettings,
  type PageSettings,
  type InsertPageSettings,
  type BioSettings,
  type InsertBioSettings,
  type CartItem,
  type InsertCartItem,
  users,
  products,
  categories,
  tags,
  orders,
  messages,
  siteSettings,
  pageSettings,
  bioSettings,
  cartItems
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  reorderCategories(categoryIds: string[]): Promise<Category[]>;

  // Tags
  getTags(): Promise<Tag[]>;
  getTag(id: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Messages
  getMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<boolean>;

  // Site Settings
  getSiteSettings(): Promise<SiteSettings[]>;
  getSiteSetting(key: string): Promise<SiteSettings | undefined>;
  setSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings>;

  // Page Settings
  getPageSettings(): Promise<PageSettings[]>;
  getPageSetting(page: string): Promise<PageSettings | undefined>;
  setPageSetting(setting: InsertPageSettings): Promise<PageSettings>;

  // Bio Settings
  getBioSettings(): Promise<BioSettings | undefined>;
  setBioSettings(settings: InsertBioSettings): Promise<BioSettings>;

  // Cart
  getCartItems(): Promise<CartItem[]>;
  getCartItem(id: string): Promise<CartItem | undefined>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, item: Partial<InsertCartItem>): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      // Check if data already exists
      const existingCategories = await db.select().from(categories).limit(1);
      if (existingCategories.length > 0) {
        return; // Data already initialized
      }

      // Initialize default categories
      const defaultCategories = [
        {
          name: "Originals",
          description: "Original paintings and canvas works",
          slug: "originals",
          isActive: true,
          isFeatured: true,
          sortOrder: 0,
        },
        {
          name: "Art Prints",
          description: "High-quality reproduction prints",
          slug: "art-prints",
          isActive: true,
          isFeatured: false,
          sortOrder: 1,
        },
        {
          name: "Accessories",
          description: "Art-related accessories and items",
          slug: "accessories",
          isActive: true,
          isFeatured: false,
          sortOrder: 2,
        },
      ];

      const insertedCategories = await db.insert(categories).values(defaultCategories).returning();
      
      // Initialize default page settings
      const defaultPages: Array<"bio" | "gallery" | "events" | "cv" | "contact"> = ["bio", "gallery", "events", "cv", "contact"];
      const defaultPageSettings = defaultPages.map(page => ({
        page,
        enabled: page !== "contact", // Contact disabled by default
      }));
      
      await db.insert(pageSettings).values(defaultPageSettings);
      
      console.log("✅ Database initialized with default data");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const productData = {
      ...insertProduct,
      tags: (insertProduct.tags as string[]) || [],
      images: (insertProduct.images as string[]) || [],
      pricingTiers: (insertProduct.pricingTiers as any[]) || []
    } as typeof products.$inferInsert;
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const cleanUpdateData: any = {
      updatedAt: new Date()
    };
    
    // Copy all fields except array fields that need special handling
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (key === 'tags' || key === 'images' || key === 'pricingTiers') {
        cleanUpdateData[key] = value || [];
      } else {
        cleanUpdateData[key] = value;
      }
    });
    
    const [product] = await db.update(products)
      .set(cleanUpdateData)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isFeatured, true));
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.sortOrder);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    return category || undefined;
  }

  async reorderCategories(categoryIds: string[]): Promise<Category[]> {
    // Update each category's sortOrder based on its position in the array
    for (let i = 0; i < categoryIds.length; i++) {
      await db.update(categories)
        .set({ sortOrder: i })
        .where(eq(categories.id, categoryIds[i]));
    }
    
    // Return the updated categories in the new order
    return await this.getCategories();
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags).orderBy(tags.name);
  }

  async getTag(id: string): Promise<Tag | undefined> {
    const [tag] = await db.select().from(tags).where(eq(tags.id, id));
    return tag || undefined;
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const [tag] = await db.insert(tags).values(insertTag).returning();
    return tag;
  }

  async updateTag(id: string, updateData: Partial<InsertTag>): Promise<Tag | undefined> {
    const [tag] = await db.update(tags)
      .set(updateData)
      .where(eq(tags.id, id))
      .returning();
    return tag || undefined;
  }

  async deleteTag(id: string): Promise<boolean> {
    const result = await db.delete(tags).where(eq(tags.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const orderData = {
      ...insertOrder,
      items: (insertOrder.items as Array<{productId: string, quantity: number, price: number}>) || []
    } as typeof orders.$inferInsert;
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const cleanUpdateData: any = {
      updatedAt: new Date()
    };
    
    // Copy all fields except array fields that need special handling
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (key === 'items') {
        cleanUpdateData[key] = value || [];
      } else {
        cleanUpdateData[key] = value;
      }
    });
    
    const [order] = await db.update(orders)
      .set(cleanUpdateData)
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.createdAt));
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSettings[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSettings | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async setSiteSetting(insertSetting: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSetting(insertSetting.key);
    
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({ value: insertSetting.value, updatedAt: new Date() })
        .where(eq(siteSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [setting] = await db.insert(siteSettings).values(insertSetting).returning();
      return setting;
    }
  }

  // Page Settings
  async getPageSettings(): Promise<PageSettings[]> {
    return await db.select().from(pageSettings);
  }

  async getPageSetting(page: string): Promise<PageSettings | undefined> {
    const [setting] = await db.select().from(pageSettings).where(eq(pageSettings.page, page as "home" | "bio" | "gallery" | "events" | "cv" | "contact"));
    return setting || undefined;
  }

  async setPageSetting(insertSetting: InsertPageSettings): Promise<PageSettings> {
    const existing = await this.getPageSetting(insertSetting.page);
    
    if (existing) {
      const [updated] = await db.update(pageSettings)
        .set({ enabled: insertSetting.enabled, updatedAt: new Date() })
        .where(eq(pageSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [setting] = await db.insert(pageSettings).values(insertSetting).returning();
      return setting;
    }
  }

  // Bio Settings - Singleton pattern
  async getBioSettings(): Promise<BioSettings | undefined> {
    const [settings] = await db.select().from(bioSettings).orderBy(desc(bioSettings.updatedAt)).limit(1);
    return settings || undefined;
  }

  async setBioSettings(insertSettings: InsertBioSettings): Promise<BioSettings> {
    // Always delete existing records and insert new one to maintain singleton
    await db.delete(bioSettings);
    
    const [settings] = await db.insert(bioSettings).values({
      heroData: insertSettings.heroData as any,
      ctaData: insertSettings.ctaData as any
    }).returning();
    return settings;
  }

  // Cart
  async getCartItems(): Promise<CartItem[]> {
    return await db.select().from(cartItems).orderBy(desc(cartItems.createdAt));
  }

  async getCartItem(id: string): Promise<CartItem | undefined> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id));
    return item || undefined;
  }

  async addToCart(insertItem: InsertCartItem): Promise<CartItem> {
    const [item] = await db.insert(cartItems).values(insertItem).returning();
    return item;
  }

  async updateCartItem(id: string, updateData: Partial<InsertCartItem>): Promise<CartItem | undefined> {
    const [item] = await db.update(cartItems)
      .set(updateData)
      .where(eq(cartItems.id, id))
      .returning();
    return item || undefined;
  }

  async removeFromCart(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(): Promise<boolean> {
    const result = await db.delete(cartItems);
    return (result.rowCount ?? 0) >= 0; // Returns true even if cart was already empty
  }
}

export const storage = new DatabaseStorage();
