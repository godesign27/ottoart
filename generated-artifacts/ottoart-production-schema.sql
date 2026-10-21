-- OttoArt production database schema
-- Source: production database neondb (read-only schema inspection)
-- Public tables, columns, defaults, constraints, and indexes only.
-- No table records, credentials, ownership, or access grants included.
-- Apply only to an empty target database; this file is not a migration.

CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE public."art_show_qr_codes" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "show_id" character varying NOT NULL,
    "label" text NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "description" text,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."art_shows" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "location" text,
    "event_date" text,
    "status" text DEFAULT 'active'::text NOT NULL,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now(),
    "artist_name" text
);

CREATE TABLE public."art_wall_simulations" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text,
    "room_background_id" character varying,
    "artworks" jsonb DEFAULT '[]'::jsonb,
    "is_public" boolean DEFAULT false,
    "user_id" character varying,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."bio_settings" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "hero_data" jsonb,
    "cta_data" jsonb,
    "updated_at" timestamp without time zone DEFAULT now(),
    "bio_content" text,
    "bio_image" text
);

CREATE TABLE public."board_items" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "board_id" character varying NOT NULL,
    "product_id" character varying NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."board_stars" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "board_id" character varying NOT NULL,
    "product_id" character varying NOT NULL,
    "curator_name" text NOT NULL,
    "curator_email" text NOT NULL,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."boards" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "slug" text NOT NULL,
    "status" text DEFAULT 'draft'::text,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."cart_items" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "product_id" character varying NOT NULL,
    "tier_id" text,
    "product_name" text NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "image" text,
    "tier_display_name" text,
    "created_at" timestamp without time zone DEFAULT now(),
    "session_id" character varying NOT NULL
);

CREATE TABLE public."categories" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "slug" text NOT NULL,
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."commission_requests" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "full_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "commission_type" text NOT NULL,
    "size_preference" text NOT NULL,
    "budget_range" text NOT NULL,
    "vision" text NOT NULL,
    "preferred_contact" text,
    "reference_file_url" text,
    "status" text DEFAULT 'new'::text,
    "is_read" boolean DEFAULT false,
    "notes" text,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."contact_settings" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "get_in_touch_text" text,
    "contact_info" jsonb,
    "studio_hours" jsonb,
    "commissions_text" text,
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."events" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "start_date" text NOT NULL,
    "end_date" text,
    "time" text,
    "location" text,
    "image_url" text,
    "website_url" text,
    "is_published" boolean DEFAULT false,
    "registration_required" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now(),
    "is_featured" boolean DEFAULT false
);

CREATE TABLE public."favorites" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "user_id" character varying NOT NULL,
    "product_id" character varying NOT NULL,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."gallery_items" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "image_url" text NOT NULL,
    "year" text,
    "medium" text,
    "dimensions" text,
    "is_published" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now(),
    "is_sold" boolean DEFAULT false
);

CREATE TABLE public."mailing_list_entries" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "email" text NOT NULL,
    "name" text,
    "source" text DEFAULT 'manual'::text NOT NULL,
    "notes" text,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."messages" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "email" text NOT NULL,
    "subject" text,
    "message" text NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."orders" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "customer_name" text NOT NULL,
    "customer_email" text NOT NULL,
    "customer_phone" text,
    "total_amount" numeric(10,2) NOT NULL,
    "status" text DEFAULT 'pending'::text,
    "items" jsonb NOT NULL,
    "shipping_address" jsonb,
    "notes" text,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."page_settings" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "page" text NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."products" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "short_description" text,
    "price" numeric(10,2) NOT NULL,
    "category_id" character varying,
    "sku" text,
    "status" text DEFAULT 'active'::text,
    "is_featured" boolean DEFAULT false,
    "stock" integer DEFAULT 0,
    "images" jsonb DEFAULT '[]'::jsonb,
    "dimensions" text,
    "medium" text,
    "year" integer,
    "is_original" boolean DEFAULT false,
    "tags" jsonb DEFAULT '[]'::jsonb,
    "pricing_tiers" jsonb DEFAULT '[]'::jsonb,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now(),
    "slug" text NOT NULL,
    "rarity" text,
    "frame" text,
    "packaging" text,
    "authenticity" text,
    "show_in_gallery" boolean DEFAULT false,
    "is_sold" boolean DEFAULT false
);

CREATE TABLE public."room_backgrounds" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "image_url" text NOT NULL,
    "room_type" text NOT NULL,
    "wall_color" text DEFAULT '#ffffff'::text,
    "is_default" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."sessions" (
    "sid" character varying NOT NULL,
    "sess" jsonb NOT NULL,
    "expire" timestamp without time zone NOT NULL
);

CREATE TABLE public."site_settings" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "key" text NOT NULL,
    "value" jsonb,
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."social_settings" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "instagram" text,
    "twitter" text,
    "facebook" text,
    "linkedin" text,
    "youtube" text,
    "tiktok" text,
    "pinterest" text,
    "show_in_header" boolean DEFAULT true,
    "show_in_footer" boolean DEFAULT true,
    "open_in_new_tab" boolean DEFAULT true,
    "social_sharing" boolean DEFAULT true,
    "meta_description" text,
    "og_image" text,
    "twitter_card" text DEFAULT 'summary_large_image'::text,
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."subscription_plans" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "description" text NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "stripe_product_id" text,
    "stripe_price_id" text,
    "icon" text,
    "features" jsonb DEFAULT '[]'::jsonb,
    "is_recommended" boolean DEFAULT false,
    "status" text DEFAULT 'active'::text,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."tags" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "slug" text NOT NULL,
    "created_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."user_subscriptions" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "user_id" character varying NOT NULL,
    "plan_id" character varying NOT NULL,
    "stripe_subscription_id" text,
    "stripe_customer_id" text,
    "status" text NOT NULL,
    "current_period_start" timestamp without time zone,
    "current_period_end" timestamp without time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT now(),
    "updated_at" timestamp without time zone DEFAULT now()
);

CREATE TABLE public."users" (
    "id" character varying DEFAULT gen_random_uuid() NOT NULL,
    "email" text,
    "first_name" text,
    "last_name" text,
    "role" text DEFAULT 'user'::text NOT NULL,
    "created_at" timestamp without time zone DEFAULT now(),
    "profile_image_url" character varying,
    "updated_at" timestamp without time zone DEFAULT now()
);

ALTER TABLE ONLY public."art_show_qr_codes" ADD CONSTRAINT "art_show_qr_codes_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."art_shows" ADD CONSTRAINT "art_shows_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."art_wall_simulations" ADD CONSTRAINT "art_wall_simulations_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."bio_settings" ADD CONSTRAINT "bio_settings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."board_items" ADD CONSTRAINT "board_items_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."board_stars" ADD CONSTRAINT "board_stars_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."boards" ADD CONSTRAINT "boards_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."boards" ADD CONSTRAINT "boards_slug_unique" UNIQUE (slug);
ALTER TABLE ONLY public."cart_items" ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."categories" ADD CONSTRAINT "categories_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."categories" ADD CONSTRAINT "categories_slug_unique" UNIQUE (slug);
ALTER TABLE ONLY public."commission_requests" ADD CONSTRAINT "commission_requests_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."contact_settings" ADD CONSTRAINT "contact_settings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."events" ADD CONSTRAINT "events_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."favorites" ADD CONSTRAINT "favorites_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."gallery_items" ADD CONSTRAINT "gallery_items_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."mailing_list_entries" ADD CONSTRAINT "mailing_list_entries_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."messages" ADD CONSTRAINT "messages_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."orders" ADD CONSTRAINT "orders_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."page_settings" ADD CONSTRAINT "page_settings_page_unique" UNIQUE (page);
ALTER TABLE ONLY public."page_settings" ADD CONSTRAINT "page_settings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."products" ADD CONSTRAINT "products_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."products" ADD CONSTRAINT "products_sku_unique" UNIQUE (sku);
ALTER TABLE ONLY public."products" ADD CONSTRAINT "products_slug_unique" UNIQUE (slug);
ALTER TABLE ONLY public."room_backgrounds" ADD CONSTRAINT "room_backgrounds_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY (sid);
ALTER TABLE ONLY public."site_settings" ADD CONSTRAINT "site_settings_key_unique" UNIQUE (key);
ALTER TABLE ONLY public."site_settings" ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."social_settings" ADD CONSTRAINT "social_settings_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."subscription_plans" ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."subscription_plans" ADD CONSTRAINT "subscription_plans_slug_unique" UNIQUE (slug);
ALTER TABLE ONLY public."tags" ADD CONSTRAINT "tags_name_unique" UNIQUE (name);
ALTER TABLE ONLY public."tags" ADD CONSTRAINT "tags_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."tags" ADD CONSTRAINT "tags_slug_unique" UNIQUE (slug);
ALTER TABLE ONLY public."user_subscriptions" ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."user_subscriptions" ADD CONSTRAINT "user_subscriptions_stripe_subscription_id_unique" UNIQUE (stripe_subscription_id);
ALTER TABLE ONLY public."users" ADD CONSTRAINT "users_email_unique" UNIQUE (email);
ALTER TABLE ONLY public."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);
ALTER TABLE ONLY public."art_show_qr_codes" ADD CONSTRAINT "art_show_qr_codes_show_id_art_shows_id_fk" FOREIGN KEY (show_id) REFERENCES art_shows(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."art_wall_simulations" ADD CONSTRAINT "art_wall_simulations_room_background_id_room_backgrounds_id_fk" FOREIGN KEY (room_background_id) REFERENCES room_backgrounds(id);
ALTER TABLE ONLY public."board_items" ADD CONSTRAINT "board_items_board_id_boards_id_fk" FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."board_items" ADD CONSTRAINT "board_items_product_id_products_id_fk" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."board_stars" ADD CONSTRAINT "board_stars_board_id_boards_id_fk" FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."board_stars" ADD CONSTRAINT "board_stars_product_id_products_id_fk" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY (product_id) REFERENCES products(id);
ALTER TABLE ONLY public."favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public."products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE ONLY public."user_subscriptions" ADD CONSTRAINT "user_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
ALTER TABLE ONLY public."user_subscriptions" ADD CONSTRAINT "user_subscriptions_user_id_users_id_fk" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);
CREATE INDEX idx_board_items_board_id ON public.board_items USING btree (board_id);
CREATE INDEX idx_board_stars_board_id ON public.board_stars USING btree (board_id);
CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id);
