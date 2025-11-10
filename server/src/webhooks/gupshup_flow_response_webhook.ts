import { Request, Response } from "express";
import { processBidResponse, updateFlowMessageStatus } from "../util/bidService";
import { sendTextMsg } from "../util/gupshup";
import { db } from "../db/connection";
import { bidFlowMessageResponses } from "../db/schema";
import * as dotenv from "dotenv";

dotenv.config();

interface FlowResponseBody {
  gs_app_id: string;
  object: "whatsapp_business_account";
  entry: Array<{
    id: string;
    changes: Array<{
      field: "messages";
      value: {
        messaging_product: "whatsapp";
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: "interactive";
          interactive: {
            type: "nfm_reply";
            nfm_reply: {
              name: string;
              body: string;
              response_json: string;
            };
          };
          context?: {
            from: string;
            id: string;
          };
        }>;
        statuses?: Array<{
          id: string;
          status: "sent" | "delivered" | "read" | "failed";
          timestamp: string;
          recipient_id: string;
        }>;
      };
    }>;
  }>;
}

export const gupshup_flow_response_webhook = async (
  req: Request<any, any, FlowResponseBody>,
  res: Response
) => {
  try {
    console.log("Flow response webhook received:", JSON.stringify(req.body, null, 2));

    for (const entry of req.body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        // Handle message status updates
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            await handleMessageStatus(status);
          }
        }

        // Handle flow responses
        if (change.value.messages) {
          for (const message of change.value.messages) {
            if (message.type === "interactive" && message.interactive.type === "nfm_reply") {
              await handleFlowResponse(message);
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Flow response webhook error:", error);
    res.sendStatus(500);
  }
};

async function handleMessageStatus(status: {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}) {
  try {
    if (status.status === "delivered" || status.status === "read") {
      await updateFlowMessageStatus(
        status.id,
        status.status,
        new Date(parseInt(status.timestamp) * 1000)
      );
    }
  } catch (error) {
    console.error("Error handling message status:", error);
  }
}

async function handleFlowResponse(message: {
  from: string;
  id: string;
  timestamp: string;
  type: "interactive";
  interactive: {
    type: "nfm_reply";
    nfm_reply: {
      name: string;
      body: string;
      response_json: string;
    };
  };
  context?: {
    from: string;
    id: string;
  };
}) {
  try {
    const phoneNumber = message.from;
    const responseData = JSON.parse(message.interactive.nfm_reply.response_json);
    
    console.log("Flow response data:", responseData);

    // Extract bid information from flow response
    // Assuming the flow has a text input field for bid amount and optional remarks
    const bidAmount = parseFloat(responseData.bid_amount || responseData.amount || "0");
    const remarks = responseData.remarks || responseData.notes || "";
    const flowToken = responseData.flow_token;

    if (!bidAmount || bidAmount <= 0) {
      // Send error message to broker
      await sendTextMsg({
        text: "❌ Invalid bid amount. Please submit a valid bid amount greater than 0.",
        toPhoneNumber: phoneNumber,
      });
      return;
    }

    if (!flowToken) {
      console.error("Flow token not found in response data");
      await sendTextMsg({
        text: "❌ Error processing your bid. Please try again or contact support.",
        toPhoneNumber: phoneNumber,
      });
      return;
    }

    // Process the bid
    const result = await processBidResponse({
      flowToken,
      bidAmount,
      remarks,
      phoneNumber,
      responseData,
    });

    // Send confirmation message to broker
    await sendTextMsg({
      text: `✅ Your bid has been submitted successfully!\n\n🆔 Bid ID: ${result.bidId}\n💰 Amount: ₹${bidAmount.toLocaleString('en-IN')}\n📋 Enquiry: #${result.enquiryId}\n\nWe'll notify you once the bid is reviewed. Thank you! 🙏`,
      toPhoneNumber: phoneNumber,
    });

    console.log(`Bid processed successfully for enquiry ${result.enquiryId}: ₹${bidAmount}`);

  } catch (error) {
    console.error("Error handling flow response:", error);
    
    // Try to record error response if we have flow token
    const flowToken = responseData.flow_token;
    if (flowToken) {
      try {
        // Find the flow message to record error response
        const { bidFlowMessages } = await import("../db/schema");
        const { eq } = await import("drizzle-orm");
        
        const [flowMessage] = await db
          .select({ id: bidFlowMessages.id })
          .from(bidFlowMessages)
          .where(eq(bidFlowMessages.flowToken, flowToken))
          .limit(1);
          
        if (flowMessage) {
          await db.insert(bidFlowMessageResponses).values({
            bidFlowMessageId: flowMessage.id,
            responseType: "error_response",
            responseData: JSON.stringify(responseData),
            errorMessage: error instanceof Error ? error.message : "Unknown error processing bid",
          });
        }
      } catch (recordError) {
        console.error("Error recording error response:", recordError);
      }
    }
    
    // Send error message to broker
    try {
      await sendTextMsg({
        text: "❌ Error processing your bid. Please try again or contact our support team.",
        toPhoneNumber: message.from,
      });
    } catch (msgError) {
      console.error("Error sending error message:", msgError);
    }
  }
}

/**
 * Example Flow Response JSON Structure:
 * 
 * For a simple bid flow with amount input and optional remarks:
 * {
 *   "flow_token": "d2FmbC9maWQvMTYyNTAzMDI4NDk0NDQ5Ni93YWJhL3VuZGVmaW5lZC9jaWQvOTE4NzIzMDYyMjY1L2ZtaWQvMTczNzEwMTc0MTA3Mz9kYXRhPSIi",
 *   "bid_amount": "45000",
 *   "remarks": "Delivery within 2 days, GPS tracking included"
 * }
 * 
 * The flow should be created in Meta Business Manager with:
 * - Text input field with name "bid_amount" for the bid amount
 * - Optional text area with name "remarks" for additional notes
 * - Hidden field with name "flow_token" to track the original request
 */