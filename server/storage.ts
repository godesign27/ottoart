import { 
  type User, 
  type InsertUser,
  type UpsertUser,
  type Favorite,
  type InsertFavorite,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type UserSubscription,
  type InsertUserSubscription,
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
  type ContactSettings,
  type InsertContactSettings,
  type SocialSettings,
  type InsertSocialSettings,
  type RoomBackground,
  type InsertRoomBackground,
  type ArtWallSimulation,
  type InsertArtWallSimulation,
  type GalleryItem,
  type InsertGalleryItem,
  type Event,
  type InsertEvent,
  type CartItem,
  type InsertCartItem,
  type CommissionRequest,
  type InsertCommissionRequest,
  type Board,
  type InsertBoard,
  type BoardItem,
  type InsertBoardItem,
  type BoardStar,
  type InsertBoardStar,
  users,
  subscriptionPlans,
  userSubscriptions,
  products,
  categories,
  tags,
  orders,
  messages,
  siteSettings,
  pageSettings,
  bioSettings,
  contactSettings,
  socialSettings,
  roomBackgrounds,
  artWallSimulations,
  galleryItems,
  events,
  cartItems,
  favorites,
  commissionRequests,
  boards,
  boardItems,
  boardStars
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users (updated for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>; // Required for Replit Auth
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Favorites
  getUserFavorites(userId: string): Promise<Product[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, productId: string): Promise<boolean>;
  isFavorite(userId: string, productId: string): Promise<boolean>;

  // Subscription Plans
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined>;
  deleteSubscriptionPlan(id: string): Promise<boolean>;

  // User Subscriptions
  getUserSubscriptions(userId: string): Promise<UserSubscription[]>;
  getUserActiveSubscription(userId: string): Promise<UserSubscription | undefined>;
  getUserSubscription(id: string): Promise<UserSubscription | undefined>;
  getUserSubscriptionByPlan(userId: string, planId: string): Promise<UserSubscription | undefined>;
  getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined>;
  getAllUserSubscriptions(): Promise<(UserSubscription & { userEmail: string })[]>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined>;
  updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<UserSubscription | undefined>;
  cancelUserSubscription(id: string): Promise<UserSubscription | undefined>;

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
  getOrdersByEmail(email: string): Promise<Order[]>;
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

  // Contact Settings
  getContactSettings(): Promise<ContactSettings | undefined>;
  setContactSettings(settings: InsertContactSettings): Promise<ContactSettings>;

  // Social Settings
  getSocialSettings(): Promise<SocialSettings | undefined>;
  setSocialSettings(settings: InsertSocialSettings): Promise<SocialSettings>;

  // Gallery Items
  getGalleryItems(): Promise<GalleryItem[]>;
  getGalleryItem(id: string): Promise<GalleryItem | undefined>;
  createGalleryItem(item: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: string, item: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: string): Promise<boolean>;
  reorderGalleryItems(itemIds: string[]): Promise<GalleryItem[]>;

  // Events
  getEvents(): Promise<Event[]>;
  getPublishedEvents(): Promise<Event[]>;
  getFeaturedEvent(): Promise<Event | undefined>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;

  // Room Backgrounds
  getRoomBackgrounds(): Promise<RoomBackground[]>;
  getRoomBackground(id: string): Promise<RoomBackground | undefined>;
  createRoomBackground(background: InsertRoomBackground): Promise<RoomBackground>;
  updateRoomBackground(id: string, background: Partial<InsertRoomBackground>): Promise<RoomBackground | undefined>;
  deleteRoomBackground(id: string): Promise<boolean>;

  // Art Wall Simulations
  getArtWallSimulations(): Promise<ArtWallSimulation[]>;
  getArtWallSimulation(id: string): Promise<ArtWallSimulation | undefined>;
  createArtWallSimulation(simulation: InsertArtWallSimulation): Promise<ArtWallSimulation>;
  updateArtWallSimulation(id: string, simulation: Partial<InsertArtWallSimulation>): Promise<ArtWallSimulation | undefined>;
  deleteArtWallSimulation(id: string): Promise<boolean>;

  // Cart
  getCartItems(sessionId: string): Promise<CartItem[]>;
  getCartItem(id: string): Promise<CartItem | undefined>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, item: Partial<InsertCartItem>): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;

  // Commission Requests
  getCommissionRequests(): Promise<CommissionRequest[]>;
  getCommissionRequest(id: string): Promise<CommissionRequest | undefined>;
  createCommissionRequest(request: InsertCommissionRequest): Promise<CommissionRequest>;
  updateCommissionRequest(id: string, request: Partial<InsertCommissionRequest>): Promise<CommissionRequest | undefined>;
  markCommissionAsRead(id: string): Promise<boolean>;
  deleteCommissionRequest(id: string): Promise<boolean>;

  // Boards
  getBoards(): Promise<Board[]>;
  getBoard(id: string): Promise<Board | undefined>;
  getBoardBySlug(slug: string): Promise<Board | undefined>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: string): Promise<boolean>;

  // Board Items
  getBoardItems(boardId: string): Promise<(BoardItem & { product: Product })[]>;
  addBoardItem(item: InsertBoardItem): Promise<BoardItem>;
  removeBoardItem(id: string): Promise<boolean>;
  updateBoardItemOrder(id: string, sortOrder: number): Promise<boolean>;

  // Board Stars
  getBoardStars(boardId: string): Promise<(BoardStar & { product: Product })[]>;
  addBoardStar(star: InsertBoardStar): Promise<BoardStar>;
  removeBoardStar(boardId: string, productId: string, curatorEmail: string): Promise<boolean>;
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
      
      // Initialize default room backgrounds for art wall simulator
      const defaultRoomBackgrounds = [
        {
          name: "Modern Living Room",
          description: "Clean, minimalist living room with white walls perfect for displaying artwork",
          imageUrl: "/@assets/generated_images/Modern_living_room_wall_5fce4eb6.png",
          roomType: "living_room",
          wallColor: "#ffffff",
          isDefault: true,
          isActive: true,
          sortOrder: 0,
        },
        {
          name: "Cozy Bedroom",
          description: "Warm bedroom interior with light beige walls, perfect for personal artwork",
          imageUrl: "/@assets/generated_images/Cozy_bedroom_wall_668ce526.png",
          roomType: "bedroom",
          wallColor: "#f5f5dc",
          isDefault: false,
          isActive: true,
          sortOrder: 1,
        },
        {
          name: "Professional Office",
          description: "Clean office space with bright natural lighting, ideal for inspirational artwork",
          imageUrl: "/@assets/generated_images/Professional_office_wall_830e1e42.png",
          roomType: "office",
          wallColor: "#ffffff",
          isDefault: false,
          isActive: true,
          sortOrder: 2,
        },
        {
          name: "Elegant Dining Room",
          description: "Sophisticated dining room with soft gray walls, perfect for classic artwork",
          imageUrl: "/@assets/generated_images/Elegant_dining_room_wall_4bb31147.png",
          roomType: "dining_room",
          wallColor: "#d3d3d3",
          isDefault: false,
          isActive: true,
          sortOrder: 3,
        },
      ];

      await db.insert(roomBackgrounds).values(defaultRoomBackgrounds);
      
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

  // Replit Auth upsert method - creates or updates user
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Favorites methods
  async getUserFavorites(userId: string): Promise<Product[]> {
    const userFavorites = await db
      .select({
        product: products,
      })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .where(eq(favorites.userId, userId));
    
    return userFavorites.map(f => f.product);
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, productId: string): Promise<boolean> {
    const result = await db.delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
    return (result.rowCount || 0) > 0;
  }

  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const [favorite] = await db.select().from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
    return !!favorite;
  }

  // Subscription Plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans)
      .where(eq(subscriptionPlans.status, "active"))
      .orderBy(subscriptionPlans.displayOrder);
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan || undefined;
  }

  async getSubscriptionPlanBySlug(slug: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, slug));
    return plan || undefined;
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const planData = {
      ...insertPlan,
      features: (insertPlan.features as string[]) || []
    } as typeof subscriptionPlans.$inferInsert;
    const [plan] = await db.insert(subscriptionPlans).values(planData).returning();
    return plan;
  }

  async updateSubscriptionPlan(id: string, updateData: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan | undefined> {
    const cleanUpdateData: any = {
      updatedAt: new Date()
    };
    
    // Copy all fields except array fields that need special handling
    Object.keys(updateData).forEach(key => {
      const value = (updateData as any)[key];
      if (key === 'features') {
        cleanUpdateData[key] = value || [];
      } else {
        cleanUpdateData[key] = value;
      }
    });
    
    const [plan] = await db.update(subscriptionPlans)
      .set(cleanUpdateData)
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return plan || undefined;
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    const result = await db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User Subscriptions
  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.createdAt));
  }

  async getUserActiveSubscription(userId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions)
      .where(and(eq(userSubscriptions.userId, userId), eq(userSubscriptions.status, "active")))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    return subscription || undefined;
  }

  async getUserSubscription(id: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions).where(eq(userSubscriptions.id, id));
    return subscription || undefined;
  }

  async getUserSubscriptionByPlan(userId: string, planId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions)
      .where(and(
        eq(userSubscriptions.userId, userId),
        eq(userSubscriptions.planId, planId)
      ))
      .orderBy(desc(userSubscriptions.createdAt))
      .limit(1);
    return subscription || undefined;
  }

  async getUserSubscriptionByStripeId(stripeSubscriptionId: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription || undefined;
  }

  async getAllUserSubscriptions(): Promise<(UserSubscription & { userEmail: string })[]> {
    const result = await db.select({
      id: userSubscriptions.id,
      createdAt: userSubscriptions.createdAt,
      updatedAt: userSubscriptions.updatedAt,
      userId: userSubscriptions.userId,
      status: userSubscriptions.status,
      planId: userSubscriptions.planId,
      stripeSubscriptionId: userSubscriptions.stripeSubscriptionId,
      stripeCustomerId: userSubscriptions.stripeCustomerId,
      currentPeriodStart: userSubscriptions.currentPeriodStart,
      currentPeriodEnd: userSubscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: userSubscriptions.cancelAtPeriodEnd,
      userEmail: users.email
    })
    .from(userSubscriptions)
    .leftJoin(users, eq(userSubscriptions.userId, users.id))
    .orderBy(desc(userSubscriptions.createdAt));
    
    return result as (UserSubscription & { userEmail: string })[];
  }

  async createUserSubscription(insertSubscription: InsertUserSubscription): Promise<UserSubscription> {
    const [subscription] = await db.insert(userSubscriptions).values(insertSubscription).returning();
    return subscription;
  }

  async updateUserSubscription(id: string, updateData: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const cleanUpdateData: any = {
      updatedAt: new Date()
    };
    
    // Copy all fields, no array fields in user subscriptions
    Object.keys(updateData).forEach(key => {
      cleanUpdateData[key] = (updateData as any)[key];
    });
    
    const [subscription] = await db.update(userSubscriptions)
      .set(cleanUpdateData)
      .where(eq(userSubscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  async updateSubscriptionStatus(stripeSubscriptionId: string, status: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.update(userSubscriptions)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning();
    return subscription || undefined;
  }

  async cancelUserSubscription(id: string): Promise<UserSubscription | undefined> {
    const [subscription] = await db.update(userSubscriptions)
      .set({ 
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return subscription || undefined;
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
    return await db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(desc(products.createdAt));
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

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.customerEmail, email))
      .orderBy(desc(orders.createdAt));
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
      bioContent: insertSettings.bioContent,
      bioImage: insertSettings.bioImage,
      heroData: insertSettings.heroData as any,
      ctaData: insertSettings.ctaData as any
    }).returning();
    return settings;
  }

  // Contact Settings - Singleton pattern
  async getContactSettings(): Promise<ContactSettings | undefined> {
    const [settings] = await db.select().from(contactSettings).orderBy(desc(contactSettings.updatedAt)).limit(1);
    return settings || undefined;
  }

  async setContactSettings(insertSettings: InsertContactSettings): Promise<ContactSettings> {
    // Always delete existing records and insert new one to maintain singleton
    await db.delete(contactSettings);
    
    const [settings] = await db.insert(contactSettings).values({
      getInTouchText: insertSettings.getInTouchText,
      contactInfo: insertSettings.contactInfo as any,
      studioHours: insertSettings.studioHours as any,
      commissionsText: insertSettings.commissionsText
    }).returning();
    return settings;
  }

  // Social Settings - Singleton pattern
  async getSocialSettings(): Promise<SocialSettings | undefined> {
    const [settings] = await db.select().from(socialSettings).orderBy(desc(socialSettings.updatedAt)).limit(1);
    return settings || undefined;
  }

  async setSocialSettings(insertSettings: InsertSocialSettings): Promise<SocialSettings> {
    // Always delete existing records and insert new one to maintain singleton
    await db.delete(socialSettings);
    
    const [settings] = await db.insert(socialSettings).values({
      instagram: insertSettings.instagram,
      twitter: insertSettings.twitter,
      facebook: insertSettings.facebook,
      linkedin: insertSettings.linkedin,
      youtube: insertSettings.youtube,
      tiktok: insertSettings.tiktok,
      pinterest: insertSettings.pinterest,
      showInHeader: insertSettings.showInHeader,
      showInFooter: insertSettings.showInFooter,
      openInNewTab: insertSettings.openInNewTab,
      socialSharing: insertSettings.socialSharing,
      metaDescription: insertSettings.metaDescription,
      ogImage: insertSettings.ogImage,
      twitterCard: insertSettings.twitterCard
    }).returning();
    return settings;
  }

  // Cart
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    return await db.select().from(cartItems)
      .where(eq(cartItems.sessionId, sessionId))
      .orderBy(desc(cartItems.createdAt));
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

  async clearCart(sessionId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
    return (result.rowCount ?? 0) >= 0; // Returns true even if cart was already empty
  }

  // Gallery Items
  async getGalleryItems(): Promise<GalleryItem[]> {
    return await db.select().from(galleryItems).orderBy(galleryItems.sortOrder, desc(galleryItems.createdAt));
  }

  async getGalleryItem(id: string): Promise<GalleryItem | undefined> {
    const [item] = await db.select().from(galleryItems).where(eq(galleryItems.id, id));
    return item || undefined;
  }

  async createGalleryItem(insertItem: InsertGalleryItem): Promise<GalleryItem> {
    const [item] = await db.insert(galleryItems).values({
      ...insertItem,
      sortOrder: insertItem.sortOrder ?? 0
    }).returning();
    return item;
  }

  async updateGalleryItem(id: string, updateData: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined> {
    const [item] = await db.update(galleryItems)
      .set(updateData)
      .where(eq(galleryItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteGalleryItem(id: string): Promise<boolean> {
    const result = await db.delete(galleryItems).where(eq(galleryItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async reorderGalleryItems(itemIds: string[]): Promise<GalleryItem[]> {
    // Update sort order for each item
    const updatePromises = itemIds.map((id, index) =>
      db.update(galleryItems)
        .set({ sortOrder: index })
        .where(eq(galleryItems.id, id))
    );
    
    await Promise.all(updatePromises);
    
    // Return updated items
    return await this.getGalleryItems();
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(events.sortOrder, desc(events.createdAt));
  }

  async getPublishedEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isPublished, true)).orderBy(events.sortOrder, events.startDate);
  }

  async getFeaturedEvent(): Promise<Event | undefined> {
    const [event] = await db.select().from(events)
      .where(and(eq(events.isPublished, true), eq(events.isFeatured, true)))
      .orderBy(events.startDate)
      .limit(1);
    return event || undefined;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values({
      ...insertEvent,
      sortOrder: insertEvent.sortOrder ?? 0
    }).returning();
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events)
      .set(updateData)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Room Backgrounds
  async getRoomBackgrounds(): Promise<RoomBackground[]> {
    return await db.select().from(roomBackgrounds).orderBy(roomBackgrounds.sortOrder, roomBackgrounds.roomType);
  }

  async getRoomBackground(id: string): Promise<RoomBackground | undefined> {
    const [background] = await db.select().from(roomBackgrounds).where(eq(roomBackgrounds.id, id));
    return background || undefined;
  }

  async createRoomBackground(insertBackground: InsertRoomBackground): Promise<RoomBackground> {
    const [background] = await db.insert(roomBackgrounds).values(insertBackground).returning();
    return background;
  }

  async updateRoomBackground(id: string, updateData: Partial<InsertRoomBackground>): Promise<RoomBackground | undefined> {
    const [background] = await db.update(roomBackgrounds)
      .set(updateData)
      .where(eq(roomBackgrounds.id, id))
      .returning();
    return background || undefined;
  }

  async deleteRoomBackground(id: string): Promise<boolean> {
    const result = await db.delete(roomBackgrounds).where(eq(roomBackgrounds.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Art Wall Simulations
  async getArtWallSimulations(): Promise<ArtWallSimulation[]> {
    return await db.select().from(artWallSimulations).orderBy(desc(artWallSimulations.createdAt));
  }

  async getArtWallSimulation(id: string): Promise<ArtWallSimulation | undefined> {
    const [simulation] = await db.select().from(artWallSimulations).where(eq(artWallSimulations.id, id));
    return simulation || undefined;
  }

  async createArtWallSimulation(insertSimulation: InsertArtWallSimulation): Promise<ArtWallSimulation> {
    const [simulation] = await db.insert(artWallSimulations).values({
      name: insertSimulation.name,
      roomBackgroundId: insertSimulation.roomBackgroundId,
      artworks: insertSimulation.artworks as any,
      isPublic: insertSimulation.isPublic,
      userId: insertSimulation.userId
    }).returning();
    return simulation;
  }

  async updateArtWallSimulation(id: string, updateData: Partial<InsertArtWallSimulation>): Promise<ArtWallSimulation | undefined> {
    const updateObject: any = { ...updateData };
    if (updateData.artworks) {
      updateObject.artworks = updateData.artworks as any;
    }
    
    const [simulation] = await db.update(artWallSimulations)
      .set(updateObject)
      .where(eq(artWallSimulations.id, id))
      .returning();
    return simulation || undefined;
  }

  async deleteArtWallSimulation(id: string): Promise<boolean> {
    const result = await db.delete(artWallSimulations).where(eq(artWallSimulations.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Commission Requests
  async getCommissionRequests(): Promise<CommissionRequest[]> {
    return await db.select().from(commissionRequests).orderBy(desc(commissionRequests.createdAt));
  }

  async getCommissionRequest(id: string): Promise<CommissionRequest | undefined> {
    const [request] = await db.select().from(commissionRequests).where(eq(commissionRequests.id, id));
    return request || undefined;
  }

  async createCommissionRequest(insertRequest: InsertCommissionRequest): Promise<CommissionRequest> {
    const [request] = await db.insert(commissionRequests).values(insertRequest).returning();
    return request;
  }

  async updateCommissionRequest(id: string, updateData: Partial<InsertCommissionRequest>): Promise<CommissionRequest | undefined> {
    const [request] = await db.update(commissionRequests)
      .set(updateData)
      .where(eq(commissionRequests.id, id))
      .returning();
    return request || undefined;
  }

  async markCommissionAsRead(id: string): Promise<boolean> {
    const result = await db.update(commissionRequests)
      .set({ isRead: true })
      .where(eq(commissionRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteCommissionRequest(id: string): Promise<boolean> {
    const result = await db.delete(commissionRequests).where(eq(commissionRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Boards
  async getBoards(): Promise<Board[]> {
    return await db.select().from(boards).orderBy(desc(boards.createdAt));
  }

  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board || undefined;
  }

  async getBoardBySlug(slug: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.slug, slug));
    return board || undefined;
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const [board] = await db.insert(boards).values(insertBoard).returning();
    return board;
  }

  async updateBoard(id: string, updateData: Partial<InsertBoard>): Promise<Board | undefined> {
    const [board] = await db.update(boards)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(boards.id, id))
      .returning();
    return board || undefined;
  }

  async deleteBoard(id: string): Promise<boolean> {
    const result = await db.delete(boards).where(eq(boards.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board Items
  async getBoardItems(boardId: string): Promise<(BoardItem & { product: Product })[]> {
    const items = await db.select().from(boardItems).where(eq(boardItems.boardId, boardId)).orderBy(boardItems.sortOrder);
    const result: (BoardItem & { product: Product })[] = [];
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        result.push({ ...item, product });
      }
    }
    return result;
  }

  async addBoardItem(item: InsertBoardItem): Promise<BoardItem> {
    const [boardItem] = await db.insert(boardItems).values(item).returning();
    return boardItem;
  }

  async removeBoardItem(id: string): Promise<boolean> {
    const result = await db.delete(boardItems).where(eq(boardItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateBoardItemOrder(id: string, sortOrder: number): Promise<boolean> {
    const result = await db.update(boardItems).set({ sortOrder }).where(eq(boardItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Board Stars
  async getBoardStars(boardId: string): Promise<(BoardStar & { product: Product })[]> {
    const stars = await db.select().from(boardStars).where(eq(boardStars.boardId, boardId)).orderBy(desc(boardStars.createdAt));
    const result: (BoardStar & { product: Product })[] = [];
    for (const star of stars) {
      const [product] = await db.select().from(products).where(eq(products.id, star.productId));
      if (product) {
        result.push({ ...star, product });
      }
    }
    return result;
  }

  async addBoardStar(star: InsertBoardStar): Promise<BoardStar> {
    const [boardStar] = await db.insert(boardStars).values(star).returning();
    return boardStar;
  }

  async removeBoardStar(boardId: string, productId: string, curatorEmail: string): Promise<boolean> {
    const result = await db.delete(boardStars).where(
      and(eq(boardStars.boardId, boardId), eq(boardStars.productId, productId), eq(boardStars.curatorEmail, curatorEmail))
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
