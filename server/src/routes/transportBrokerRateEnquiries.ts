import { Router } from 'express';
import { eq, and, or, like, gte, lte, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { transportBrokerRateEnquiries, transportRoutes, transportRouteLocations } from '../db/schema';
import { brokerTransportRateBids } from '../db/schema/brokerTransportRates';
import { brokers } from '../db/schema/brokers';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Helper function to calculate L1 and L2 rates for a list of enquiries
const addL1L2Rates = async (enquiries: any[]) => {
  if (!enquiries || enquiries.length === 0) {
    return enquiries;
  }

  const enquiryIds = enquiries.map(e => e.id).filter(id => id != null && !isNaN(id));
  
  if (enquiryIds.length === 0) {
    return enquiries.map(enquiry => ({
      ...enquiry,
      l1Rate: null,
      l2Rate: null,
      l1Broker: null,
      l2Broker: null,
      bidCount: 0
    }));
  }

  try {
    // Get all bids for these enquiries (first without joins to simplify)
    const bidsResult = await db
      .select()
      .from(brokerTransportRateBids)
      .where(or(...enquiryIds.map(id => eq(brokerTransportRateBids.enquiryId, id))));

    if (bidsResult.length === 0) {
      return enquiries.map(enquiry => ({
        ...enquiry,
        l1Rate: null,
        l2Rate: null,
        l1Broker: null,
        l2Broker: null,
        bidCount: 0
      }));
    }

    // Get unique broker IDs from bids
    const brokerIds = [...new Set(bidsResult.map(bid => bid.brokerId))];
    
    // Get broker information separately
    const brokersResult = brokerIds.length > 0 ? await db
      .select()
      .from(brokers)
      .where(or(...brokerIds.map(id => eq(brokers.id, id)))) : [];

    // Create broker lookup map
    const brokerMap = new Map();
    brokersResult.forEach(broker => {
      // Use companyName if available, otherwise personName, otherwise fallback to Broker ID
      const displayName = broker.companyName || broker.personName || `Broker ${broker.id}`;
      brokerMap.set(broker.id, displayName);
    });

    // Group bids by enquiry ID and calculate L1/L2
    const bidsByEnquiry = new Map();
    bidsResult.forEach(bid => {
      if (!bidsByEnquiry.has(bid.enquiryId)) {
        bidsByEnquiry.set(bid.enquiryId, []);
      }
      bidsByEnquiry.get(bid.enquiryId).push({
        rate: bid.rate,
        brokerName: brokerMap.get(bid.brokerId) || `Broker ${bid.brokerId}`
      });
    });

    // Add L1 and L2 rates to each enquiry
    return enquiries.map(enquiry => {
      const enquiryBids = bidsByEnquiry.get(enquiry.id) || [];
      enquiryBids.sort((a, b) => a.rate - b.rate); // Sort ascending to get lowest rates
      
      return {
        ...enquiry,
        l1Rate: enquiryBids.length > 0 ? enquiryBids[0].rate : null,
        l2Rate: enquiryBids.length > 1 ? enquiryBids[1].rate : null,
        l1Broker: enquiryBids.length > 0 ? enquiryBids[0].brokerName : null,
        l2Broker: enquiryBids.length > 1 ? enquiryBids[1].brokerName : null,
        bidCount: enquiryBids.length
      };
    });
  } catch (error) {
    console.error('Error in addL1L2Rates:', error);
    // Return enquiries with null L1/L2 values if there's an error
    return enquiries.map(enquiry => ({
      ...enquiry,
      l1Rate: null,
      l2Rate: null,
      l1Broker: null,
      l2Broker: null,
      bidCount: 0
    }));
  }
};

// GET /api/transport-broker-rate-enquiries - Get rate enquiries with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
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

    if (search) {
      // Check if search is a number (for ID search)
      const searchNum = parseInt(search as string);
      const searchConditions = [
        like(transportBrokerRateEnquiries.cargoType, `%${search}%`),
        like(transportBrokerRateEnquiries.remarks, `%${search}%`)
      ];
      
      // Add ID search if search term is a valid number
      if (!isNaN(searchNum)) {
        searchConditions.push(eq(transportBrokerRateEnquiries.id, searchNum));
      }
      
      conditions.push(or(...searchConditions));
    }

    if (status) {
      conditions.push(eq(transportBrokerRateEnquiries.status, status as string));
    }

    if (fromDate) {
      const from = new Date(fromDate as string);
      from.setHours(0, 0, 0, 0); // Start of day
      conditions.push(gte(transportBrokerRateEnquiries.createdAt, from));
    }

    if (toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999); // End of day
      conditions.push(lte(transportBrokerRateEnquiries.createdAt, to));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(transportBrokerRateEnquiries)
      .where(whereClause);

    const total = totalResult.count;

    // Get rate enquiries with pagination
    const sortColumn = sortBy === 'cargoType' ? transportBrokerRateEnquiries.cargoType :
                       sortBy === 'cargoWeight' ? transportBrokerRateEnquiries.cargoWeight :
                       sortBy === 'transportDate' ? transportBrokerRateEnquiries.transportDate :
                       sortBy === 'id' ? transportBrokerRateEnquiries.id :
                       transportBrokerRateEnquiries.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const enquiriesResult = await db
      .select({
        rateEnquiry: transportBrokerRateEnquiries,
        routeName: transportRoutes.name
      })
      .from(transportBrokerRateEnquiries)
      .leftJoin(transportRoutes, eq(transportBrokerRateEnquiries.routeId, transportRoutes.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    // Transform to flat structure
    const formattedEnquiries = enquiriesResult.map(row => ({
      ...row.rateEnquiry,
      routeName: row.routeName || null
    }));

    // Add L1 and L2 rates
    const enquiriesWithL1L2 = await addL1L2Rates(formattedEnquiries);

    res.json({
      enquiries: enquiriesWithL1L2,
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
    console.error('Error fetching transport broker rate enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch transport broker rate enquiries' });
  }
});

// GET /api/transport-broker-rate-enquiries/:id - Get single rate enquiry
router.get('/:id', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const enquiry = await db.select().from(transportBrokerRateEnquiries)
      .where(eq(transportBrokerRateEnquiries.id, enquiryId))
      .limit(1);

    if (enquiry.length === 0) {
      return res.status(404).json({ error: 'Rate enquiry not found' });
    }

    res.json(enquiry[0]);
  } catch (error) {
    console.error('Error fetching rate enquiry:', error);
    res.status(500).json({ error: 'Failed to fetch rate enquiry' });
  }
});

// POST /api/transport-broker-rate-enquiries - Create new rate enquiry
router.post('/', async (req, res) => {
  try {
    const {
      route_id,
      routeId,
      cargoType,
      cargoWeight,
      transportDate,
      remarks,
      status = 'open'
    } = req.body;

    // Use route_id or routeId
    const finalRouteId = route_id || routeId;

    // Basic validation
    if (!finalRouteId || !cargoType) {
      return res.status(400).json({ error: 'Route ID and cargo type are required' });
    }

    const newEnquiry = await db.insert(transportBrokerRateEnquiries).values({
      routeId: parseInt(finalRouteId),
      cargoType,
      cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
      transportDate: transportDate ? new Date(transportDate) : null,
      remarks
    }).returning();

    res.status(201).json(newEnquiry[0]);
  } catch (error) {
    console.error('Error creating rate enquiry:', error);
    res.status(500).json({ error: 'Failed to create rate enquiry' });
  }
});

// PUT /api/transport-broker-rate-enquiries/:id - Update rate enquiry
router.put('/:id', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const {
      routeId,
      cargoType,
      cargoWeight,
      transportDate,
      remarks,
      status
    } = req.body;

    const updatedEnquiry = await db.update(transportBrokerRateEnquiries)
      .set({
        routeId: routeId ? parseInt(routeId) : undefined,
        cargoType,
        cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
        transportDate: transportDate ? new Date(transportDate) : null,
        remarks,
        updatedAt: new Date()
      })
      .where(eq(transportBrokerRateEnquiries.id, enquiryId))
      .returning();

    if (updatedEnquiry.length === 0) {
      return res.status(404).json({ error: 'Rate enquiry not found' });
    }

    res.json(updatedEnquiry[0]);
  } catch (error) {
    console.error('Error updating rate enquiry:', error);
    res.status(500).json({ error: 'Failed to update rate enquiry' });
  }
});

// DELETE /api/transport-broker-rate-enquiries/:id - Delete rate enquiry
router.delete('/:id', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.id);
    const deletedEnquiry = await db.delete(transportBrokerRateEnquiries)
      .where(eq(transportBrokerRateEnquiries.id, enquiryId))
      .returning();

    if (deletedEnquiry.length === 0) {
      return res.status(404).json({ error: 'Rate enquiry not found' });
    }

    res.json({ message: 'Rate enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting rate enquiry:', error);
    res.status(500).json({ error: 'Failed to delete rate enquiry' });
  }
});

// GET /api/transport-broker-rate-enquiries/search/by-route - Search broker enquiries by route and cargo type
router.get('/search/by-route', async (req, res) => {
  try {
    const {
      from,
      to,
      cargoType,
      page = '1',
      limit = '10'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    let whereClause = undefined;

    // Build conditions based on available filters
    const conditions = [];

    if (cargoType) {
      conditions.push(like(transportBrokerRateEnquiries.cargoType, `%${cargoType}%`));
    }

    if (conditions.length > 0) {
      whereClause = and(...conditions);
    }

    // Get broker enquiries with route details
    const enquiriesResult = await db
      .select({
        rateEnquiry: transportBrokerRateEnquiries,
        routeName: transportRoutes.name,
        routeLocations: transportRouteLocations
      })
      .from(transportBrokerRateEnquiries)
      .leftJoin(transportRoutes, eq(transportBrokerRateEnquiries.routeId, transportRoutes.id))
      .leftJoin(transportRouteLocations, eq(transportRoutes.id, transportRouteLocations.routeId))
      .where(whereClause)
      .orderBy(desc(transportBrokerRateEnquiries.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Group by enquiry and collect route locations
    const enquiriesMap = new Map();
    
    enquiriesResult.forEach(row => {
      const enquiryId = row.rateEnquiry.id;
      
      if (!enquiriesMap.has(enquiryId)) {
        enquiriesMap.set(enquiryId, {
          ...row.rateEnquiry,
          routeName: row.routeName || null,
          routeLocations: []
        });
      }
      
      if (row.routeLocations) {
        enquiriesMap.get(enquiryId).routeLocations.push(row.routeLocations);
      }
    });

    const formattedEnquiries = Array.from(enquiriesMap.values());

    // Filter by from/to locations if provided
    let filteredEnquiries = formattedEnquiries;
    
    if (from || to) {
      filteredEnquiries = formattedEnquiries.filter(enquiry => {
        const locations = enquiry.routeLocations || [];
        const loadLocations = locations.filter(loc => loc.stopType === 'load');
        const unloadLocations = locations.filter(loc => loc.stopType === 'unload');
        
        let matchesFrom = !from;
        let matchesTo = !to;
        
        if (from) {
          matchesFrom = loadLocations.some(loc => 
            loc.remarks && loc.remarks.toLowerCase().includes(from.toLowerCase())
          );
        }
        
        if (to) {
          matchesTo = unloadLocations.some(loc => 
            loc.remarks && loc.remarks.toLowerCase().includes(to.toLowerCase())
          );
        }
        
        return matchesFrom && matchesTo;
      });
    }

    // Add L1 and L2 rates to filtered enquiries
    const enquiriesWithL1L2 = await addL1L2Rates(filteredEnquiries);

    // Get total count for pagination
    const total = enquiriesWithL1L2.length;

    res.json({
      enquiries: enquiriesWithL1L2,
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
    console.error('Error searching broker enquiries by route:', error);
    res.status(500).json({ error: 'Failed to search broker enquiries' });
  }
});

export default router;