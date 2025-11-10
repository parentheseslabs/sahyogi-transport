import { Router } from 'express';
import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../db/connection';
import { leads, brokers, enquiries, quotes, transportBrokerRateEnquiries } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all statistics in parallel with simpler queries
    const [
      totalLeadsResult,
      activeBrokersResult,
      openEnquiriesResult,
      pendingQuotesResult,
      transportEnquiriesResult,
    ] = await Promise.all([
      // Total leads count
      db.select({ count: count() })
        .from(leads)
        .where(eq(leads.userId, userId)),
      
      // Active brokers count
      db.select({ count: count() })
        .from(brokers)
        .where(eq(brokers.userId, userId)),
      
      // Open enquiries count
      db.select({ count: count() })
        .from(enquiries)
        .where(and(
          eq(enquiries.userId, userId),
          eq(enquiries.status, 'pending')
        )),
      
      // Pending quotes count
      db.select({ count: count() })
        .from(quotes)
        .where(and(
          eq(quotes.userId, userId),
          eq(quotes.status, 'pending')
        )),

      // Transport enquiries count
      db.select({ count: count() })
        .from(transportBrokerRateEnquiries)
        .where(and(
          eq(transportBrokerRateEnquiries.userId, userId),
          eq(transportBrokerRateEnquiries.status, 'open')
        )),
    ]);

    const stats = {
      totalLeads: Number(totalLeadsResult[0]?.count || 0),
      activeBrokers: Number(activeBrokersResult[0]?.count || 0),
      openEnquiries: Number(openEnquiriesResult[0]?.count || 0) + Number(transportEnquiriesResult[0]?.count || 0),
      pendingQuotes: Number(pendingQuotesResult[0]?.count || 0),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// GET /api/dashboard/recent-activity - Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get recent activity from different tables
    const [recentLeads, recentEnquiries, recentQuotes, recentTransportEnquiries] = await Promise.all([
      // Recent leads
      db.select({
        id: leads.id,
        name: leads.name,
        company: leads.company,
        createdAt: leads.createdAt,
      })
        .from(leads)
        .where(eq(leads.userId, userId))
        .orderBy(desc(leads.createdAt))
        .limit(3),
      
      // Recent enquiries
      db.select({
        id: enquiries.id,
        from: enquiries.from,
        to: enquiries.to,
        cargoType: enquiries.cargoType,
        status: enquiries.status,
        createdAt: enquiries.createdAt,
      })
        .from(enquiries)
        .where(eq(enquiries.userId, userId))
        .orderBy(desc(enquiries.createdAt))
        .limit(3),
      
      // Recent quotes
      db.select({
        id: quotes.id,
        enquiryId: quotes.enquiryId,
        quotationAmount: quotes.quotationAmount,
        status: quotes.status,
        createdAt: quotes.createdAt,
      })
        .from(quotes)
        .where(eq(quotes.userId, userId))
        .orderBy(desc(quotes.createdAt))
        .limit(3),
      
      // Recent transport enquiries
      db.select({
        id: transportBrokerRateEnquiries.id,
        cargoType: transportBrokerRateEnquiries.cargoType,
        status: transportBrokerRateEnquiries.status,
        createdAt: transportBrokerRateEnquiries.createdAt,
      })
        .from(transportBrokerRateEnquiries)
        .where(eq(transportBrokerRateEnquiries.userId, userId))
        .orderBy(desc(transportBrokerRateEnquiries.createdAt))
        .limit(3),
    ]);

    // Transform data into consistent activity format
    const activities: any[] = [];

    // Add leads
    recentLeads.forEach(lead => {
      activities.push({
        id: lead.id,
        type: 'lead',
        title: `New Lead: ${lead.name}`,
        description: lead.company ? `Company: ${lead.company}` : 'Individual lead',
        createdAt: lead.createdAt,
      });
    });

    // Add enquiries
    recentEnquiries.forEach(enquiry => {
      activities.push({
        id: enquiry.id,
        type: 'enquiry',
        title: `${enquiry.cargoType} Enquiry`,
        description: `${enquiry.from} → ${enquiry.to} (${enquiry.status})`,
        createdAt: enquiry.createdAt,
      });
    });

    // Add quotes
    recentQuotes.forEach(quote => {
      activities.push({
        id: quote.id,
        type: 'quote',
        title: `Quote #${quote.id}`,
        description: `₹${quote.quotationAmount.toLocaleString()} (${quote.status})`,
        createdAt: quote.createdAt,
      });
    });

    // Add transport enquiries
    recentTransportEnquiries.forEach(transport => {
      activities.push({
        id: transport.id,
        type: 'transport',
        title: `Transport: ${transport.cargoType}`,
        description: `Status: ${transport.status}`,
        createdAt: transport.createdAt,
      });
    });

    // Sort by creation date and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);

    res.json(sortedActivities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
});

export default router;