import { integer } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core";
import { serial, timestamp } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";

export const transportRoutes = pgTable("transport_routes", {
  id: serial("id").primaryKey(),
  name: varchar("name", {length: 256}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transportRouteLocationTypeEnum = pgEnum(
  "transport_route_location_type",
  ["load", "unload", "unknown"]
);

export const transportRouteLocations = pgTable("transport_route_locations", {
  id: serial("id").primaryKey(),
  routeId: integer("route_id")
    .references(() => transportRoutes.id, { onDelete: "cascade" })
    .notNull(),
  stopType: transportRouteLocationTypeEnum("stop_type").notNull(),
  remarks: varchar("remarks", {length: 1024}),
});
