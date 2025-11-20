import express from 'express';
import { db } from '../db/connection';
import { vehicleTypes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// Get all vehicle types
router.get('/', async (req, res) => {
  try {
    const userId = req.user!.userId;

    const allVehicleTypes = await db
      .select()
      .from(vehicleTypes)
      .where(eq(vehicleTypes.userId, userId))
      .orderBy(vehicleTypes.name);

    res.json(allVehicleTypes);
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle types' });
  }
});

// Get vehicle type by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.userId;

    const [vehicleType] = await db
      .select()
      .from(vehicleTypes)
      .where(and(eq(vehicleTypes.id, id), eq(vehicleTypes.userId, userId)));

    if (!vehicleType) {
      return res.status(404).json({ error: 'Vehicle type not found' });
    }

    res.json(vehicleType);
  } catch (error) {
    console.error('Error fetching vehicle type:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle type' });
  }
});

// Create new vehicle type
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.userId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newVehicleType] = await db
      .insert(vehicleTypes)
      .values({
        userId,
        name,
        description,
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(newVehicleType);
  } catch (error) {
    console.error('Error creating vehicle type:', error);
    res.status(500).json({ error: 'Failed to create vehicle type' });
  }
});

// Update vehicle type
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    const userId = req.user!.userId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [updatedVehicleType] = await db
      .update(vehicleTypes)
      .set({
        name,
        description,
        updatedAt: new Date()
      })
      .where(and(eq(vehicleTypes.id, id), eq(vehicleTypes.userId, userId)))
      .returning();

    if (!updatedVehicleType) {
      return res.status(404).json({ error: 'Vehicle type not found' });
    }

    res.json(updatedVehicleType);
  } catch (error) {
    console.error('Error updating vehicle type:', error);
    res.status(500).json({ error: 'Failed to update vehicle type' });
  }
});

// Delete vehicle type
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user!.userId;

    const [deletedVehicleType] = await db
      .delete(vehicleTypes)
      .where(and(eq(vehicleTypes.id, id), eq(vehicleTypes.userId, userId)))
      .returning();

    if (!deletedVehicleType) {
      return res.status(404).json({ error: 'Vehicle type not found' });
    }

    res.json({ message: 'Vehicle type deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle type:', error);
    res.status(500).json({ error: 'Failed to delete vehicle type' });
  }
});

export default router;