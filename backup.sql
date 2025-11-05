


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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."credit_transaction_type" AS ENUM (
    'purchase',
    'usage',
    'refund',
    'bonus',
    'subscription_grant'
);


ALTER TYPE "public"."credit_transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."render_status" AS ENUM (
    'queued',
    'processing',
    'completed',
    'failed',
    'pending'
);


ALTER TYPE "public"."render_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_plan" AS ENUM (
    'free',
    'basic',
    'pro',
    'enterprise'
);


ALTER TYPE "public"."subscription_plan" OWNER TO "postgres";


CREATE TYPE "public"."subscription_status" AS ENUM (
    'active',
    'cancelled',
    'expired',
    'pending'
);


ALTER TYPE "public"."subscription_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'subscription',
    'credit_purchase',
    'refund'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "public"."credit_transaction_type", "p_description" "text" DEFAULT NULL::"text", "p_payment_transaction_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_balance_after INTEGER;
    v_transaction_id UUID;
BEGIN
    -- Update credit balance
    UPDATE credit_balances
    SET 
        balance = balance + p_amount,
        lifetime_purchased = CASE 
            WHEN p_type = 'purchase' THEN lifetime_purchased + p_amount
            ELSE lifetime_purchased
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_balance_after;
    
    -- Create credit transaction
    INSERT INTO credit_transactions (
        user_id, 
        type, 
        amount, 
        balance_after, 
        description, 
        payment_transaction_id
    )
    VALUES (
        p_user_id,
        p_type,
        p_amount,
        v_balance_after,
        p_description,
        p_payment_transaction_id
    )
    RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;


ALTER FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "public"."credit_transaction_type", "p_description" "text", "p_payment_transaction_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_free_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Create free subscription with 5 image generations and 1 video generation
    INSERT INTO public.subscriptions (
        user_id, 
        plan_id, 
        status, 
        remaining_quota,
        remaining_video_quota,
        current_period_start,
        current_period_end,
        expires_at,
        auto_renew
    )
    VALUES (
        NEW.id, 
        'free', 
        'active', 
        5,   -- Free tier gets 5 image generations per month
        1,   -- Free tier gets 1 video generation per month
        NOW(),
        NOW() + INTERVAL '30 days',
        NULL,  -- Free tier doesn't expire
        TRUE
    );
    
    -- Create credit balance
    INSERT INTO public.credit_balances (user_id, balance, lifetime_purchased, lifetime_used)
    VALUES (NEW.id, 0, 0, 0);
    
    RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE WARNING 'Error in create_free_subscription: %', SQLERRM;
    RAISE;
END;
$$;


ALTER FUNCTION "public"."create_free_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_user_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert into profiles table (required for subscriptions and other features)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Insert into user_profiles table (for additional profile data)
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
    RAISE;
END;
$$;


ALTER FUNCTION "public"."create_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deduct_render_cost"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_subscription RECORD;
    v_credit_balance RECORD;
BEGIN
    -- Get active subscription
    SELECT * INTO v_subscription
    FROM subscriptions
    WHERE user_id = p_user_id AND status = 'active'
    LIMIT 1;
    
    -- Check if user has quota available
    IF v_subscription.id IS NOT NULL AND v_subscription.used_renders < v_subscription.monthly_render_quota THEN
        -- Deduct from quota
        UPDATE subscriptions
        SET used_renders = used_renders + 1, updated_at = NOW()
        WHERE id = v_subscription.id;
        
        -- Log usage
        INSERT INTO usage_logs (user_id, action, resource_type, resource_id)
        VALUES (p_user_id, 'render_quota_used', 'subscription', v_subscription.id);
        
        RETURN TRUE;
    END IF;
    
    -- Check if user has credits
    SELECT * INTO v_credit_balance
    FROM credit_balances
    WHERE user_id = p_user_id AND balance >= 1
    FOR UPDATE;
    
    IF v_credit_balance.id IS NOT NULL THEN
        -- Deduct from credits
        UPDATE credit_balances
        SET 
            balance = balance - 1,
            lifetime_used = lifetime_used + 1,
            updated_at = NOW()
        WHERE id = v_credit_balance.id;
        
        -- Log credit transaction
        INSERT INTO credit_transactions (user_id, type, amount, balance_after, description)
        VALUES (p_user_id, 'usage', -1, v_credit_balance.balance - 1, 'Render generation');
        
        -- Log usage
        INSERT INTO usage_logs (user_id, action, resource_type, resource_id)
        VALUES (p_user_id, 'render_credit_used', 'credit_balance', v_credit_balance.id);
        
        RETURN TRUE;
    END IF;
    
    -- No quota or credits available
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."deduct_render_cost"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now());
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reset_expired_quotas"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE subscriptions
    SET 
        used_renders = 0,
        quota_reset_date = quota_reset_date + INTERVAL '1 month',
        updated_at = NOW()
    WHERE 
        status = 'active'
        AND quota_reset_date <= NOW();
END;
$$;


ALTER FUNCTION "public"."reset_expired_quotas"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_subscription_renewal"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  response http_response;
  supabase_url TEXT;
  service_role_key TEXT;
  cron_secret TEXT;
BEGIN
  -- Get configuration from environment or settings
  -- Note: In production, these should be set via Supabase dashboard or CLI
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  cron_secret := current_setting('app.settings.cron_secret', true);
  
  -- Fallback to environment variables if settings not found
  IF supabase_url IS NULL THEN
    supabase_url := current_setting('SUPABASE_URL', true);
  END IF;
  
  IF service_role_key IS NULL THEN
    service_role_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
  END IF;
  
  IF cron_secret IS NULL THEN
    cron_secret := current_setting('CRON_SECRET', true);
  END IF;
  
  -- Validate required settings
  IF supabase_url IS NULL OR service_role_key IS NULL THEN
    RAISE EXCEPTION 'Missing required configuration: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY';
  END IF;
  
  -- Call the Edge Function
  SELECT * INTO response
  FROM http((
    'POST',
    supabase_url || '/functions/v1/subscription-renewal',
    ARRAY[
      http_header('Authorization', 'Bearer ' || service_role_key),
      http_header('x-cron-secret', COALESCE(cron_secret, '')),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'
  )::http_request);
  
  -- Log the response
  IF response.status >= 200 AND response.status < 300 THEN
    RAISE NOTICE 'Subscription renewal completed successfully: %', response.content;
  ELSE
    RAISE WARNING 'Subscription renewal failed with status %: %', response.status, response.content;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error calling subscription renewal: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."trigger_subscription_renewal"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."trigger_subscription_renewal"() IS 'Triggers the subscription renewal Edge Function to reset quotas, downgrade expired subscriptions, and send renewal reminders. Scheduled to run daily at 2 AM UTC via pg_cron.';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."brand_kits" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "logo_path" "text",
    "use_watermark" boolean DEFAULT false,
    "colors" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."brand_kits" OWNER TO "postgres";


COMMENT ON TABLE "public"."brand_kits" IS 'User brand assets including logo and colors (one per user)';



CREATE TABLE IF NOT EXISTS "public"."credit_balances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" integer DEFAULT 0 NOT NULL,
    "lifetime_purchased" integer DEFAULT 0 NOT NULL,
    "lifetime_used" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "credit_balances_balance_check" CHECK (("balance" >= 0))
);


ALTER TABLE "public"."credit_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."credit_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."credit_transaction_type" NOT NULL,
    "amount" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "description" "text",
    "payment_transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."credit_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mockups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "image_path" "text" NOT NULL,
    "thumbnail_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mockups" OWNER TO "postgres";


COMMENT ON TABLE "public"."mockups" IS 'Generated mockup images linked to projects';



CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."transaction_type" NOT NULL,
    "status" "public"."transaction_status" DEFAULT 'pending'::"public"."transaction_status" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'TRY'::"text" NOT NULL,
    "iyzico_payment_id" "text",
    "iyzico_conversation_id" "text",
    "subscription_id" "uuid",
    "credits_purchased" integer,
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "iyzico_token" "text"
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payment_transactions"."iyzico_token" IS 'İyzico checkout form token for payment verification';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'User profile information linked to auth.users';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "prompt" "text",
    "aspect_ratio" "text" DEFAULT '1:1'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "projects_aspect_ratio_check" CHECK (("aspect_ratio" = ANY (ARRAY['1:1'::"text", '16:9'::"text", '9:16'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'User projects containing mockup generation settings';



CREATE TABLE IF NOT EXISTS "public"."prompt_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prompt_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."prompt_templates" IS 'Reusable prompt templates saved by users';



CREATE TABLE IF NOT EXISTS "public"."render_queue" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "status" "public"."render_status" DEFAULT 'pending'::"public"."render_status" NOT NULL,
    "prompt" "text" NOT NULL,
    "aspect_ratio" "text" DEFAULT '1:1'::"text" NOT NULL,
    "input_images" "text"[] NOT NULL,
    "output_image_path" "text",
    "error_message" "text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "priority" "text" DEFAULT 'low'::"text" NOT NULL,
    "request_data" "jsonb" NOT NULL,
    "result_data" "jsonb",
    CONSTRAINT "render_queue_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'high'::"text"])))
);


ALTER TABLE "public"."render_queue" OWNER TO "postgres";


COMMENT ON COLUMN "public"."render_queue"."priority" IS 'Queue priority: low (free users) or high (paid users)';



COMMENT ON COLUMN "public"."render_queue"."request_data" IS 'JSON object containing prompt, images array, and aspectRatio';



COMMENT ON COLUMN "public"."render_queue"."result_data" IS 'JSON object containing generatedImages array';



CREATE OR REPLACE VIEW "public"."subscription_renewal_status" AS
 SELECT "jobid",
    "schedule",
    "command",
    "nodename",
    "nodeport",
    "database",
    "username",
    "active",
    "jobname"
   FROM "cron"."job"
  WHERE ("jobname" = 'subscription-renewal-daily'::"text");


ALTER VIEW "public"."subscription_renewal_status" OWNER TO "postgres";


COMMENT ON VIEW "public"."subscription_renewal_status" IS 'View to monitor the status of the subscription renewal cron job';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan" "public"."subscription_plan" DEFAULT 'free'::"public"."subscription_plan" NOT NULL,
    "status" "public"."subscription_status" DEFAULT 'active'::"public"."subscription_status" NOT NULL,
    "monthly_render_quota" integer DEFAULT 10 NOT NULL,
    "used_renders" integer DEFAULT 0 NOT NULL,
    "quota_reset_date" timestamp with time zone DEFAULT ("now"() + '1 mon'::interval) NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "iyzico_subscription_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan_id" "text" NOT NULL,
    "remaining_quota" integer NOT NULL,
    "current_period_start" timestamp with time zone NOT NULL,
    "current_period_end" timestamp with time zone NOT NULL,
    "auto_renew" boolean DEFAULT true,
    "remaining_video_quota" integer DEFAULT 0
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."subscriptions"."plan_id" IS 'Subscription plan ID: free, starter, pro, business';



COMMENT ON COLUMN "public"."subscriptions"."remaining_quota" IS 'Remaining image generation quota for current period';



COMMENT ON COLUMN "public"."subscriptions"."current_period_start" IS 'Start date of current billing period';



COMMENT ON COLUMN "public"."subscriptions"."current_period_end" IS 'End date of current billing period';



COMMENT ON COLUMN "public"."subscriptions"."auto_renew" IS 'Whether subscription auto-renews at period end';



COMMENT ON COLUMN "public"."subscriptions"."remaining_video_quota" IS 'Remaining video generation quota for current period';



CREATE TABLE IF NOT EXISTS "public"."usage_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "avatar_path" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."videos" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "storage_path" "text" NOT NULL,
    "source_image_path" "text",
    "prompt" "text" NOT NULL,
    "duration" integer,
    "aspect_ratio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "videos_aspect_ratio_check" CHECK (("aspect_ratio" = ANY (ARRAY['16:9'::"text", '9:16'::"text", '1:1'::"text"]))),
    CONSTRAINT "videos_duration_check" CHECK ((("duration" > 0) AND ("duration" <= 10)))
);


ALTER TABLE "public"."videos" OWNER TO "postgres";


COMMENT ON TABLE "public"."videos" IS 'Generated videos from Veo 3 AI model';



COMMENT ON COLUMN "public"."videos"."storage_path" IS 'Path to video file in Supabase Storage';



COMMENT ON COLUMN "public"."videos"."source_image_path" IS 'Path to source image used for video generation';



COMMENT ON COLUMN "public"."videos"."duration" IS 'Video duration in seconds (5-10)';



COMMENT ON COLUMN "public"."videos"."aspect_ratio" IS 'Video aspect ratio: 16:9, 9:16, or 1:1';



ALTER TABLE ONLY "public"."brand_kits"
    ADD CONSTRAINT "brand_kits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brand_kits"
    ADD CONSTRAINT "brand_kits_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."credit_balances"
    ADD CONSTRAINT "credit_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."credit_balances"
    ADD CONSTRAINT "credit_balances_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompt_templates"
    ADD CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."render_queue"
    ADD CONSTRAINT "render_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_brand_kits_user_id" ON "public"."brand_kits" USING "btree" ("user_id");



CREATE INDEX "idx_credit_balances_user_id" ON "public"."credit_balances" USING "btree" ("user_id");



CREATE INDEX "idx_credit_transactions_created_at" ON "public"."credit_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_credit_transactions_payment_id" ON "public"."credit_transactions" USING "btree" ("payment_transaction_id");



CREATE INDEX "idx_credit_transactions_user_id" ON "public"."credit_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_mockups_created_at" ON "public"."mockups" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mockups_project_id" ON "public"."mockups" USING "btree" ("project_id");



CREATE INDEX "idx_mockups_user_id" ON "public"."mockups" USING "btree" ("user_id");



CREATE INDEX "idx_payment_transactions_created_at" ON "public"."payment_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_transactions_iyzico_payment_id" ON "public"."payment_transactions" USING "btree" ("iyzico_payment_id");



CREATE INDEX "idx_payment_transactions_iyzico_token" ON "public"."payment_transactions" USING "btree" ("iyzico_token");



CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX "idx_payment_transactions_user_id" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_projects_created_at" ON "public"."projects" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_projects_user_id" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "idx_prompt_templates_created_at" ON "public"."prompt_templates" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_prompt_templates_user_id" ON "public"."prompt_templates" USING "btree" ("user_id");



CREATE INDEX "idx_render_queue_created_at" ON "public"."render_queue" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_render_queue_status" ON "public"."render_queue" USING "btree" ("status");



CREATE INDEX "idx_render_queue_status_priority" ON "public"."render_queue" USING "btree" ("status", "priority" DESC, "created_at");



CREATE INDEX "idx_render_queue_user_id" ON "public"."render_queue" USING "btree" ("user_id");



CREATE INDEX "idx_render_queue_user_status" ON "public"."render_queue" USING "btree" ("user_id", "status");



CREATE INDEX "idx_subscriptions_plan_id" ON "public"."subscriptions" USING "btree" ("plan_id");



CREATE INDEX "idx_subscriptions_quota_reset" ON "public"."subscriptions" USING "btree" ("quota_reset_date");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_subscriptions_user_id" ON "public"."subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_subscriptions_video_quota" ON "public"."subscriptions" USING "btree" ("user_id", "remaining_video_quota");



CREATE INDEX "idx_usage_logs_action" ON "public"."usage_logs" USING "btree" ("action");



CREATE INDEX "idx_usage_logs_created_at" ON "public"."usage_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_usage_logs_user_action" ON "public"."usage_logs" USING "btree" ("user_id", "action", "created_at" DESC);



CREATE INDEX "idx_usage_logs_user_id" ON "public"."usage_logs" USING "btree" ("user_id");



CREATE INDEX "idx_videos_created_at" ON "public"."videos" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_videos_project_id" ON "public"."videos" USING "btree" ("project_id");



CREATE INDEX "idx_videos_user_created" ON "public"."videos" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_videos_user_id" ON "public"."videos" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_profile_created" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_free_subscription"();



CREATE OR REPLACE TRIGGER "update_credit_balances_updated_at" BEFORE UPDATE ON "public"."credit_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_payment_transactions_updated_at" BEFORE UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_render_queue_updated_at" BEFORE UPDATE ON "public"."render_queue" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."brand_kits"
    ADD CONSTRAINT "brand_kits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_balances"
    ADD CONSTRAINT "credit_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id");



ALTER TABLE ONLY "public"."credit_transactions"
    ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mockups"
    ADD CONSTRAINT "mockups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prompt_templates"
    ADD CONSTRAINT "prompt_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."render_queue"
    ADD CONSTRAINT "render_queue_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."render_queue"
    ADD CONSTRAINT "render_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."usage_logs"
    ADD CONSTRAINT "usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."videos"
    ADD CONSTRAINT "videos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Service role can insert credit transactions" ON "public"."credit_transactions" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Service role can insert usage logs" ON "public"."usage_logs" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Service role can manage payment transactions" ON "public"."payment_transactions" USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Service role can update all queue items" ON "public"."render_queue" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can update all subscriptions" ON "public"."subscriptions" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can update credit balances" ON "public"."credit_balances" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text") OR ("auth"."uid"() = "user_id")));



CREATE POLICY "Users can delete own brand kit" ON "public"."brand_kits" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own mockups" ON "public"."mockups" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own profile" ON "public"."profiles" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can delete own projects" ON "public"."projects" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete own templates" ON "public"."prompt_templates" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can delete their own subscriptions" ON "public"."subscriptions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own videos" ON "public"."videos" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own brand kit" ON "public"."brand_kits" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own mockups" ON "public"."mockups" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own projects" ON "public"."projects" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert own templates" ON "public"."prompt_templates" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can insert their own credit balance" ON "public"."credit_balances" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own queue items" ON "public"."render_queue" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own subscription" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own subscriptions" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own videos" ON "public"."videos" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own brand kit" ON "public"."brand_kits" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own mockups" ON "public"."mockups" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own projects" ON "public"."projects" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own templates" ON "public"."prompt_templates" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update their own payment transactions" ON "public"."payment_transactions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own queue items" ON "public"."render_queue" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own subscription" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own subscriptions" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own brand kit" ON "public"."brand_kits" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own mockups" ON "public"."mockups" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own projects" ON "public"."projects" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view own templates" ON "public"."prompt_templates" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can view their own credit balance" ON "public"."credit_balances" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own credit transactions" ON "public"."credit_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment transactions" ON "public"."payment_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own queue items" ON "public"."render_queue" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscription" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own usage logs" ON "public"."usage_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own videos" ON "public"."videos" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."brand_kits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."credit_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mockups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."prompt_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."render_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."usage_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."videos" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."render_queue";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "public"."credit_transaction_type", "p_description" "text", "p_payment_transaction_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "public"."credit_transaction_type", "p_description" "text", "p_payment_transaction_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_credits"("p_user_id" "uuid", "p_amount" integer, "p_type" "public"."credit_transaction_type", "p_description" "text", "p_payment_transaction_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bytea_to_text"("data" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_free_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_free_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_free_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deduct_render_cost"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."deduct_render_cost"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deduct_render_cost"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "postgres";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "anon";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http"("request" "public"."http_request") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_delete"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_get"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_head"("uri" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_header"("field" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_list_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_patch"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_post"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_put"("uri" character varying, "content" character varying, "content_type" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "postgres";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "anon";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_reset_curlopt"() TO "service_role";



GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."http_set_curlopt"("curlopt" character varying, "value" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."reset_expired_quotas"() TO "anon";
GRANT ALL ON FUNCTION "public"."reset_expired_quotas"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_expired_quotas"() TO "service_role";



GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."text_to_bytea"("data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_subscription_renewal"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_subscription_renewal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_subscription_renewal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" "bytea") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "postgres";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."urlencode"("string" character varying) TO "service_role";
























GRANT ALL ON TABLE "public"."brand_kits" TO "anon";
GRANT ALL ON TABLE "public"."brand_kits" TO "authenticated";
GRANT ALL ON TABLE "public"."brand_kits" TO "service_role";



GRANT ALL ON TABLE "public"."credit_balances" TO "anon";
GRANT ALL ON TABLE "public"."credit_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_balances" TO "service_role";



GRANT ALL ON TABLE "public"."credit_transactions" TO "anon";
GRANT ALL ON TABLE "public"."credit_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."credit_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."mockups" TO "anon";
GRANT ALL ON TABLE "public"."mockups" TO "authenticated";
GRANT ALL ON TABLE "public"."mockups" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."prompt_templates" TO "anon";
GRANT ALL ON TABLE "public"."prompt_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."prompt_templates" TO "service_role";



GRANT ALL ON TABLE "public"."render_queue" TO "anon";
GRANT ALL ON TABLE "public"."render_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."render_queue" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_renewal_status" TO "anon";
GRANT ALL ON TABLE "public"."subscription_renewal_status" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_renewal_status" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."videos" TO "anon";
GRANT ALL ON TABLE "public"."videos" TO "authenticated";
GRANT ALL ON TABLE "public"."videos" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































