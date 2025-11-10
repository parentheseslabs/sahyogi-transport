import { Router } from 'express';
import { eq, and, count, desc, asc } from 'drizzle-orm';
import { db } from '../db/connection';
import { transportRoutes, transportRouteLocations } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/transport-routes - Get transport routes with pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(transportRoutes);

    const total = totalResult.count;

    // Get routes with pagination
    const sortColumn = sortBy === 'name' ? transportRoutes.name : transportRoutes.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const routesResult = await db
      .select()
      .from(transportRoutes)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    // Get locations for each route
    const routesWithLocations = await Promise.all(
      routesResult.map(async (route) => {
        const locations = await db
          .select()
          .from(transportRouteLocations)
          .where(eq(transportRouteLocations.routeId, route.id))
          .orderBy(asc(transportRouteLocations.id));

        return {
          ...route,
          locations
        };
      })
    );

    res.json({
      routes: routesWithLocations,
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
    console.error('Error fetching transport routes:', error);
    res.status(500).json({ error: 'Failed to fetch transport routes' });
  }
});

// GET /api/transport-routes/:id - Get single transport route
router.get('/:id', async (req, res) => {
  try {
    const routeId = parseInt(req.params.id);
    const route = await db.select().from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1);

    if (route.length === 0) {
      return res.status(404).json({ error: 'Transport route not found' });
    }

    // Get locations for this route
    const locations = await db
      .select()
      .from(transportRouteLocations)
      .where(eq(transportRouteLocations.routeId, routeId))
      .orderBy(asc(transportRouteLocations.id));

    res.json({
      ...route[0],
      locations
    });
  } catch (error) {
    console.error('Error fetching transport route:', error);
    res.status(500).json({ error: 'Failed to fetch transport route' });
  }
});

// POST /api/transport-routes - Create new transport route
router.post('/', async (req, res) => {
  try {
    const { name, locations } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Route name is required' });
    }

    // Create the route
    const newRoute = await db.insert(transportRoutes).values({
      name
    }).returning();

    const routeId = newRoute[0].id;

    // Create locations if provided
    if (locations && Array.isArray(locations)) {
      for (const location of locations) {
        await db.insert(transportRouteLocations).values({
          routeId,
          stopType: 'unknown', // Default stop type
          remarks: `${location.location} (Sequence: ${location.sequence})`
        });
      }
    }

    // Return the complete route with locations
    const completeRoute = await db.select().from(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .limit(1);

    const routeLocations = await db
      .select()
      .from(transportRouteLocations)
      .where(eq(transportRouteLocations.routeId, routeId))
      .orderBy(asc(transportRouteLocations.id));

    res.status(201).json({
      ...completeRoute[0],
      locations: routeLocations
    });
  } catch (error) {
    console.error('Error creating transport route:', error);
    res.status(500).json({ error: 'Failed to create transport route' });
  }
});

// PUT /api/transport-routes/:id - Update transport route
router.put('/:id', async (req, res) => {
  try {
    const routeId = parseInt(req.params.id);
    const { name, locations } = req.body;

    const updatedRoute = await db.update(transportRoutes)
      .set({
        name,
        updatedAt: new Date()
      })
      .where(eq(transportRoutes.id, routeId))
      .returning();

    if (updatedRoute.length === 0) {
      return res.status(404).json({ error: 'Transport route not found' });
    }

    // Update locations if provided
    if (locations && Array.isArray(locations)) {
      // Delete existing locations
      await db.delete(transportRouteLocations)
        .where(eq(transportRouteLocations.routeId, routeId));

      // Create new locations
      for (const location of locations) {
        await db.insert(transportRouteLocations).values({
          routeId,
          stopType: 'unknown',
          remarks: `${location.location} (Sequence: ${location.sequence})`
        });
      }
    }

    // Return updated route with locations
    const routeLocations = await db
      .select()
      .from(transportRouteLocations)
      .where(eq(transportRouteLocations.routeId, routeId))
      .orderBy(asc(transportRouteLocations.id));

    res.json({
      ...updatedRoute[0],
      locations: routeLocations
    });
  } catch (error) {
    console.error('Error updating transport route:', error);
    res.status(500).json({ error: 'Failed to update transport route' });
  }
});

// DELETE /api/transport-routes/:id - Delete transport route
router.delete('/:id', async (req, res) => {
  try {
    const routeId = parseInt(req.params.id);
    const deletedRoute = await db.delete(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .returning();

    if (deletedRoute.length === 0) {
      return res.status(404).json({ error: 'Transport route not found' });
    }

    res.json({ message: 'Transport route deleted successfully' });
  } catch (error) {
    console.error('Error deleting transport route:', error);
    res.status(500).json({ error: 'Failed to delete transport route' });
  }
});

export default router;