import { Router } from 'express';
import { eq, and, or, like, gte, lte, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { brokers, brokerRegion, brokerVehicleTypes, orders, brokerTransportRateBids } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/brokers - Get brokers with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      brokerType,
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
    conditions.push(eq(brokers.userId, req.user!.userId));

    if (search) {
      // Check if search is a number (for ID search)
      const searchNum = parseInt(search as string);
      const searchConditions = [
        like(brokers.companyName, `%${search}%`),
        like(brokers.personName, `%${search}%`),
        like(brokers.city, `%${search}%`)
      ];
      
      // Add ID search if search term is a valid number
      if (!isNaN(searchNum)) {
        searchConditions.push(eq(brokers.id, searchNum));
      }
      
      conditions.push(or(...searchConditions));
    }

    if (fromDate) {
      const from = new Date(fromDate as string);
      from.setHours(0, 0, 0, 0); // Start of day
      conditions.push(gte(brokers.createdAt, from));
    }

    if (toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999); // End of day
      conditions.push(lte(brokers.createdAt, to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(brokers)
      .where(whereClause);

    const total = totalResult.count;

    // Get brokers with pagination
    const sortColumn = sortBy === 'companyName' ? brokers.companyName :
                       sortBy === 'personName' ? brokers.personName :
                       sortBy === 'city' ? brokers.city :
                       sortBy === 'id' ? brokers.id :
                       brokers.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const brokersResult = await db
      .select()
      .from(brokers)
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    res.json({
      brokers: brokersResult,
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
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// GET /api/brokers/:id - Get single broker
router.get('/:id', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const broker = await db.select().from(brokers)
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .limit(1);

    if (broker.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    res.json(broker[0]);
  } catch (error) {
    console.error('Error fetching broker:', error);
    res.status(500).json({ error: 'Failed to fetch broker' });
  }
});

// POST /api/brokers - Create new broker
router.post('/', async (req, res) => {
  try {
    const {
      companyName,
      personName,
      phone,
      alternatePhone,
      city,
      remarks,
      referrer,
      regions = [],
      vehicleTypes = []
    } = req.body;

    // Basic validation
    if (!companyName || !phone) {
      return res.status(400).json({ error: 'Company name and phone are required' });
    }

    // Create broker first
    const newBroker = await db.insert(brokers).values({
      userId: req.user!.userId,
      companyName,
      personName,
      phone,
      alternatePhone,
      city,
      remarks,
      referrer
    }).returning();

    const brokerId = newBroker[0].id;

    // Insert regions if provided
    if (regions.length > 0) {
      const regionValues = regions.map((region: any) => ({
        brokerId,
        region: region.region || null,
        state: region.state || null,
        city: region.city || null
      }));
      await db.insert(brokerRegion).values(regionValues);
    }

    // Insert vehicle types if provided
    if (vehicleTypes.length > 0) {
      const vehicleTypeValues = vehicleTypes.map((vt: any) => ({
        brokerId,
        vehicleType: typeof vt === 'string' ? vt : vt.vehicleType
      }));
      await db.insert(brokerVehicleTypes).values(vehicleTypeValues);
    }

    res.status(201).json(newBroker[0]);
  } catch (error) {
    console.error('Error creating broker:', error);
    res.status(500).json({ error: 'Failed to create broker' });
  }
});

// PUT /api/brokers/:id - Update broker
router.put('/:id', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    const {
      companyName,
      personName,
      phone,
      alternatePhone,
      city,
      remarks,
      referrer,
      regions = [],
      vehicleTypes = []
    } = req.body;

    // Update main broker record
    const updatedBroker = await db.update(brokers)
      .set({
        companyName,
        personName,
        phone,
        alternatePhone,
        city,
        remarks,
        referrer,
        updatedAt: new Date()
      })
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .returning();

    if (updatedBroker.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Delete existing regions and vehicle types
    await db.delete(brokerRegion).where(eq(brokerRegion.brokerId, brokerId));
    await db.delete(brokerVehicleTypes).where(eq(brokerVehicleTypes.brokerId, brokerId));

    // Insert new regions if provided
    if (regions.length > 0) {
      const regionValues = regions.map((region: any) => ({
        brokerId,
        region: region.region || null,
        state: region.state || null,
        city: region.city || null
      }));
      await db.insert(brokerRegion).values(regionValues);
    }

    // Insert new vehicle types if provided
    if (vehicleTypes.length > 0) {
      const vehicleTypeValues = vehicleTypes.map((vt: any) => ({
        brokerId,
        vehicleType: typeof vt === 'string' ? vt : vt.vehicleType
      }));
      await db.insert(brokerVehicleTypes).values(vehicleTypeValues);
    }

    res.json(updatedBroker[0]);
  } catch (error) {
    console.error('Error updating broker:', error);
    res.status(500).json({ error: 'Failed to update broker' });
  }
});

// GET /api/brokers/:id/regions - Get broker regions
router.get('/:id/regions', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    // First check if broker exists and belongs to user
    const broker = await db.select().from(brokers)
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .limit(1);

    if (broker.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    const regions = await db.select().from(brokerRegion)
      .where(eq(brokerRegion.brokerId, brokerId));

    res.json({ regions });
  } catch (error) {
    console.error('Error fetching broker regions:', error);
    res.status(500).json({ error: 'Failed to fetch broker regions' });
  }
});

// GET /api/brokers/:id/vehicle-types - Get broker vehicle types
router.get('/:id/vehicle-types', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    // First check if broker exists and belongs to user
    const broker = await db.select().from(brokers)
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .limit(1);

    if (broker.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    const vehicleTypes = await db.select().from(brokerVehicleTypes)
      .where(eq(brokerVehicleTypes.brokerId, brokerId));

    res.json({ vehicleTypes });
  } catch (error) {
    console.error('Error fetching broker vehicle types:', error);
    res.status(500).json({ error: 'Failed to fetch broker vehicle types' });
  }
});

// DELETE /api/brokers/:id - Delete broker (with restrict policy)
router.delete('/:id', async (req, res) => {
  try {
    const brokerId = parseInt(req.params.id);
    
    // First verify broker exists and belongs to user
    const brokerExists = await db
      .select({ id: brokers.id })
      .from(brokers)
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .limit(1);

    if (brokerExists.length === 0) {
      return res.status(404).json({ error: 'Broker not found' });
    }

    // Check for dependencies - transport orders
    const ordersCount = await db
      .select({ count: count() })
      .from(orders)
      .where(and(eq(orders.brokerId, brokerId), eq(orders.userId, req.user!.userId)));

    if (ordersCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete broker', 
        message: `Broker has ${ordersCount[0].count} associated transport order(s). Please remove these orders first before deleting the broker.`
      });
    }

    // Check for dependencies - broker rate bids
    const bidsCount = await db
      .select({ count: count() })
      .from(brokerTransportRateBids)
      .where(eq(brokerTransportRateBids.brokerId, brokerId));

    if (bidsCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete broker', 
        message: `Broker has ${bidsCount[0].count} associated rate bid(s). Please remove these bids first before deleting the broker.`
      });
    }

    // If no dependencies, proceed with deletion
    const deletedBroker = await db.delete(brokers)
      .where(and(eq(brokers.id, brokerId), eq(brokers.userId, req.user!.userId)))
      .returning();

    res.json({ message: 'Broker deleted successfully' });
  } catch (error) {
    console.error('Error deleting broker:', error);
    res.status(500).json({ error: 'Failed to delete broker' });
  }
});

export default router;