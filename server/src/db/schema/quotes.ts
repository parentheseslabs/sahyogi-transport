import { pgTable, serial, varchar, text, timestamp, decimal, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { enquiries } from './enquiries';
import { doublePrecision } from 'drizzle-orm/pg-core';
import { users } from './users';

export const quoteStatusEnum = pgEnum('quote_status', ['accepted', 'rejected', 'pending']);

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  enquiryId: integer("enquiry_id").references(() => enquiries.id, { onDelete: "cascade" }).notNull(),
  costing: varchar("costing", { length: 128 }),
  quotationAmount: doublePrecision("quotation_amount"), // in INR
  marginPercentage: doublePrecision("margin_percentage"), // margin percentage (e.g., 15.5 for 15.5%)
  baseAmount: doublePrecision("base_amount"), // sum of all transport orders
  isCustomAmount: boolean("is_custom_amount").default(false), // true if user set custom amount
  status: quoteStatusEnum("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});