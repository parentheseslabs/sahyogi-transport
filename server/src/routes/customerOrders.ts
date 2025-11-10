import { Router } from 'express';
import { eq, and, or, like, gte, lte, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { customerOrders, enquiries, quotes, leads, orders } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/customer-orders - Get customer orders with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      enquiryId,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    // Filter by userId from authenticated user
    conditions.push(eq(customerOrders.userId, req.user!.userId));

    if (search) {
      // Check if search is a number (for ID search)
      const searchNum = parseInt(search as string);
      const searchConditions = [];
      
      // Add ID search if search term is a valid number
      if (!isNaN(searchNum)) {
        searchConditions.push(eq(customerOrders.id, searchNum));
      }
      
      // Add text-based searches here if needed
      if (searchConditions.length > 0) {
        conditions.push(or(...searchConditions));
      }
    }

    if (status) {
      conditions.push(eq(customerOrders.status, status as string));
    }

    if (enquiryId) {
      conditions.push(eq(customerOrders.enquiryId, parseInt(enquiryId as string)));
    }

    if (fromDate) {
      const from = new Date(fromDate as string);
      from.setHours(0, 0, 0, 0); // Start of day
      conditions.push(gte(customerOrders.createdAt, from));
    }

    if (toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999); // End of day
      conditions.push(lte(customerOrders.createdAt, to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(customerOrders)
      .where(whereClause);

    const total = totalResult.count;

    // Get customer orders with pagination
    const sortColumn = sortBy === 'status' ? customerOrders.status :
                       sortBy === 'id' ? customerOrders.id :
                       customerOrders.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const ordersResult = await db
      .select({
        customerOrder: customerOrders,
        enquiry: enquiries,
        quote: quotes,
        lead: leads
      })
      .from(customerOrders)
      .leftJoin(enquiries, eq(customerOrders.enquiryId, enquiries.id))
      .leftJoin(quotes, eq(customerOrders.quoteId, quotes.id))
      .leftJoin(leads, eq(enquiries.leadId, leads.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    // Transform to flat structure
    const formattedOrders = ordersResult.map(row => ({
      ...row.customerOrder,
      enquiryFrom: row.enquiry?.from || null,
      enquiryTo: row.enquiry?.to || null,
      cargoType: row.enquiry?.cargoType || null,
      leadName: row.lead?.name || null,
      quoteAmount: row.quote?.quotationAmount || null,
      quoteStatus: row.quote?.status || null
    }));

    res.json({
      orders: formattedOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// GET /api/customer-orders/:id - Get single customer order with details
router.get('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    const orderResult = await db
      .select({
        customerOrder: customerOrders,
        enquiry: enquiries,
        quote: quotes,
        lead: leads
      })
      .from(customerOrders)
      .leftJoin(enquiries, eq(customerOrders.enquiryId, enquiries.id))
      .leftJoin(quotes, eq(customerOrders.quoteId, quotes.id))
      .leftJoin(leads, eq(enquiries.leadId, leads.id))
      .where(and(eq(customerOrders.id, orderId), eq(customerOrders.userId, req.user!.userId)))
      .limit(1);

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Customer order not found' });
    }

    const orderData = orderResult[0];

    // Get transport orders for this enquiry
    const transportOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.enquiryId, orderData.customerOrder.enquiryId), eq(orders.userId, req.user!.userId)));

    const result = {
      ...orderData.customerOrder,
      enquiry: orderData.enquiry,
      quote: orderData.quote,
      lead: orderData.lead,
      transportOrders: transportOrders
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching customer order:', error);
    res.status(500).json({ error: 'Failed to fetch customer order' });
  }
});

// POST /api/customer-orders - Create new customer order (promote enquiry)
router.post('/', async (req, res) => {
  try {
    const {
      enquiryId,
      quoteId,
      notes
    } = req.body;

    // Basic validation
    if (!enquiryId || !quoteId) {
      return res.status(400).json({ error: 'Enquiry ID and Quote ID are required' });
    }

    // Verify enquiry belongs to user
    const enquiryResult = await db
      .select()
      .from(enquiries)
      .where(and(eq(enquiries.id, parseInt(enquiryId)), eq(enquiries.userId, req.user!.userId)))
      .limit(1);

    if (enquiryResult.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Verify quote belongs to this enquiry and user
    const quoteResult = await db
      .select()
      .from(quotes)
      .where(and(
        eq(quotes.id, parseInt(quoteId)), 
        eq(quotes.enquiryId, parseInt(enquiryId)), 
        eq(quotes.userId, req.user!.userId)
      ))
      .limit(1);

    if (quoteResult.length === 0) {
      return res.status(404).json({ error: 'Quote not found for this enquiry' });
    }

    // Check if customer order already exists for this enquiry
    const existingOrder = await db
      .select()
      .from(customerOrders)
      .where(and(eq(customerOrders.enquiryId, parseInt(enquiryId)), eq(customerOrders.userId, req.user!.userId)))
      .limit(1);

    if (existingOrder.length > 0) {
      return res.status(400).json({ error: 'Customer order already exists for this enquiry' });
    }

    // Start transaction to create order and update enquiry status
    const result = await db.transaction(async (tx) => {
      // Create customer order
      const newOrder = await tx.insert(customerOrders).values({
        userId: req.user!.userId,
        enquiryId: parseInt(enquiryId),
        quoteId: parseInt(quoteId),
        notes,
        status: 'active'
      }).returning();

      // Update enquiry status to accepted
      await tx.update(enquiries)
        .set({ 
          status: 'accepted',
          updatedAt: new Date()
        })
        .where(and(eq(enquiries.id, parseInt(enquiryId)), eq(enquiries.userId, req.user!.userId)));

      // Update quote status to accepted
      await tx.update(quotes)
        .set({ 
          status: 'accepted',
          updatedAt: new Date()
        })
        .where(and(eq(quotes.id, parseInt(quoteId)), eq(quotes.userId, req.user!.userId)));

      return newOrder[0];
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating customer order:', error);
    res.status(500).json({ error: 'Failed to create customer order' });
  }
});

// PUT /api/customer-orders/:id - Update customer order
router.put('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const {
      status,
      notes
    } = req.body;

    const updatedOrder = await db.update(customerOrders)
      .set({
        status,
        notes,
        updatedAt: new Date()
      })
      .where(and(eq(customerOrders.id, orderId), eq(customerOrders.userId, req.user!.userId)))
      .returning();

    if (updatedOrder.length === 0) {
      return res.status(404).json({ error: 'Customer order not found' });
    }

    res.json(updatedOrder[0]);
  } catch (error) {
    console.error('Error updating customer order:', error);
    res.status(500).json({ error: 'Failed to update customer order' });
  }
});

// DELETE /api/customer-orders/:id - Delete customer order
router.delete('/:id', async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    
    // Get the customer order first to get enquiry ID
    const orderResult = await db
      .select()
      .from(customerOrders)
      .where(and(eq(customerOrders.id, orderId), eq(customerOrders.userId, req.user!.userId)))
      .limit(1);

    if (orderResult.length === 0) {
      return res.status(404).json({ error: 'Customer order not found' });
    }

    const order = orderResult[0];

    // Start transaction to delete order and update enquiry status
    await db.transaction(async (tx) => {
      // Delete customer order
      await tx.delete(customerOrders)
        .where(and(eq(customerOrders.id, orderId), eq(customerOrders.userId, req.user!.userId)));

      // Update enquiry status back to pending
      await tx.update(enquiries)
        .set({ 
          status: 'pending',
          updatedAt: new Date()
        })
        .where(and(eq(enquiries.id, order.enquiryId), eq(enquiries.userId, req.user!.userId)));
    });

    res.json({ message: 'Customer order deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer order:', error);
    res.status(500).json({ error: 'Failed to delete customer order' });
  }
});

export default router;