-- Migration: Rename flowMessages to bidFlowMessages and improve schema design
-- This migration refactors the bidding system to support multiple flow messages per bid

-- Create new enum types for the refactored schema
CREATE TYPE "public"."bid_flow_message_status" AS ENUM('sent', 'delivered', 'read', 'responded', 'expired', 'failed');
CREATE TYPE "public"."bid_flow_message_response_type" AS ENUM('bid_submitted', 'no_response', 'invalid_response', 'error_response');

-- Create new bidFlowMessages table with improved design
CREATE TABLE IF NOT EXISTS "bid_flow_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"enquiry_id" integer NOT NULL,
	"broker_id" integer NOT NULL,
	"flow_id" varchar(256) NOT NULL,
	"gupshup_message_id" varchar(256),
	"flow_token" varchar(512) NOT NULL,
	"broker_phone_number" varchar(32) NOT NULL,
	"message_type" varchar(50) DEFAULT 'initial',
	"status" "bid_flow_message_status" DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"read_at" timestamp,
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create new bidFlowMessageResponses table for tracking all responses
CREATE TABLE IF NOT EXISTS "bid_flow_message_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"bid_flow_message_id" integer NOT NULL,
	"bid_id" integer,
	"response_type" "bid_flow_message_response_type" NOT NULL,
	"response_data" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);

-- Modify bids table to remove direct flowMessageId dependency and add triggeredByFlowMessageId
ALTER TABLE "bids" DROP COLUMN IF EXISTS "flow_message_id";
ALTER TABLE "bids" ADD COLUMN IF NOT EXISTS "triggered_by_flow_message_id" integer;

-- Add foreign key constraints for new tables
DO $$ BEGIN
 ALTER TABLE "bid_flow_messages" ADD CONSTRAINT "bid_flow_messages_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bid_flow_messages" ADD CONSTRAINT "bid_flow_messages_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bid_flow_message_responses" ADD CONSTRAINT "bid_flow_message_responses_bid_flow_message_id_bid_flow_messages_id_fk" FOREIGN KEY ("bid_flow_message_id") REFERENCES "public"."bid_flow_messages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bid_flow_message_responses" ADD CONSTRAINT "bid_flow_message_responses_bid_id_bids_id_fk" FOREIGN KEY ("bid_id") REFERENCES "public"."bids"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "bids" ADD CONSTRAINT "bids_triggered_by_flow_message_id_bid_flow_messages_id_fk" FOREIGN KEY ("triggered_by_flow_message_id") REFERENCES "public"."bid_flow_messages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Migrate data from old flow_messages table to new bid_flow_messages table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flow_messages') THEN
        -- Migrate existing flow messages data
        INSERT INTO "bid_flow_messages" (
            "enquiry_id",
            "broker_id", 
            "flow_id",
            "gupshup_message_id",
            "flow_token",
            "broker_phone_number",
            "message_type",
            "status",
            "sent_at",
            "delivered_at",
            "read_at",
            "responded_at",
            "created_at",
            "updated_at"
        )
        SELECT 
            "enquiry_id",
            "broker_id",
            "flow_id",
            "gupshup_message_id",
            COALESCE("flow_token", 'migrated-' || "id"::text), -- Generate token for null values
            "broker_phone_number",
            'initial',
            "status"::text::"bid_flow_message_status",
            "sent_at",
            "delivered_at", 
            "read_at",
            "responded_at",
            "created_at",
            "updated_at"
        FROM "flow_messages";
        
        -- Update bids table to point to new flow messages for existing data
        UPDATE "bids" 
        SET "triggered_by_flow_message_id" = (
            SELECT bfm."id" 
            FROM "bid_flow_messages" bfm 
            WHERE bfm."enquiry_id" = "bids"."enquiry_id" 
            AND bfm."broker_id" = "bids"."broker_id"
            LIMIT 1
        );
        
        -- Drop old flow_messages table
        DROP TABLE IF EXISTS "flow_messages";
        
        -- Drop old enum type
        DROP TYPE IF EXISTS "flow_message_status";
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_bid_flow_messages_enquiry_id" ON "bid_flow_messages" ("enquiry_id");
CREATE INDEX IF NOT EXISTS "idx_bid_flow_messages_broker_id" ON "bid_flow_messages" ("broker_id");
CREATE INDEX IF NOT EXISTS "idx_bid_flow_messages_flow_token" ON "bid_flow_messages" ("flow_token");
CREATE INDEX IF NOT EXISTS "idx_bid_flow_messages_gupshup_message_id" ON "bid_flow_messages" ("gupshup_message_id");
CREATE INDEX IF NOT EXISTS "idx_bid_flow_message_responses_bid_flow_message_id" ON "bid_flow_message_responses" ("bid_flow_message_id");
CREATE INDEX IF NOT EXISTS "idx_bids_triggered_by_flow_message_id" ON "bids" ("triggered_by_flow_message_id");