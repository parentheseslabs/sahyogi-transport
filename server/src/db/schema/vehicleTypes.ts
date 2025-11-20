import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const vehicleTypes = pgTable('vehicle_types', {
  id: serial('id').primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: varchar('name', { length: 256 }).notNull(),
  description: varchar('description', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});