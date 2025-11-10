import { Router } from 'express';
import { eq, and, or, like, gte, lte, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { leads, leadSourceEnum } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/leads - Get leads with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      source,
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
    conditions.push(eq(leads.userId, req.user!.userId));

    if (search) {
      // Check if search is a number (for ID search)
      const searchNum = parseInt(search as string);
      const searchConditions = [
        like(leads.name, `%${search}%`),
        like(leads.phone, `%${search}%`)
      ];
      
      // Add ID search if search term is a valid number
      if (!isNaN(searchNum)) {
        searchConditions.push(eq(leads.id, searchNum));
      }
      
      conditions.push(or(...searchConditions));
    }

    if (source) {
      conditions.push(eq(leads.source, source as string));
    }

    if (fromDate) {
      const from = new Date(fromDate as string);
      from.setHours(0, 0, 0, 0); // Start of day
      conditions.push(gte(leads.createdAt, from));
    }

    if (toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999); // End of day
      conditions.push(lte(leads.createdAt, to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(whereClause);

    const total = totalResult.count;

    // Get leads with pagination
    const sortColumn = sortBy === 'name' ? leads.name :
                       sortBy === 'source' ? leads.source :
                       sortBy === 'id' ? leads.id :
                       leads.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const leadsResult = await db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    res.json({
      leads: leadsResult,
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
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// GET /api/leads/:id - Get single lead
router.get('/:id', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const lead = await db.select().from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, req.user!.userId)))
      .limit(1);

    if (lead.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(lead[0]);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// POST /api/leads - Create new lead
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      alternatePhone,
      source,
      referrer
    } = req.body;

    // Basic validation
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const newLead = await db.insert(leads).values({
      userId: req.user!.userId,
      name,
      phone,
      alternatePhone,
      source: source || 'unknown',
      referrer
    }).returning();

    res.status(201).json(newLead[0]);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// PUT /api/leads/:id - Update lead
router.put('/:id', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const {
      name,
      phone,
      alternatePhone,
      source,
      referrer
    } = req.body;

    const updatedLead = await db.update(leads)
      .set({
        name,
        phone,
        alternatePhone,
        source,
        referrer,
        updatedAt: new Date()
      })
      .where(and(eq(leads.id, leadId), eq(leads.userId, req.user!.userId)))
      .returning();

    if (updatedLead.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(updatedLead[0]);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// DELETE /api/leads/:id - Delete lead
router.delete('/:id', async (req, res) => {
  try {
    const leadId = parseInt(req.params.id);
    const deletedLead = await db.delete(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, req.user!.userId)))
      .returning();

    if (deletedLead.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;