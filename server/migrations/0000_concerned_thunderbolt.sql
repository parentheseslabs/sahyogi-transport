CREATE TYPE "public"."transport_rate_enquiry_status" AS ENUM('open', 'bidding', 'quoted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."enquiry_source" AS ENUM('unknown', 'referral', 'india_mart', 'just_dial');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('unknown', 'referral', 'india_mart', 'just_dial');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('accepted', 'rejected', 'pending');--> statement-breakpoint
CREATE TYPE "public"."transport_route_location_type" AS ENUM('load', 'unload', 'unknown');--> statement-breakpoint
CREATE TABLE "brokerRegions" (
	"id" serial PRIMARY KEY NOT NULL,
	"region" varchar(128),
	"state" varchar(128),
	"city" varchar(128),
	"broker_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brokerVehicleTypes" (
	"id" serial PRIMARY KEY NOT NULL,
	"vehicle_type" varchar(256),
	"broker_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brokers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"company_name" varchar(256),
	"person_name" varchar(256),
	"phone" varchar(32),
	"alternate_phone" varchar(32),
	"city" varchar(1024),
	"remarks" varchar(1024),
	"referrer" varchar(128),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transport_rate_bids" (
	"id" serial PRIMARY KEY NOT NULL,
	"enquiry_id" integer NOT NULL,
	"rate" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transport_broker_rate_enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"route_id" integer NOT NULL,
	"cargo_type" varchar(256),
	"cargo_weight" double precision,
	"transport_date" timestamp,
	"remarks" varchar(1024),
	"status" "transport_rate_enquiry_status" DEFAULT 'open',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"lead_id" integer NOT NULL,
	"from" varchar(256),
	"to" varchar(256),
	"cargo_type" varchar(256),
	"cargo_weight" double precision,
	"remarks" varchar(1024),
	"source" "enquiry_source" DEFAULT 'unknown',
	"referrer" varchar(256),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" varchar(256) NOT NULL,
	"phone" varchar(32),
	"alternatePhone" varchar(32),
	"source" "lead_source" DEFAULT 'unknown',
	"referrer" varchar(128),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"enquiry_id" integer NOT NULL,
	"costing" varchar(128),
	"quotation_amount" double precision,
	"status" "quote_status" DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "transport_route_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"route_id" integer NOT NULL,
	"stop_type" "transport_route_location_type" NOT NULL,
	"remarks" varchar(1024)
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brokerRegions" ADD CONSTRAINT "brokerRegions_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brokerVehicleTypes" ADD CONSTRAINT "brokerVehicleTypes_broker_id_brokers_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."brokers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brokers" ADD CONSTRAINT "brokers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_rate_bids" ADD CONSTRAINT "transport_rate_bids_enquiry_id_transport_broker_rate_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."transport_broker_rate_enquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_broker_rate_enquiries" ADD CONSTRAINT "transport_broker_rate_enquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_broker_rate_enquiries" ADD CONSTRAINT "transport_broker_rate_enquiries_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_route_locations" ADD CONSTRAINT "transport_route_locations_route_id_transport_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."transport_routes"("id") ON DELETE cascade ON UPDATE no action;