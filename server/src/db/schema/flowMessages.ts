import { pgTable, serial, varchar, text, timestamp, pgEnum, integer, decimal, uuid } from 'drizzle-orm/pg-core';
import { enquiries } from './enquiries';
import { brokers } from './brokers';

export const bidFlowMessageStatusEnum = pgEnum("bid_flow_message_status", [
  "sent",
  "delivered",
  "read",
  "responded",
  "expired",
  "failed",
]);

export const bidFlowMessages = pgTable("bid_flow_messages", {
  id: serial('id').primaryKey(),
  enquiryId: integer("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  brokerId: integer("broker_id")
    .references(() => brokers.id, { onDelete: "cascade" })
    .notNull(),
  flowId: varchar("flow_id", { length: 256 }).notNull(), // Meta Flow ID
  gupshupMessageId: varchar("gupshup_message_id", { length: 256 }), // Response from Gupshup API
  flowToken: varchar("flow_token", { length: 512 }).notNull(), // Flow token for tracking responses - now required
  brokerPhoneNumber: varchar("broker_phone_number", { length: 32 }).notNull(),
  messageType: varchar("message_type", { length: 50 }).default("initial"), // "initial", "reminder", "followup"
  status: bidFlowMessageStatusEnum("status").default("sent"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bidStatusEnum = pgEnum("bid_status", [
  "pending",
  "submitted",
  "accepted",
  "rejected",
  "expired",
]);

export const bids = pgTable("bids", {
  id: serial('id').primaryKey(),
  enquiryId: integer("enquiry_id")
    .references(() => enquiries.id, { onDelete: "cascade" })
    .notNull(),
  brokerId: integer("broker_id")
    .references(() => brokers.id, { onDelete: "cascade" })
    .notNull(),
  bidAmount: decimal("bid_amount", { precision: 10, scale: 2 }).notNull(), // Bid amount in INR
  remarks: text("remarks"), // Additional remarks from broker
  status: bidStatusEnum("status").default("pending"),
  // Track which flow message triggered this bid (optional - for analytics)
  triggeredByFlowMessageId: integer("triggered_by_flow_message_id")
    .references(() => bidFlowMessages.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// New table to track flow message responses for better analytics
export const bidFlowMessageResponseEnum = pgEnum("bid_flow_message_response_type", [
  "bid_submitted",
  "no_response", 
  "invalid_response",
  "error_response"
]);

export const bidFlowMessageResponses = pgTable("bid_flow_message_responses", {
  id: serial('id').primaryKey(),
  bidFlowMessageId: integer("bid_flow_message_id")
    .references(() => bidFlowMessages.id, { onDelete: "cascade" })
    .notNull(),
  bidId: integer("bid_id")
    .references(() => bids.id, { onDelete: "cascade" }), // Optional - only set if response resulted in a bid
  responseType: bidFlowMessageResponseEnum("response_type").notNull(),
  responseData: text("response_data"), // JSON data from the flow response
  errorMessage: text("error_message"), // Error details if response failed
  createdAt: timestamp("created_at").defaultNow(),
});