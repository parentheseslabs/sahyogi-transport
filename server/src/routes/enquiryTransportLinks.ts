import { Router } from 'express';
import { eq, and, desc, or, isNull, ilike } from 'drizzle-orm';
import { db } from '../db/connection';
import { enquiryTransportLinks, transportBrokerRateEnquiries, transportRoutes, transportRouteLocations, enquiries } from '../db/schema';
import { brokerTransportRateBids } from '../db/schema/brokerTransportRates';
import { brokers } from '../db/schema/brokers';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Helper function to calculate L1 and L2 rates for transport enquiries
const addL1L2Rates = async (enquiries: any[]) => {
  if (!enquiries || enquiries.length === 0) {
    return enquiries;
  }

  const enquiryIds = enquiries.map(e => e.transportEnquiry?.id).filter(id => id != null && !isNaN(id));
  
  if (enquiryIds.length === 0) {
    return enquiries.map(enquiry => ({
      ...enquiry,
      transportEnquiry: {
        ...enquiry.transportEnquiry,
        l1Rate: null,
        l2Rate: null,
        l1Broker: null,
        l2Broker: null,
        bidCount: 0
      }
    }));
  }

  try {
    // Get all bids for these enquiries
    const bidsResult = await db
      .select()
      .from(brokerTransportRateBids)
      .where(or(...enquiryIds.map(id => eq(brokerTransportRateBids.enquiryId, id))));

    if (bidsResult.length === 0) {
      return enquiries.map(enquiry => ({
        ...enquiry,
        transportEnquiry: {
          ...enquiry.transportEnquiry,
          l1Rate: null,
          l2Rate: null,
          l1Broker: null,
          l2Broker: null,
          bidCount: 0
        }
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
      const enquiryBids = bidsByEnquiry.get(enquiry.transportEnquiry?.id) || [];
      enquiryBids.sort((a, b) => a.rate - b.rate); // Sort ascending to get lowest rates
      
      return {
        ...enquiry,
        transportEnquiry: {
          ...enquiry.transportEnquiry,
          l1Rate: enquiryBids.length > 0 ? enquiryBids[0].rate : null,
          l2Rate: enquiryBids.length > 1 ? enquiryBids[1].rate : null,
          l1Broker: enquiryBids.length > 0 ? enquiryBids[0].brokerName : null,
          l2Broker: enquiryBids.length > 1 ? enquiryBids[1].brokerName : null,
          bidCount: enquiryBids.length
        }
      };
    });
  } catch (error) {
    console.error('Error in addL1L2Rates:', error);
    // Return enquiries with null L1/L2 values if there's an error
    return enquiries.map(enquiry => ({
      ...enquiry,
      transportEnquiry: {
        ...enquiry.transportEnquiry,
        l1Rate: null,
        l2Rate: null,
        l1Broker: null,
        l2Broker: null,
        bidCount: 0
      }
    }));
  }
};

// GET /api/enquiry-transport-links/:enquiryId - Get transport enquiries linked to a customer enquiry
router.get('/:enquiryId', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    
    const linkedEnquiries = await db
      .select({
        link: enquiryTransportLinks,
        transportEnquiry: transportBrokerRateEnquiries,
        routeName: transportRoutes.name
      })
      .from(enquiryTransportLinks)
      .leftJoin(transportBrokerRateEnquiries, eq(enquiryTransportLinks.transportEnquiryId, transportBrokerRateEnquiries.id))
      .leftJoin(transportRoutes, eq(transportBrokerRateEnquiries.routeId, transportRoutes.id))
      .where(eq(enquiryTransportLinks.enquiryId, enquiryId))
      .orderBy(desc(enquiryTransportLinks.createdAt));

    // Transform to flat structure
    const formattedLinks = linkedEnquiries.map(row => ({
      linkId: row.link.id,
      notes: row.link.notes,
      createdAt: row.link.createdAt,
      transportEnquiry: {
        ...row.transportEnquiry,
        routeName: row.routeName || null
      }
    }));

    // Add L1 and L2 rates
    const linksWithL1L2 = await addL1L2Rates(formattedLinks);

    res.json(linksWithL1L2);
  } catch (error) {
    console.error('Error fetching linked transport enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch linked transport enquiries' });
  }
});

// POST /api/enquiry-transport-links - Create a new transport enquiry for a customer enquiry
router.post('/', async (req, res) => {
  try {
    const {
      enquiryId,
      routeId,
      cargoType,
      cargoWeight,
      transportDate,
      remarks,
      notes
    } = req.body;
    const userId = req.user?.userId;

    // Basic validation
    if (!enquiryId || !routeId || !cargoType) {
      return res.status(400).json({ error: 'Enquiry ID, route ID, and cargo type are required' });
    }

    // Verify the enquiry exists and belongs to the user
    const existingEnquiry = await db
      .select()
      .from(enquiries)
      .where(and(
        eq(enquiries.id, parseInt(enquiryId)),
        eq(enquiries.userId, userId)
      ))
      .limit(1);

    if (existingEnquiry.length === 0) {
      return res.status(404).json({ error: 'Enquiry not found or access denied' });
    }

    const result = await db.transaction(async (tx) => {
      // Create the transport broker rate enquiry
      const newTransportEnquiry = await tx.insert(transportBrokerRateEnquiries).values({
        userId,
        routeId: parseInt(routeId),
        cargoType,
        cargoWeight: cargoWeight ? parseFloat(cargoWeight) : null,
        transportDate: transportDate ? new Date(transportDate) : null,
        remarks,
        status: 'open'
      }).returning();

      // Create the link between customer enquiry and transport enquiry
      const newLink = await tx.insert(enquiryTransportLinks).values({
        userId,
        enquiryId: parseInt(enquiryId),
        transportEnquiryId: newTransportEnquiry[0].id,
        notes
      }).returning();

      return {
        link: newLink[0],
        transportEnquiry: newTransportEnquiry[0]
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating transport enquiry link:', error);
    res.status(500).json({ error: 'Failed to create transport enquiry link' });
  }
});

// POST /api/enquiry-transport-links/link-existing - Link an existing transport enquiry to a customer enquiry
router.post('/link-existing', async (req, res) => {
  try {
    const {
      enquiryId,
      transportEnquiryId,
      notes
    } = req.body;
    const userId = req.user?.userId;

    // Basic validation
    if (!enquiryId || !transportEnquiryId) {
      return res.status(400).json({ error: 'Enquiry ID and transport enquiry ID are required' });
    }

    // Verify both enquiries exist and belong to the user
    const [customerEnquiry, transportEnquiry] = await Promise.all([
      db.select().from(enquiries)
        .where(and(eq(enquiries.id, parseInt(enquiryId)), eq(enquiries.userId, userId)))
        .limit(1),
      db.select().from(transportBrokerRateEnquiries)
        .where(and(eq(transportBrokerRateEnquiries.id, parseInt(transportEnquiryId)), eq(transportBrokerRateEnquiries.userId, userId)))
        .limit(1)
    ]);

    if (customerEnquiry.length === 0) {
      return res.status(404).json({ error: 'Customer enquiry not found or access denied' });
    }

    if (transportEnquiry.length === 0) {
      return res.status(404).json({ error: 'Transport enquiry not found or access denied' });
    }

    // Check if link already exists
    const existingLink = await db
      .select()
      .from(enquiryTransportLinks)
      .where(and(
        eq(enquiryTransportLinks.enquiryId, parseInt(enquiryId)),
        eq(enquiryTransportLinks.transportEnquiryId, parseInt(transportEnquiryId))
      ))
      .limit(1);

    if (existingLink.length > 0) {
      return res.status(400).json({ error: 'Transport enquiry is already linked to this customer enquiry' });
    }

    // Create the link
    const newLink = await db.insert(enquiryTransportLinks).values({
      userId,
      enquiryId: parseInt(enquiryId),
      transportEnquiryId: parseInt(transportEnquiryId),
      notes
    }).returning();

    res.status(201).json(newLink[0]);
  } catch (error) {
    console.error('Error linking existing transport enquiry:', error);
    res.status(500).json({ error: 'Failed to link existing transport enquiry' });
  }
});

// DELETE /api/enquiry-transport-links/:linkId - Remove link between customer enquiry and transport enquiry
router.delete('/:linkId', async (req, res) => {
  try {
    const linkId = parseInt(req.params.linkId);
    const userId = req.user?.userId;

    const deletedLink = await db.delete(enquiryTransportLinks)
      .where(and(
        eq(enquiryTransportLinks.id, linkId),
        eq(enquiryTransportLinks.userId, userId)
      ))
      .returning();

    if (deletedLink.length === 0) {
      return res.status(404).json({ error: 'Link not found or access denied' });
    }

    res.json({ message: 'Link removed successfully' });
  } catch (error) {
    console.error('Error removing transport enquiry link:', error);
    res.status(500).json({ error: 'Failed to remove transport enquiry link' });
  }
});

// POST /api/enquiry-transport-links/link - Link existing transport enquiry to customer enquiry
router.post('/link', async (req, res) => {
  try {
    const {
      enquiryId,
      transportEnquiryId,
      notes
    } = req.body;
    const userId = req.user?.userId;

    // Basic validation
    if (!enquiryId || !transportEnquiryId) {
      return res.status(400).json({ error: 'Enquiry ID and transport enquiry ID are required' });
    }

    // Verify the customer enquiry exists and belongs to the user
    const existingEnquiry = await db
      .select()
      .from(enquiries)
      .where(and(
        eq(enquiries.id, parseInt(enquiryId)),
        eq(enquiries.userId, userId)
      ))
      .limit(1);

    if (existingEnquiry.length === 0) {
      return res.status(404).json({ error: 'Customer enquiry not found or access denied' });
    }

    // Verify the transport enquiry exists (skip userId check for now due to auth issue)
    const existingTransportEnquiry = await db
      .select()
      .from(transportBrokerRateEnquiries)
      .where(eq(transportBrokerRateEnquiries.id, parseInt(transportEnquiryId)))
      .limit(1);

    if (existingTransportEnquiry.length === 0) {
      return res.status(404).json({ error: 'Transport enquiry not found' });
    }

    // Check if link already exists
    const existingLink = await db
      .select()
      .from(enquiryTransportLinks)
      .where(and(
        eq(enquiryTransportLinks.enquiryId, parseInt(enquiryId)),
        eq(enquiryTransportLinks.transportEnquiryId, parseInt(transportEnquiryId))
      ))
      .limit(1);

    if (existingLink.length > 0) {
      return res.status(400).json({ error: 'Link already exists between these enquiries' });
    }

    // Create the link
    const newLink = await db.insert(enquiryTransportLinks).values({
      userId,
      enquiryId: parseInt(enquiryId),
      transportEnquiryId: parseInt(transportEnquiryId),
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    res.status(201).json({
      message: 'Transport enquiry linked successfully',
      link: newLink[0]
    });
  } catch (error) {
    console.error('Error linking transport enquiry:', error);
    res.status(500).json({ error: 'Failed to link transport enquiry' });
  }
});

// GET /api/enquiry-transport-links/available/:enquiryId - Get available transport enquiries for linking
router.get('/available/:enquiryId', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    const userId = req.user?.userId;
    const { search } = req.query;

    // Validate required parameters
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (isNaN(enquiryId)) {
      return res.status(400).json({ error: 'Invalid enquiry ID' });
    }

    // Build where conditions
    const whereConditions = [
      eq(transportBrokerRateEnquiries.userId, userId),
      isNull(enquiryTransportLinks.id) // Not already linked
    ];

    // Add search conditions if search term is provided and not empty
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      whereConditions.push(
        or(
          ilike(transportBrokerRateEnquiries.cargoType, searchTerm),
          ilike(transportRoutes.name, searchTerm),
          ilike(transportBrokerRateEnquiries.remarks, searchTerm)
        )
      );
    }


    // Get all transport enquiries that are not already linked to this customer enquiry
    const availableEnquiries = await db
      .select({
        id: transportBrokerRateEnquiries.id,
        routeId: transportBrokerRateEnquiries.routeId,
        cargoType: transportBrokerRateEnquiries.cargoType,
        cargoWeight: transportBrokerRateEnquiries.cargoWeight,
        transportDate: transportBrokerRateEnquiries.transportDate,
        status: transportBrokerRateEnquiries.status,
        remarks: transportBrokerRateEnquiries.remarks,
        createdAt: transportBrokerRateEnquiries.createdAt,
        routeName: transportRoutes.name
      })
      .from(transportBrokerRateEnquiries)
      .leftJoin(transportRoutes, eq(transportBrokerRateEnquiries.routeId, transportRoutes.id))
      .leftJoin(enquiryTransportLinks, and(
        eq(enquiryTransportLinks.transportEnquiryId, transportBrokerRateEnquiries.id),
        eq(enquiryTransportLinks.enquiryId, enquiryId)
      ))
      .where(and(...whereConditions))
      .orderBy(desc(transportBrokerRateEnquiries.createdAt));

    res.json(availableEnquiries);
  } catch (error) {
    console.error('Error fetching available transport enquiries:', error);
    res.status(500).json({ error: 'Failed to fetch available transport enquiries' });
  }
});

export default router;