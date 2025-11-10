import express from "express";
import { db } from "../db/connection";
import { brokerTransportRateBids } from "../db/schema/brokerTransportRates";
import { brokers } from "../db/schema/brokers";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

// Validation schemas
const createBidSchema = z.object({
  enquiryId: z.number(),
  brokerId: z.number(),
  rate: z.number().positive(),
});

const updateBidSchema = z.object({
  rate: z.number().positive(),
});

// GET /api/transport-rate-bids?enquiryId=123
router.get("/", async (req, res) => {
  try {
    const { enquiryId } = req.query;
    
    let query = db
      .select({
        bid: brokerTransportRateBids,
        broker: brokers,
      })
      .from(brokerTransportRateBids)
      .leftJoin(brokers, eq(brokerTransportRateBids.brokerId, brokers.id))
      .orderBy(desc(brokerTransportRateBids.createdAt));

    if (enquiryId) {
      query = query.where(eq(brokerTransportRateBids.enquiryId, Number(enquiryId)));
    }

    const bids = await query;
    res.json(bids);
  } catch (error) {
    console.error("Error fetching transport rate bids:", error);
    res.status(500).json({ error: "Failed to fetch transport rate bids" });
  }
});

// GET /api/transport-rate-bids/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [bid] = await db
      .select({
        bid: brokerTransportRateBids,
        broker: brokers,
      })
      .from(brokerTransportRateBids)
      .leftJoin(brokers, eq(brokerTransportRateBids.brokerId, brokers.id))
      .where(eq(brokerTransportRateBids.id, Number(id)));

    if (!bid) {
      return res.status(404).json({ error: "Bid not found" });
    }

    res.json(bid);
  } catch (error) {
    console.error("Error fetching transport rate bid:", error);
    res.status(500).json({ error: "Failed to fetch transport rate bid" });
  }
});

// POST /api/transport-rate-bids
router.post("/", async (req, res) => {
  try {
    const validation = createBidSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid data", details: validation.error });
    }
    
    const { enquiryId, brokerId, rate } = validation.data;

    const [newBid] = await db
      .insert(brokerTransportRateBids)
      .values({
        enquiryId,
        brokerId,
        rate,
      })
      .returning();

    res.status(201).json(newBid);
  } catch (error) {
    console.error("Error creating transport rate bid:", error);
    res.status(500).json({ error: "Failed to create transport rate bid" });
  }
});

// PUT /api/transport-rate-bids/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const validation = updateBidSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: "Invalid data", details: validation.error });
    }
    
    const { rate } = validation.data;

    const [updatedBid] = await db
      .update(brokerTransportRateBids)
      .set({
        rate,
        updatedAt: new Date(),
      })
      .where(eq(brokerTransportRateBids.id, Number(id)))
      .returning();

    if (!updatedBid) {
      return res.status(404).json({ error: "Bid not found" });
    }

    res.json(updatedBid);
  } catch (error) {
    console.error("Error updating transport rate bid:", error);
    res.status(500).json({ error: "Failed to update transport rate bid" });
  }
});

// DELETE /api/transport-rate-bids/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedBid] = await db
      .delete(brokerTransportRateBids)
      .where(eq(brokerTransportRateBids.id, Number(id)))
      .returning();

    if (!deletedBid) {
      return res.status(404).json({ error: "Bid not found" });
    }

    res.json({ message: "Bid deleted successfully", bid: deletedBid });
  } catch (error) {
    console.error("Error deleting transport rate bid:", error);
    res.status(500).json({ error: "Failed to delete transport rate bid" });
  }
});

export default router;