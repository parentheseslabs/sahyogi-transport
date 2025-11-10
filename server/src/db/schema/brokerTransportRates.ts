import { timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { serial } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { transportRoutes } from "./transportRoutes";
import { users } from "./users";
import { doublePrecision } from "drizzle-orm/pg-core";
import { brokers } from "./brokers";

export const transportBrokerRateEnquiryStatusEnum = pgEnum("transport_rate_enquiry_status", [
  "open",
  "bidding", 
  "quoted",
  "closed"
]);

export const transportBrokerRateEnquiries = pgTable("transport_broker_rate_enquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  routeId: integer("route_id")
    .references(() => transportRoutes.id)
    .notNull(),
  cargoType: varchar("cargo_type", { length: 256 }),
  cargoWeight: doublePrecision("cargo_weight"), // In Metric Tonnes (MT)
  transportDate: timestamp("transport_date"),
  remarks: varchar("remarks", { length: 1024 }),
  status: transportBrokerRateEnquiryStatusEnum("status").default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const brokerTransportRateBids = pgTable("transport_rate_bids", {
  id: serial("id").primaryKey(),
  enquiryId: integer("enquiry_id")
    .references(() => transportBrokerRateEnquiries.id)
    .notNull(),
  brokerId: integer("broker_id")
    .references(() => brokers.id)
    .notNull(),
  rate: doublePrecision("rate"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
