import { integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgTable, serial } from "drizzle-orm/pg-core";
import { enquiries } from "./enquiries";
import { transportBrokerRateEnquiries } from "./brokerTransportRates";
import { users } from "./users";

export const enquiryTransportLinks = pgTable("enquiry_transport_links", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  enquiryId: integer("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  transportEnquiryId: integer("transport_enquiry_id")
    .references(() => transportBrokerRateEnquiries.id, { onDelete: "cascade" })
    .notNull(),
  notes: varchar("notes", { length: 1024 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});