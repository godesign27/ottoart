--
-- PostgreSQL database dump
--

\restrict cU6LNmCf5iVJOC8mDZO9gZRdhMb9G07o20HMdtikJ4rUWa5VEHgcUtTeNfiaSNZ

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: art_show_qr_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.art_show_qr_codes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    show_id character varying NOT NULL,
    label text NOT NULL,
    price numeric(10,2) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: art_shows; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.art_shows (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    location text,
    event_date text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    artist_name text
);


--
-- Name: art_wall_simulations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.art_wall_simulations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text,
    room_background_id character varying,
    artworks jsonb DEFAULT '[]'::jsonb,
    is_public boolean DEFAULT false,
    user_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: bio_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bio_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    hero_data jsonb,
    cta_data jsonb,
    updated_at timestamp without time zone DEFAULT now(),
    bio_content text,
    bio_image text
);


--
-- Name: board_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    board_id character varying NOT NULL,
    product_id character varying NOT NULL,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: board_stars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.board_stars (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    board_id character varying NOT NULL,
    product_id character varying NOT NULL,
    curator_name text NOT NULL,
    curator_email text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: boards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.boards (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    slug text NOT NULL,
    status text DEFAULT 'draft'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    tier_id text,
    product_name text NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    image text,
    tier_display_name text,
    created_at timestamp without time zone DEFAULT now(),
    session_id character varying NOT NULL
);


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    slug text NOT NULL,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: commission_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text,
    commission_type text NOT NULL,
    size_preference text NOT NULL,
    budget_range text NOT NULL,
    vision text NOT NULL,
    preferred_contact text,
    reference_file_url text,
    status text DEFAULT 'new'::text,
    is_read boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: contact_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    get_in_touch_text text,
    contact_info jsonb,
    studio_hours jsonb,
    commissions_text text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_date text NOT NULL,
    end_date text,
    "time" text,
    location text,
    image_url text,
    website_url text,
    is_published boolean DEFAULT false,
    registration_required boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_featured boolean DEFAULT false
);


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favorites (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    product_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: gallery_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    year text,
    medium text,
    dimensions text,
    is_published boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    is_sold boolean DEFAULT false
);


--
-- Name: mailing_list_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mailing_list_entries (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text,
    source text DEFAULT 'manual'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    total_amount numeric(10,2) NOT NULL,
    status text DEFAULT 'pending'::text,
    items jsonb NOT NULL,
    shipping_address jsonb,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: page_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    page text NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    short_description text,
    price numeric(10,2) NOT NULL,
    category_id character varying,
    sku text,
    status text DEFAULT 'active'::text,
    is_featured boolean DEFAULT false,
    stock integer DEFAULT 0,
    images jsonb DEFAULT '[]'::jsonb,
    dimensions text,
    medium text,
    year integer,
    is_original boolean DEFAULT false,
    tags jsonb DEFAULT '[]'::jsonb,
    pricing_tiers jsonb DEFAULT '[]'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    slug text NOT NULL,
    rarity text,
    frame text,
    packaging text,
    authenticity text,
    show_in_gallery boolean DEFAULT false,
    is_sold boolean DEFAULT false
);


--
-- Name: room_backgrounds; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.room_backgrounds (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    image_url text NOT NULL,
    room_type text NOT NULL,
    wall_color text DEFAULT '#ffffff'::text,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    value jsonb,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: social_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    instagram text,
    twitter text,
    facebook text,
    linkedin text,
    youtube text,
    tiktok text,
    pinterest text,
    show_in_header boolean DEFAULT true,
    show_in_footer boolean DEFAULT true,
    open_in_new_tab boolean DEFAULT true,
    social_sharing boolean DEFAULT true,
    meta_description text,
    og_image text,
    twitter_card text DEFAULT 'summary_large_image'::text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscription_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL,
    stripe_product_id text,
    stripe_price_id text,
    icon text,
    features jsonb DEFAULT '[]'::jsonb,
    is_recommended boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_subscriptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    plan_id character varying NOT NULL,
    stripe_subscription_id text,
    stripe_customer_id text,
    status text NOT NULL,
    current_period_start timestamp without time zone,
    current_period_end timestamp without time zone,
    cancel_at_period_end boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text,
    first_name text,
    last_name text,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    profile_image_url character varying,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: art_show_qr_codes art_show_qr_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_show_qr_codes
    ADD CONSTRAINT art_show_qr_codes_pkey PRIMARY KEY (id);


--
-- Name: art_shows art_shows_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_shows
    ADD CONSTRAINT art_shows_pkey PRIMARY KEY (id);


--
-- Name: art_wall_simulations art_wall_simulations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_wall_simulations
    ADD CONSTRAINT art_wall_simulations_pkey PRIMARY KEY (id);


--
-- Name: bio_settings bio_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bio_settings
    ADD CONSTRAINT bio_settings_pkey PRIMARY KEY (id);


--
-- Name: board_items board_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_items
    ADD CONSTRAINT board_items_pkey PRIMARY KEY (id);


--
-- Name: board_stars board_stars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_stars
    ADD CONSTRAINT board_stars_pkey PRIMARY KEY (id);


--
-- Name: boards boards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_pkey PRIMARY KEY (id);


--
-- Name: boards boards_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.boards
    ADD CONSTRAINT boards_slug_unique UNIQUE (slug);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_unique UNIQUE (slug);


--
-- Name: commission_requests commission_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_requests
    ADD CONSTRAINT commission_requests_pkey PRIMARY KEY (id);


--
-- Name: contact_settings contact_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_settings
    ADD CONSTRAINT contact_settings_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_pkey PRIMARY KEY (id);


--
-- Name: gallery_items gallery_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery_items
    ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);


--
-- Name: mailing_list_entries mailing_list_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mailing_list_entries
    ADD CONSTRAINT mailing_list_entries_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: page_settings page_settings_page_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_settings
    ADD CONSTRAINT page_settings_page_unique UNIQUE (page);


--
-- Name: page_settings page_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_settings
    ADD CONSTRAINT page_settings_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: products products_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_unique UNIQUE (slug);


--
-- Name: room_backgrounds room_backgrounds_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.room_backgrounds
    ADD CONSTRAINT room_backgrounds_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: site_settings site_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_key_unique UNIQUE (key);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: social_settings social_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_settings
    ADD CONSTRAINT social_settings_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_slug_unique UNIQUE (slug);


--
-- Name: tags tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_unique UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tags tags_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_unique UNIQUE (slug);


--
-- Name: user_subscriptions user_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: user_subscriptions user_subscriptions_stripe_subscription_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_stripe_subscription_id_unique UNIQUE (stripe_subscription_id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_board_items_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_board_items_board_id ON public.board_items USING btree (board_id);


--
-- Name: idx_board_stars_board_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_board_stars_board_id ON public.board_stars USING btree (board_id);


--
-- Name: idx_favorites_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id);


--
-- Name: art_show_qr_codes art_show_qr_codes_show_id_art_shows_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_show_qr_codes
    ADD CONSTRAINT art_show_qr_codes_show_id_art_shows_id_fk FOREIGN KEY (show_id) REFERENCES public.art_shows(id) ON DELETE CASCADE;


--
-- Name: art_wall_simulations art_wall_simulations_room_background_id_room_backgrounds_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.art_wall_simulations
    ADD CONSTRAINT art_wall_simulations_room_background_id_room_backgrounds_id_fk FOREIGN KEY (room_background_id) REFERENCES public.room_backgrounds(id);


--
-- Name: board_items board_items_board_id_boards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_items
    ADD CONSTRAINT board_items_board_id_boards_id_fk FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;


--
-- Name: board_items board_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_items
    ADD CONSTRAINT board_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: board_stars board_stars_board_id_boards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_stars
    ADD CONSTRAINT board_stars_board_id_boards_id_fk FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;


--
-- Name: board_stars board_stars_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.board_stars
    ADD CONSTRAINT board_stars_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: favorites favorites_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: favorites favorites_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: user_subscriptions user_subscriptions_plan_id_subscription_plans_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_plan_id_subscription_plans_id_fk FOREIGN KEY (plan_id) REFERENCES public.subscription_plans(id);


--
-- Name: user_subscriptions user_subscriptions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_subscriptions
    ADD CONSTRAINT user_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict cU6LNmCf5iVJOC8mDZO9gZRdhMb9G07o20HMdtikJ4rUWa5VEHgcUtTeNfiaSNZ

