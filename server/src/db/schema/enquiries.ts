import { integer } from "drizzle-orm/pg-core";
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { doublePrecision } from "drizzle-orm/pg-core";
import { leads } from "./leads";
import { users } from "./users";

export const enquirySourceEnum = pgEnum("enquiry_source", [
  "unknown",
  "referral",
  "india_mart",
  "just_dial",
]);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "pending",
  "accepted", 
  "rejected",
]);

export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  leadId: integer("lead_id")
    .references(() => leads.id, { onDelete: "cascade" })
    .notNull(),
  from: varchar("from", { length: 256 }),
  to: varchar("to", { length: 256 }),
  cargoType: varchar("cargo_type", { length: 256 }),
  cargoWeight: doublePrecision("cargo_weight"), // In Metric Tonnes (MT)
  remarks: varchar("remarks", { length: 1024 }),
  source: enquirySourceEnum("source").default("unknown"),
  referrer: varchar("referrer", { length: 256 }),
  status: enquiryStatusEnum("status").default("pending"),
  updatedAt: timestamp("updated_at").defaultNow()
});
