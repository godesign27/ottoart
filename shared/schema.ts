import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table updated for Replit Auth (keeping existing varchar ID type)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").default("user").notNull(), // user, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User favorites table  
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_favorites_user_id").on(table.userId),
]);

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Postcard Pal", "Sticker Star", "Super Mail Club"
  slug: text("slug").notNull().unique(), // "postcard-pal", "sticker-star", "super-mail-club"
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Monthly price
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  icon: text("icon"), // Icon identifier or URL
  features: jsonb("features").$type<string[]>().default([]),
  isRecommended: boolean("is_recommended").default(false),
  status: text("status").default("active"), // active, draft, archived
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").notNull(), // active, cancelled, past_due, unpaid
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  sku: text("sku").unique(),
  status: text("status").default("active"), // active, draft, archived
  isFeatured: boolean("is_featured").default(false),
  stock: integer("stock").default(0),
  images: jsonb("images").$type<string[]>().default([]),
  dimensions: text("dimensions"),
  medium: text("medium"),
  year: integer("year"),
  isOriginal: boolean("is_original").default(false),
  rarity: text("rarity"), // e.g., "Original", "Print Limited Edition of 100"
  frame: text("frame"), // e.g., "Not Framed", "Black Wood Frame"
  packaging: text("packaging"), // e.g., "Ships in a Box", "Tube Shipping"
  authenticity: text("authenticity"), // e.g., "Certificate is Included"
  tags: jsonb("tags").$type<string[]>().default([]),
  pricingTiers: jsonb("pricing_tiers").$type<Array<{
    id: string;
    size: string;
    price: number;
    type: string;
    stock: number;
    description: string;
  }>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, confirmed, shipped, delivered, cancelled
  items: jsonb("items").$type<Array<{productId: string, quantity: number, price: number}>>().notNull(),
  shippingAddress: jsonb("shipping_address").$type<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const pageSettings = pgTable("page_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  page: text("page", { enum: ["home", "bio", "gallery", "events", "cv", "contact", "mail-club"] }).notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(), // Unique identifier for each visitor's cart
  productId: varchar("product_id").notNull().references(() => products.id),
  tierId: text("tier_id"), // null for base product, tier id for pricing tiers
  productName: text("product_name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  image: text("image"),
  tierDisplayName: text("tier_display_name"), // "Original" or "8x10 print", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const bioSettings = pgTable("bio_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bioContent: text("bio_content"),
  bioImage: text("bio_image"),
  heroData: jsonb("hero_data").$type<{
    headline: string;
    description: string;
    backgroundImage: string;
  }>(),
  ctaData: jsonb("cta_data").$type<{
    enabled: boolean;
    headline: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    backgroundImage?: string;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactSettings = pgTable("contact_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  getInTouchText: text("get_in_touch_text"),
  contactInfo: jsonb("contact_info").$type<{
    email: string;
    phone: string;
    address: string;
  }>(),
  studioHours: jsonb("studio_hours").$type<{
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  }>(),
  commissionsText: text("commissions_text"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const socialSettings = pgTable("social_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instagram: text("instagram"),
  twitter: text("twitter"),
  facebook: text("facebook"),
  linkedin: text("linkedin"),
  youtube: text("youtube"),
  tiktok: text("tiktok"),
  pinterest: text("pinterest"),
  showInHeader: boolean("show_in_header").default(true),
  showInFooter: boolean("show_in_footer").default(true),
  openInNewTab: boolean("open_in_new_tab").default(true),
  socialSharing: boolean("social_sharing").default(true),
  metaDescription: text("meta_description"),
  ogImage: text("og_image"),
  twitterCard: text("twitter_card").default("summary_large_image"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roomBackgrounds = pgTable("room_backgrounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  roomType: text("room_type").notNull(), // "living_room", "bedroom", "office", "dining_room", "hallway"
  wallColor: text("wall_color").default("#ffffff"),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const artWallSimulations = pgTable("art_wall_simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  roomBackgroundId: varchar("room_background_id").references(() => roomBackgrounds.id),
  artworks: jsonb("artworks").$type<Array<{
    productId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    zIndex: number;
  }>>().default([]),
  isPublic: boolean("is_public").default(false),
  userId: varchar("user_id"), // Optional user association for saved simulations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const galleryItems = pgTable("gallery_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  year: text("year"),
  medium: text("medium"),
  dimensions: text("dimensions"),
  isPublished: boolean("is_published").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  time: text("time"),
  location: text("location"),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  isPublished: boolean("is_published").default(false),
  isFeatured: boolean("is_featured").default(false),
  registrationRequired: boolean("registration_required").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commissionRequests = pgTable("commission_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  commissionType: text("commission_type").notNull(),
  sizePreference: text("size_preference").notNull(),
  budgetRange: text("budget_range").notNull(),
  vision: text("vision").notNull(),
  preferredContact: text("preferred_contact"),
  referenceFileUrl: text("reference_file_url"),
  status: text("status").default("new"),
  isRead: boolean("is_read").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTagSchema = createInsertSchema(tags).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertPageSettingsSchema = createInsertSchema(pageSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertBioSettingsSchema = createInsertSchema(bioSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertContactSettingsSchema = createInsertSchema(contactSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertSocialSettingsSchema = createInsertSchema(socialSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertRoomBackgroundSchema = createInsertSchema(roomBackgrounds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArtWallSimulationSchema = createInsertSchema(artWallSimulations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionRequestSchema = createInsertSchema(commissionRequests).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert; // For Replit Auth

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Tag = typeof tags.$inferSelect;
export type InsertTag = z.infer<typeof insertTagSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

export type PageSettings = typeof pageSettings.$inferSelect;
export type InsertPageSettings = z.infer<typeof insertPageSettingsSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type BioSettings = typeof bioSettings.$inferSelect;
export type InsertBioSettings = z.infer<typeof insertBioSettingsSchema>;

export type ContactSettings = typeof contactSettings.$inferSelect;
export type InsertContactSettings = z.infer<typeof insertContactSettingsSchema>;

export type SocialSettings = typeof socialSettings.$inferSelect;
export type InsertSocialSettings = z.infer<typeof insertSocialSettingsSchema>;

export type RoomBackground = typeof roomBackgrounds.$inferSelect;
export type InsertRoomBackground = z.infer<typeof insertRoomBackgroundSchema>;

export type ArtWallSimulation = typeof artWallSimulations.$inferSelect;
export type InsertArtWallSimulation = z.infer<typeof insertArtWallSimulationSchema>;

export type GalleryItem = typeof galleryItems.$inferSelect;
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type CommissionRequest = typeof commissionRequests.$inferSelect;
export type InsertCommissionRequest = z.infer<typeof insertCommissionRequestSchema>;
