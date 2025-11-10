import { pgTable, serial, varchar, text, timestamp, decimal, pgEnum, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const leadSourceEnum = pgEnum("lead_source", ["unknown", "referral", "india_mart", "just_dial"])

export const leads = pgTable("leads", {
  id: serial('id').primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 256 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  alternatePhone: varchar("alternatePhone", { length: 32 }),
  source: leadSourceEnum("source").default("unknown"),
  referrer: varchar("referrer", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});