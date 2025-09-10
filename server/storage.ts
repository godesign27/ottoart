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
  type InsertSiteSettings
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  // Messages
  getMessages(): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<boolean>;

  // Site Settings
  getSiteSettings(): Promise<SiteSettings[]>;
  getSiteSetting(key: string): Promise<SiteSettings | undefined>;
  setSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private categories: Map<string, Category> = new Map();
  private tags: Map<string, Tag> = new Map();
  private orders: Map<string, Order> = new Map();
  private messages: Map<string, Message> = new Map();
  private siteSettings: Map<string, SiteSettings> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize default categories
    const originals: Category = {
      id: randomUUID(),
      name: "Originals",
      description: "Original paintings and canvas works",
      slug: "originals",
      isActive: true,
      isFeatured: true,
      sortOrder: 0,
      createdAt: new Date(),
    };

    const prints: Category = {
      id: randomUUID(),
      name: "Art Prints",
      description: "High-quality reproduction prints",
      slug: "art-prints",
      isActive: true,
      isFeatured: false,
      sortOrder: 1,
      createdAt: new Date(),
    };

    const accessories: Category = {
      id: randomUUID(),
      name: "Accessories",
      description: "Art-related accessories and items",
      slug: "accessories",
      isActive: true,
      isFeatured: false,
      sortOrder: 2,
      createdAt: new Date(),
    };

    this.categories.set(originals.id, originals);
    this.categories.set(prints.id, prints);
    this.categories.set(accessories.id, accessories);

    // Initialize default products
    const products: Product[] = [
      {
        id: randomUUID(),
        name: "Abstract Harmony",
        description: "A vibrant exploration of color and form, this piece captures the dynamic energy of contemporary expression.",
        shortDescription: "Vibrant abstract painting with bold colors",
        price: "1200.00",
        categoryId: originals.id,
        sku: "ABS-001",
        status: "active",
        isFeatured: true,
        stock: 1,
        images: ["https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
        dimensions: "24\" × 36\"",
        medium: "Acrylic on Canvas",
        year: 2024,
        isOriginal: true,
        tags: ["abstract", "contemporary", "colorful"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Geometric Dreams",
        description: "Clean geometric forms meet bold color palettes in this striking contemporary composition.",
        shortDescription: "Contemporary geometric art",
        price: "85.00",
        categoryId: prints.id,
        sku: "GEO-001",
        status: "active",
        isFeatured: true,
        stock: 12,
        images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
        dimensions: "18\" × 24\"",
        medium: "Digital Print",
        year: 2024,
        isOriginal: false,
        tags: ["geometric", "modern", "minimalist"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Nature's Palette",
        description: "An interpretation of natural landscapes through the lens of contemporary artistic vision.",
        shortDescription: "Expressive landscape painting",
        price: "950.00",
        categoryId: originals.id,
        sku: "NAT-001",
        status: "active",
        isFeatured: true,
        stock: 1,
        images: ["https://images.unsplash.com/photo-1578321272176-b7bbc0679853?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400"],
        dimensions: "30\" × 24\"",
        medium: "Oil on Canvas",
        year: 2024,
        isOriginal: true,
        tags: ["landscape", "nature", "colorful"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    products.forEach(product => {
      this.products.set(product.id, product);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = {
      ...insertProduct,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updatedProduct: Product = {
      ...product,
      ...updateData,
      updatedAt: new Date(),
    };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.isFeatured);
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.categoryId === categoryId);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.slug === slug);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = {
      ...insertCategory,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: string, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;

    const updatedCategory: Category = {
      ...category,
      ...updateData,
    };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTag(id: string): Promise<Tag | undefined> {
    return this.tags.get(id);
  }

  async createTag(insertTag: InsertTag): Promise<Tag> {
    const tag: Tag = {
      ...insertTag,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  async updateTag(id: string, updateData: Partial<InsertTag>): Promise<Tag | undefined> {
    const tag = this.tags.get(id);
    if (!tag) return undefined;

    const updatedTag: Tag = {
      ...tag,
      ...updateData,
    };
    this.tags.set(id, updatedTag);
    return updatedTag;
  }

  async deleteTag(id: string): Promise<boolean> {
    return this.tags.delete(id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const order: Order = {
      ...insertOrder,
      id: randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder: Order = {
      ...order,
      ...updateData,
      updatedAt: new Date(),
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Messages
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  async getMessage(id: string): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: randomUUID(),
      isRead: false,
      createdAt: new Date(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const message = this.messages.get(id);
    if (!message) return false;

    message.isRead = true;
    this.messages.set(id, message);
    return true;
  }

  // Site Settings
  async getSiteSettings(): Promise<SiteSettings[]> {
    return Array.from(this.siteSettings.values());
  }

  async getSiteSetting(key: string): Promise<SiteSettings | undefined> {
    return Array.from(this.siteSettings.values()).find(setting => setting.key === key);
  }

  async setSiteSetting(insertSetting: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSiteSetting(insertSetting.key);
    
    if (existing) {
      const updated: SiteSettings = {
        ...existing,
        value: insertSetting.value,
        updatedAt: new Date(),
      };
      this.siteSettings.set(existing.id, updated);
      return updated;
    } else {
      const setting: SiteSettings = {
        ...insertSetting,
        id: randomUUID(),
        updatedAt: new Date(),
      };
      this.siteSettings.set(setting.id, setting);
      return setting;
    }
  }
}

export const storage = new MemStorage();
