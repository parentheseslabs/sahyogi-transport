import { Router } from "express";
import { 
  sendBidRequestToBrokers, 
  getBidsForEnquiry, 
  sendBidReminderToBrokers,
  getFlowMessageAnalytics 
} from "../util/bidService";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Send bid requests to selected brokers for an enquiry
router.post("/send-bid-request", authenticateToken, async (req, res) => {
  try {
    const { enquiryId, brokerIds, flowId } = req.body;

    if (!enquiryId || !Array.isArray(brokerIds) || brokerIds.length === 0 || !flowId) {
      return res.status(400).json({
        error: "Missing required fields: enquiryId, brokerIds (array), and flowId",
      });
    }

    const result = await sendBidRequestToBrokers({
      enquiryId: parseInt(enquiryId),
      brokerIds: brokerIds.map((id: any) => parseInt(id)),
      flowId,
    });

    res.json({
      message: "Bid requests sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending bid requests:", error);
    res.status(500).json({
      error: "Failed to send bid requests",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get all bids for a specific enquiry
router.get("/enquiry/:enquiryId/bids", authenticateToken, async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    
    if (isNaN(enquiryId)) {
      return res.status(400).json({
        error: "Invalid enquiry ID",
      });
    }

    const bids = await getBidsForEnquiry(enquiryId);

    res.json({
      enquiryId,
      totalBids: bids.length,
      bids,
    });
  } catch (error) {
    console.error("Error fetching bids:", error);
    res.status(500).json({
      error: "Failed to fetch bids",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get bid statistics for an enquiry
router.get("/enquiry/:enquiryId/bid-stats", authenticateToken, async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    
    if (isNaN(enquiryId)) {
      return res.status(400).json({
        error: "Invalid enquiry ID",
      });
    }

    const bids = await getBidsForEnquiry(enquiryId);

    const stats = {
      total: bids.length,
      pending: bids.filter((b) => b.status === "pending").length,
      submitted: bids.filter((b) => b.status === "submitted").length,
      accepted: bids.filter((b) => b.status === "accepted").length,
      rejected: bids.filter((b) => b.status === "rejected").length,
      expired: bids.filter((b) => b.status === "expired").length,
      lowestBid: bids.length > 0 ? Math.min(...bids.map((b) => parseFloat(b.bidAmount))) : null,
      highestBid: bids.length > 0 ? Math.max(...bids.map((b) => parseFloat(b.bidAmount))) : null,
      averageBid: bids.length > 0 ? bids.reduce((sum, b) => sum + parseFloat(b.bidAmount), 0) / bids.length : null,
    };

    res.json({
      enquiryId,
      stats,
    });
  } catch (error) {
    console.error("Error fetching bid stats:", error);
    res.status(500).json({
      error: "Failed to fetch bid statistics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Send reminder messages to brokers who haven't responded
router.post("/send-bid-reminder", authenticateToken, async (req, res) => {
  try {
    const { enquiryId, brokerIds, flowId, reminderType } = req.body;

    if (!enquiryId || !Array.isArray(brokerIds) || brokerIds.length === 0 || !flowId) {
      return res.status(400).json({
        error: "Missing required fields: enquiryId, brokerIds (array), and flowId",
      });
    }

    const result = await sendBidReminderToBrokers({
      enquiryId: parseInt(enquiryId),
      brokerIds: brokerIds.map((id: any) => parseInt(id)),
      flowId,
      reminderType: reminderType || "reminder",
    });

    res.json({
      message: "Bid reminders sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error sending bid reminders:", error);
    res.status(500).json({
      error: "Failed to send bid reminders",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get flow message analytics for an enquiry
router.get("/enquiry/:enquiryId/flow-analytics", authenticateToken, async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    
    if (isNaN(enquiryId)) {
      return res.status(400).json({
        error: "Invalid enquiry ID",
      });
    }

    const analytics = await getFlowMessageAnalytics(enquiryId);

    res.json({
      enquiryId,
      analytics,
    });
  } catch (error) {
    console.error("Error fetching flow analytics:", error);
    res.status(500).json({
      error: "Failed to fetch flow message analytics",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;