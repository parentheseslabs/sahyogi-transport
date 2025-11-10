import { Router } from 'express';
import { eq, and, or, like, gte, lte, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { enquiries, leads, customerOrders } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/enquiries - Get enquiries with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      source,
      status,
      leadId,
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
    conditions.push(eq(enquiries.userId, req.user!.userId));

    if (search) {
      // Check if search is a number (for enquiry ID search)
      const searchNum = parseInt(search as string);
      const isNumeric = !isNaN(searchNum) && searchNum.toString() === search;
      
      const searchConditions = [
        like(enquiries.from, `%${search}%`),
        like(enquiries.to, `%${search}%`),
        like(enquiries.cargoType, `%${search}%`),
        like(leads.name, `%${search}%`), // Search in customer/lead name
        like(leads.phone, `%${search}%`) // Search in phone number
      ];
      
      // Add enquiry ID search if search term is numeric
      if (isNumeric) {
        searchConditions.push(eq(enquiries.id, searchNum));
      }
      
      conditions.push(or(...searchConditions));
    }

    if (source) {
      conditions.push(eq(enquiries.source, source as string));
    }

    if (status) {
      conditions.push(eq(enquiries.status, status as string));
    }

    if (leadId) {
      conditions.push(eq(enquiries.leadId, parseInt(leadId as string)));
    }

    if (fromDate) {
      conditions.push(gte(enquiries.createdAt, new Date(fromDate as string)));
    }

    if (toDate) {
      conditions.push(lte(enquiries.createdAt, new Date(toDate as string)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(enquiries)
      .leftJoin(leads, eq(enquiries.leadId, leads.id))
      .where(whereClause);

    const total = totalResult.count;

    // Get enquiries with pagination
    const sortColumn = sortBy === 'from' ? enquiries.from :
                       sortBy === 'to' ? enquiries.to :
                       sortBy === 'source' ? enquiries.source :
                       enquiries.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const enquiriesResult = await db
      .select({
        enquiry: enquiries,
        leadName: leads.name,
        leadPhone: leads.phone,
        customerOrderId: customerOrders.id
      })
      .from(enquiries)
      .leftJoin(leads, eq(enquiries.leadId, leads.id))
      .leftJoin(customerOrders, eq(enquiries.id, customerOrders.enquiryId))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    // Transform to flat structure
    const formattedEnquiries = enquiriesResult.map(row => ({
      ...row.enquiry,
      leadName: row.leadName || null,
      leadPhone: row.leadPhone || null,
      customerOrderId: row.customerOrderId || null
    }));

    res.json({
      enquiries: formattedEnquiries,
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
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch enquiries' });
  }
});

// GET /api/enquiries/:id - Get single enquiry
router.get('/:id', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const enquiry = await db.select().from(enquiries)
      .where(and(eq(enquiries.id, enquiryId), eq(enquiries.userId, req.user!.userId)))
      .limit(1);

    if (enquiry.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(enquiry[0]);
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({ error: 'Failed to fetch enquiry' });
  }
});

// POST /api/enquiries - Create new enquiry
router.post('/', async (req, res) => {
  try {
    const {
      leadId,
      from,
      to,
      cargoType,
      cargoWeight,
      remarks,
      source,
      referrer
    } = req.body;

    // Basic validation
    if (!leadId || !from || !to || !cargoType) {
      return res.status(400).json({ error: 'Lead ID, from, to, and cargo type are required' });
    }

    const newEnquiry = await db.insert(enquiries).values({
      userId: req.user!.userId,
      leadId: parseInt(leadId),
      from,
      to,
      cargoType,
      cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
      remarks,
      source: source || 'unknown',
      referrer
    }).returning();

    res.status(201).json(newEnquiry[0]);
  } catch (error) {
    console.error('Error creating enquiry:', error);
    res.status(500).json({ error: 'Failed to create enquiry' });
  }
});

// PUT /api/enquiries/:id - Update enquiry
router.put('/:id', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const {
      leadId,
      from,
      to,
      cargoType,
      cargoWeight,
      remarks,
      source,
      referrer
    } = req.body;

    const updatedEnquiry = await db.update(enquiries)
      .set({
        leadId: leadId ? parseInt(leadId) : undefined,
        from,
        to,
        cargoType,
        cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
        remarks,
        source,
        referrer,
        updatedAt: new Date()
      })
      .where(and(eq(enquiries.id, enquiryId), eq(enquiries.userId, req.user!.userId)))
      .returning();

    if (updatedEnquiry.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(updatedEnquiry[0]);
  } catch (error) {
    console.error('Error updating enquiry:', error);
    res.status(500).json({ error: 'Failed to update enquiry' });
  }
});

// DELETE /api/enquiries/:id - Delete enquiry
router.delete('/:id', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const deletedEnquiry = await db.delete(enquiries)
      .where(and(eq(enquiries.id, enquiryId), eq(enquiries.userId, req.user!.userId)))
      .returning();

    if (deletedEnquiry.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ error: 'Failed to delete enquiry' });
  }
});

export default router;
