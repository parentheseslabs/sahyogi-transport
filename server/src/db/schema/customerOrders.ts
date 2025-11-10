import { pgTable, serial, integer, timestamp, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { enquiries } from './enquiries';
import { quotes } from './quotes';

export const customerOrderStatusEnum = pgEnum('customer_order_status', [
  'active',
  'completed', 
  'cancelled',
]);

export const customerOrders = pgTable('customer_orders', {
  id: serial('id').primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  enquiryId: integer("enquiry_id").references(() => enquiries.id, { onDelete: "cascade" }).notNull(),
  quoteId: integer("quote_id").references(() => quotes.id, { onDelete: "cascade" }).notNull(),
  status: customerOrderStatusEnum("status").default("active"),
  notes: varchar("notes", { length: 1024 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});