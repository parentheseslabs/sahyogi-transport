import { integer, pgTable, serial, timestamp, text } from "drizzle-orm/pg-core";
import { doublePrecision } from "drizzle-orm/pg-core";
import { enquiries } from "./enquiries";
import { users } from "./users";
import { brokers } from "./brokers";
import { transportRoutes } from "./transportRoutes";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  enquiryId: integer("enquiry_id").references(() => enquiries.id, { onDelete: 'cascade' }).notNull(),
  brokerId: integer("broker_id").references(() => brokers.id, { onDelete: 'restrict' }).notNull(),
  routeId: integer("route_id").references(() => transportRoutes.id, { onDelete: 'restrict' }).notNull(),
  amount: doublePrecision("amount").notNull(), // Amount in INR
  notes: text("notes"), // Additional notes about the order
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});