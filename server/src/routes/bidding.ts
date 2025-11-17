import express from 'express';
import { db } from '../db/connection';
import { brokers, transportBrokerRateEnquiries, transportRoutes, transportBidFlowMessages, brokerTransportRateBids } from '../db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { sendBidFlowTemplate } from '../util/gupshup';
import { authenticateToken } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all available brokers
router.get('/brokers', async (req, res) => {
  try {
    const availableBrokers = await db
      .select({
        id: brokers.id,
        companyName: brokers.companyName,
        personName: brokers.personName,
        phone: brokers.phone,
        city: brokers.city,
        remarks: brokers.remarks,
      })
      .from(brokers)
      .where(sql`${brokers.phone} IS NOT NULL AND ${brokers.phone} != ''`)
      .orderBy(brokers.companyName);

    res.json(availableBrokers);
  } catch (error) {
    console.error('Error fetching brokers:', error);
    res.status(500).json({ error: 'Failed to fetch brokers' });
  }
});

// Send bid requests to selected brokers for an enquiry
router.post('/enquiry/:enquiryId/send-bid-requests', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    const { brokerIds, templateName = 'kiran_transport_bid', flowId = '24105313799145675' } = req.body;

    if (!brokerIds || !Array.isArray(brokerIds) || brokerIds.length === 0) {
      return res.status(400).json({ error: 'brokerIds array is required' });
    }

    // Get enquiry details with route information
    const [enquiry] = await db
      .select({
        id: transportBrokerRateEnquiries.id,
        routeId: transportBrokerRateEnquiries.routeId,
        cargoType: transportBrokerRateEnquiries.cargoType,
        cargoWeight: transportBrokerRateEnquiries.cargoWeight,
        transportDate: transportBrokerRateEnquiries.transportDate,
        remarks: transportBrokerRateEnquiries.remarks,
        routeName: transportRoutes.name
      })
      .from(transportBrokerRateEnquiries)
      .leftJoin(transportRoutes, eq(transportBrokerRateEnquiries.routeId, transportRoutes.id))
      .where(eq(transportBrokerRateEnquiries.id, enquiryId))
      .limit(1);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Get selected brokers
    const selectedBrokers = await db
      .select()
      .from(brokers)
      .where(inArray(brokers.id, brokerIds));

    if (selectedBrokers.length === 0) {
      return res.status(400).json({ error: 'No valid brokers found' });
    }

    const results = [];
    
    for (const broker of selectedBrokers) {
      if (!broker.phone) {
        results.push({
          brokerId: broker.id,
          brokerName: broker.companyName,
          success: false,
          error: 'No phone number'
        });
        continue;
      }

      try {
        // Generate unique flow token
        const flowToken = generateFlowToken(enquiryId, broker.id);
        
        // Format enquiry details for template
        const enquiryDetails = formatEnquiryDetails(enquiry);
        
        // Prepare flow data
        const flowData = {
          enquiryId: enquiry.id.toString(),
          route: enquiry.routeName || "Route not specified",
          cargoType: enquiry.cargoType,
          cargoWeight: enquiry.cargoWeight?.toString() || "",
          remarks: enquiry.remarks || "",
          vehicleType: "Truck"
        };

        // Send WhatsApp message
        const response = await sendBidFlowTemplate({
          toPhoneNumber: broker.phone,
          templateName,
          languageCode: "en",
          enquiryDetails,
          flowId,
          flowToken,
          flowData
        });

        // Store bid flow message record in simplified table
        await db
          .insert(transportBidFlowMessages)
          .values({
            transportEnquiryId: enquiryId,
            brokerId: broker.id,
            flowToken,
            gupshupMsgId: response.messages[0]?.id
          });

        results.push({
          brokerId: broker.id,
          brokerName: broker.companyName || broker.personName,
          brokerPhone: broker.phone,
          success: true,
          messageId: response.messages[0]?.id
        });

      } catch (error) {
        console.error(`Failed to send bid request to broker ${broker.id}:`, error);
        results.push({
          brokerId: broker.id,
          brokerName: broker.companyName || broker.personName,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bid requests processed',
      results,
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length
    });

  } catch (error) {
    console.error('Error sending bid requests:', error);
    res.status(500).json({ error: 'Failed to send bid requests' });
  }
});

// Helper function to generate flow token
function generateFlowToken(enquiryId: number, brokerId: number): string {
  const timestamp = Date.now();
  const token = `${enquiryId}_${brokerId}_${timestamp}`;
  const hash = crypto.createHash('md5').update(token).digest('hex').substring(0, 8);
  return `${token}.${hash}`;
}

// Get bid requests and responses for an enquiry
router.get('/enquiry/:enquiryId/bids', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);

    // Get enquiry details with route information
    const [enquiry] = await db
      .select({
        id: transportBrokerRateEnquiries.id,
        routeId: transportBrokerRateEnquiries.routeId,
        cargoType: transportBrokerRateEnquiries.cargoType,
        cargoWeight: transportBrokerRateEnquiries.cargoWeight,
        transportDate: transportBrokerRateEnquiries.transportDate,
        remarks: transportBrokerRateEnquiries.remarks,
        status: transportBrokerRateEnquiries.status,
        routeName: transportRoutes.name
      })
      .from(transportBrokerRateEnquiries)
      .leftJoin(transportRoutes, eq(transportBrokerRateEnquiries.routeId, transportRoutes.id))
      .where(eq(transportBrokerRateEnquiries.id, enquiryId))
      .limit(1);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    // Get bid requests directly from transport_bid_flow_messages with broker details
    const bidData = await db
      .select({
        // All fields from transport_bid_flow_messages
        id: transportBidFlowMessages.id,
        transportEnquiryId: transportBidFlowMessages.transportEnquiryId,
        brokerId: transportBidFlowMessages.brokerId,
        sentAt: transportBidFlowMessages.sentAt,
        flowToken: transportBidFlowMessages.flowToken,
        gupshupMsgId: transportBidFlowMessages.gupshupMsgId,
        respondedAt: transportBidFlowMessages.respondedAt,
        responseAmount: transportBidFlowMessages.responseAmount,
        
        // Broker details
        brokerCompanyName: brokers.companyName,
        brokerPersonName: brokers.personName,
        brokerPhone: brokers.phone,
        brokerCity: brokers.city,
      })
      .from(transportBidFlowMessages)
      .innerJoin(brokers, eq(transportBidFlowMessages.brokerId, brokers.id))
      .where(eq(transportBidFlowMessages.transportEnquiryId, enquiryId))
      .orderBy(transportBidFlowMessages.sentAt);

    res.json({
      enquiry,
      bidRequests: bidData
    });

  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Get bid statistics for an enquiry
router.get('/enquiry/:enquiryId/stats', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);

    const stats = await db
      .select({
        totalSent: sql<number>`count(${transportBidFlowMessages.id})`,
        totalResponded: sql<number>`count(case when ${transportBidFlowMessages.respondedAt} is not null then 1 end)`,
        totalBids: sql<number>`count(case when ${brokerTransportRateBids.id} is not null then 1 end)`,
        avgBidAmount: sql<number>`avg(${brokerTransportRateBids.rate})`,
        minBidAmount: sql<number>`min(${brokerTransportRateBids.rate})`,
        maxBidAmount: sql<number>`max(${brokerTransportRateBids.rate})`,
      })
      .from(transportBidFlowMessages)
      .leftJoin(brokerTransportRateBids, 
        sql`${transportBidFlowMessages.transportEnquiryId} = ${brokerTransportRateBids.enquiryId} AND ${transportBidFlowMessages.brokerId} = ${brokerTransportRateBids.brokerId}`
      )
      .where(eq(transportBidFlowMessages.transportEnquiryId, enquiryId));

    res.json(stats[0]);

  } catch (error) {
    console.error('Error fetching bid stats:', error);
    res.status(500).json({ error: 'Failed to fetch bid statistics' });
  }
});

// Helper function to format enquiry details
function formatEnquiryDetails(enquiry: any): string {
  return `📋 *Enquiry ${enquiry.id}* 📍 *Route:* ${enquiry.routeName || 'Route not specified'} 📦 *Cargo:* ${enquiry.cargoType}${enquiry.cargoWeight ? ` ⚖️ *Weight:* ${enquiry.cargoWeight} MT` : ''} 🚛 *Vehicle:* Truck${enquiry.remarks ? ` 📝 *Remarks:* ${enquiry.remarks}` : ''}`;
}

export default router;