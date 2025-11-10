import express from "express";
import { db } from "../db/connection";
import { orders } from "../db/schema/orders";
import { enquiries } from "../db/schema/enquiries";
import { leads } from "../db/schema/leads";
import { brokers } from "../db/schema/brokers";
import { transportRoutes } from "../db/schema/transportRoutes";
import { eq, desc, and, or, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/transport-orders/brokers - Get all brokers for dropdown
router.get("/brokers", async (req, res) => {
  try {
    const brokersList = await db
      .select({
        id: brokers.id,
        companyName: brokers.companyName,
        personName: brokers.personName,
        phone: brokers.phone,
        city: brokers.city,
      })
      .from(brokers)
      .where(eq(brokers.userId, req.user!.userId))
      .orderBy(brokers.companyName);

    res.json({ brokers: brokersList });
  } catch (error) {
    console.error("Error fetching brokers:", error);
    res.status(500).json({ error: "Failed to fetch brokers" });
  }
});

// GET /api/transport-orders/routes - Get all routes for dropdown
router.get("/routes", async (req, res) => {
  try {
    const routesList = await db
      .select({
        id: transportRoutes.id,
        name: transportRoutes.name,
      })
      .from(transportRoutes)
      .orderBy(transportRoutes.name);

    res.json({ routes: routesList });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ error: "Failed to fetch routes" });
  }
});

// Validation schema
const createOrderSchema = z.object({
  enquiryId: z.number(),
  brokerId: z.number(),
  routeId: z.number(),
  amount: z.number().positive(),
  notes: z.string().optional(),
});

// Simple order creation using basic orders schema

// GET /api/transport-orders
router.get("/", async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      enquiryId,
      search,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Build where conditions
    const conditions = [eq(orders.userId, req.user!.userId)];
    
    if (search) {
      // Check if search is a number (for ID search)
      const searchNum = parseInt(search as string);
      const searchConditions = [];
      
      // Add ID search if search term is a valid number
      if (!isNaN(searchNum)) {
        searchConditions.push(eq(orders.id, searchNum));
      }
      
      // Add text-based searches here if needed (like notes)
      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions));
      }
    }
    
    if (enquiryId) {
      conditions.push(eq(orders.enquiryId, Number(enquiryId)));
    }

    if (fromDate) {
      const from = new Date(fromDate as string);
      from.setHours(0, 0, 0, 0); // Start of day
      conditions.push(gte(orders.createdAt, from));
    }

    if (toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999); // End of day
      conditions.push(lte(orders.createdAt, to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get sort column and order
    const sortColumn = sortBy === 'amount' ? orders.amount :
                       sortBy === 'id' ? orders.id :
                       orders.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [ordersList, totalResult] = await Promise.all([
      db
        .select({
          order: orders,
          enquiry: enquiries,
          lead: leads,
          broker: brokers,
          route: transportRoutes,
        })
        .from(orders)
        .leftJoin(enquiries, eq(orders.enquiryId, enquiries.id))
        .leftJoin(leads, eq(enquiries.leadId, leads.id))
        .leftJoin(brokers, eq(orders.brokerId, brokers.id))
        .leftJoin(transportRoutes, eq(orders.routeId, transportRoutes.id))
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(Number(limit))
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.count || 0;
    const pages = Math.ceil(total / Number(limit));

    res.json({
      orders: ordersList,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages,
        hasNext: Number(page) < pages,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching transport orders:", error);
    res.status(500).json({ error: "Failed to fetch transport orders" });
  }
});

// GET /api/transport-orders/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [order] = await db
      .select({
        order: orders,
        enquiry: enquiries,
        lead: leads,
        broker: brokers,
        route: transportRoutes,
      })
      .from(orders)
      .leftJoin(enquiries, eq(orders.enquiryId, enquiries.id))
      .leftJoin(leads, eq(enquiries.leadId, leads.id))
      .leftJoin(brokers, eq(orders.brokerId, brokers.id))
      .leftJoin(transportRoutes, eq(orders.routeId, transportRoutes.id))
      .where(and(eq(orders.id, Number(id)), eq(orders.userId, req.user!.userId)));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching transport order:", error);
    res.status(500).json({ error: "Failed to fetch transport order" });
  }
});

// POST /api/transport-orders
router.post("/", async (req, res) => {
  try {
    const validation = createOrderSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: "Invalid data", 
        details: validation.error 
      });
    }

    const { enquiryId, brokerId, routeId, amount, notes } = validation.data;

    // Validate that broker exists and belongs to user
    const brokerExists = await db.select({ id: brokers.id }).from(brokers)
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .limit(1);
    
    if (brokerExists.length === 0) {
      return res.status(400).json({ error: "Broker not found" });
    }

    // Validate that route exists
    const routeExists = await db.select({ id: transportRoutes.id }).from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1);
    
    if (routeExists.length === 0) {
      return res.status(400).json({ error: "Route not found" });
    }

    // Create the order
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId: req.user!.userId,
        enquiryId,
        brokerId,
        routeId,
        amount,
        notes: notes || null,
      })
      .returning();

    res.status(201).json(newOrder);
  } catch (error) {
    console.error("Error creating transport order:", error);
    res.status(500).json({ error: "Failed to create transport order" });
  }
});

// DELETE /api/transport-orders/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedOrder] = await db
      .delete(orders)
      .where(and(eq(orders.id, Number(id)), eq(orders.userId, req.user!.userId)))
      .returning();

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ message: "Order deleted successfully", order: deletedOrder });
  } catch (error) {
    console.error("Error deleting transport order:", error);
    res.status(500).json({ error: "Failed to delete transport order" });
  }
});

export default router;