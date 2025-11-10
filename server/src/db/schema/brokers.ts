import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const brokers = pgTable("brokers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyName: varchar("company_name", { length: 256 }),
  personName: varchar("person_name", { length: 256 }),
  phone: varchar("phone", { length: 32 }),
  alternatePhone: varchar("alternate_phone", { length: 32 }),
  city: varchar("city", { length: 1024 }), // The city in which the broker is based.
  remarks: varchar("remarks", { length: 1024 }),
  referrer: varchar("referrer", { length: 128 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// The regions in which the broker can deliver to
export const brokerRegion = pgTable("brokerRegions", {
  id: serial("id").primaryKey(),
  region: varchar("region", { length: 128 }),
  state: varchar("state", { length: 128 }),
  city: varchar("city", { length: 128 }),
  brokerId: integer("broker_id")
    .references(() => brokers.id, { onDelete: "cascade" })
    .notNull(),
});

// The types of vehicles the broker provides
export const brokerVehicleTypes = pgTable("brokerVehicleTypes", {
  id: serial("id").primaryKey(),
  vehicleType: varchar("vehicle_type", { length: 256 }),
  brokerId: integer("broker_id")
    .references(() => brokers.id, { onDelete: "cascade" })
    .notNull(),
});
