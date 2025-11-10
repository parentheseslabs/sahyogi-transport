import { db } from "../db/connection";
import { bidFlowMessages, bids, brokers, enquiries, bidFlowMessageResponses } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { sendBidFlowMessage } from "./gupshup";
import { randomUUID } from "crypto";

interface SendBidRequestProps {
  enquiryId: number;
  brokerIds: number[];
  flowId: string; // Meta Flow ID created in Business Manager
}

export async function sendBidRequestToBrokers(props: SendBidRequestProps) {
  try {
    // Get enquiry details
    const [enquiry] = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, props.enquiryId))
      .limit(1);

    if (!enquiry) {
      throw new Error(`Enquiry with ID ${props.enquiryId} not found`);
    }

    // Get broker details
    const brokerList = await db
      .select()
      .from(brokers)
      .where(and(...props.brokerIds.map(id => eq(brokers.id, id))));

    if (brokerList.length === 0) {
      throw new Error("No valid brokers found");
    }

    const results = [];

    for (const broker of brokerList) {
      try {
        // Generate unique flow token
        const flowToken = randomUUID();

        // Send flow message to broker
        const response = await sendBidFlowMessage({
          toPhoneNumber: broker.phoneNumber,
          brokerName: broker.name,
          enquiryId: props.enquiryId,
          from: enquiry.from,
          to: enquiry.to,
          cargoType: enquiry.cargoType,
          cargoWeight: enquiry.cargoWeight || undefined,
          remarks: enquiry.remarks || undefined,
          flowId: props.flowId,
          flowToken: flowToken,
        });

        // Store flow message record
        const [flowMessage] = await db
          .insert(bidFlowMessages)
          .values({
            enquiryId: props.enquiryId,
            brokerId: broker.id,
            flowId: props.flowId,
            gupshupMessageId: response.messages[0].id,
            brokerPhoneNumber: broker.phoneNumber,
            flowToken: flowToken,
            messageType: "initial",
            status: "sent",
          })
          .returning({ id: bidFlowMessages.id });

        console.log(
          `Sent bid request to broker ${broker.name} (${broker.phoneNumber}), flow message ID: ${flowMessage.id}`
        );

        results.push({
          brokerId: broker.id,
          brokerName: broker.name,
          phoneNumber: broker.phoneNumber,
          flowMessageId: flowMessage.id,
          gupshupMessageId: response.messages[0].id,
          status: "sent",
        });
      } catch (error) {
        console.error(
          `Failed to send bid request to broker ${broker.name} (${broker.phoneNumber}):`,
          error
        );
        results.push({
          brokerId: broker.id,
          brokerName: broker.name,
          phoneNumber: broker.phoneNumber,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      enquiryId: props.enquiryId,
      totalBrokers: brokerList.length,
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    };
  } catch (error) {
    console.error("Error in sendBidRequestToBrokers:", error);
    throw error;
  }
}

export async function processBidResponse(props: {
  flowToken: string;
  bidAmount: number;
  remarks?: string;
  phoneNumber: string;
  responseData?: any;
}) {
  try {
    // Find the flow message using flow token
    const [flowMessage] = await db
      .select({
        id: bidFlowMessages.id,
        enquiryId: bidFlowMessages.enquiryId,
        brokerId: bidFlowMessages.brokerId,
      })
      .from(bidFlowMessages)
      .where(eq(bidFlowMessages.flowToken, props.flowToken))
      .limit(1);

    if (!flowMessage) {
      throw new Error(`Flow message not found for token: ${props.flowToken}`);
    }

    // Check if bid already exists for this enquiry + broker combination
    const existingBid = await db
      .select()
      .from(bids)
      .where(
        and(
          eq(bids.enquiryId, flowMessage.enquiryId),
          eq(bids.brokerId, flowMessage.brokerId)
        )
      )
      .limit(1);

    if (existingBid.length > 0) {
      // Record the response but don't create duplicate bid
      await db.insert(bidFlowMessageResponses).values({
        bidFlowMessageId: flowMessage.id,
        bidId: existingBid[0].id,
        responseType: "bid_submitted",
        responseData: props.responseData ? JSON.stringify(props.responseData) : null,
      });
      
      throw new Error("Bid already submitted for this enquiry");
    }

    // Create new bid
    const [newBid] = await db
      .insert(bids)
      .values({
        enquiryId: flowMessage.enquiryId,
        brokerId: flowMessage.brokerId,
        bidAmount: props.bidAmount.toString(),
        remarks: props.remarks,
        status: "submitted",
        triggeredByFlowMessageId: flowMessage.id,
        submittedAt: new Date(),
      })
      .returning({ id: bids.id });

    // Record successful response
    await db.insert(bidFlowMessageResponses).values({
      bidFlowMessageId: flowMessage.id,
      bidId: newBid.id,
      responseType: "bid_submitted",
      responseData: props.responseData ? JSON.stringify(props.responseData) : null,
    });

    // Update flow message status
    await db
      .update(bidFlowMessages)
      .set({
        status: "responded",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bidFlowMessages.id, flowMessage.id));

    console.log(
      `Bid submitted successfully: Enquiry ${flowMessage.enquiryId}, Broker ${flowMessage.brokerId}, Amount: ${props.bidAmount}`
    );

    return {
      bidId: newBid.id,
      enquiryId: flowMessage.enquiryId,
      brokerId: flowMessage.brokerId,
      bidAmount: props.bidAmount,
      status: "submitted",
    };
  } catch (error) {
    console.error("Error processing bid response:", error);
    throw error;
  }
}

export async function getBidsForEnquiry(enquiryId: number) {
  try {
    const bidsList = await db
      .select({
        bidId: bids.id,
        bidAmount: bids.bidAmount,
        remarks: bids.remarks,
        status: bids.status,
        submittedAt: bids.submittedAt,
        brokerId: bids.brokerId,
        brokerName: brokers.name,
        brokerPhoneNumber: brokers.phoneNumber,
        triggeredByFlowMessageId: bids.triggeredByFlowMessageId,
      })
      .from(bids)
      .leftJoin(brokers, eq(bids.brokerId, brokers.id))
      .where(eq(bids.enquiryId, enquiryId));

    return bidsList;
  } catch (error) {
    console.error("Error getting bids for enquiry:", error);
    throw error;
  }
}

export async function updateFlowMessageStatus(
  gupshupMessageId: string,
  status: "delivered" | "read",
  timestamp?: Date
) {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "delivered") {
      updateData.deliveredAt = timestamp || new Date();
    } else if (status === "read") {
      updateData.readAt = timestamp || new Date();
    }

    await db
      .update(bidFlowMessages)
      .set(updateData)
      .where(eq(bidFlowMessages.gupshupMessageId, gupshupMessageId));

    console.log(
      `Updated flow message ${gupshupMessageId} status to ${status}`
    );
  } catch (error) {
    console.error("Error updating flow message status:", error);
  }
}

// New function to send reminder flow messages
export async function sendBidReminderToBrokers(props: {
  enquiryId: number;
  brokerIds: number[];
  flowId: string;
  reminderType?: "reminder" | "followup";
}) {
  try {
    const enquiry = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, props.enquiryId))
      .limit(1);

    if (!enquiry) {
      throw new Error(`Enquiry with ID ${props.enquiryId} not found`);
    }

    const brokerList = await db
      .select()
      .from(brokers)
      .where(and(...props.brokerIds.map(id => eq(brokers.id, id))));

    const results = [];
    for (const broker of brokerList) {
      try {
        const flowToken = randomUUID();
        
        const response = await sendBidFlowMessage({
          toPhoneNumber: broker.phoneNumber,
          brokerName: broker.name,
          enquiryId: props.enquiryId,
          from: enquiry[0].from,
          to: enquiry[0].to,
          cargoType: enquiry[0].cargoType,
          cargoWeight: enquiry[0].cargoWeight || undefined,
          remarks: enquiry[0].remarks || undefined,
          flowId: props.flowId,
          flowToken: flowToken,
          isReminder: true,
        });

        const [flowMessage] = await db
          .insert(bidFlowMessages)
          .values({
            enquiryId: props.enquiryId,
            brokerId: broker.id,
            flowId: props.flowId,
            gupshupMessageId: response.messages[0].id,
            brokerPhoneNumber: broker.phoneNumber,
            flowToken: flowToken,
            messageType: props.reminderType || "reminder",
            status: "sent",
          })
          .returning({ id: bidFlowMessages.id });

        results.push({
          brokerId: broker.id,
          brokerName: broker.name,
          flowMessageId: flowMessage.id,
          status: "sent",
        });
      } catch (error) {
        results.push({
          brokerId: broker.id,
          brokerName: broker.name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      enquiryId: props.enquiryId,
      reminderType: props.reminderType || "reminder",
      results,
    };
  } catch (error) {
    console.error("Error sending reminder flow messages:", error);
    throw error;
  }
}

// New function to get flow message analytics
export async function getFlowMessageAnalytics(enquiryId: number) {
  try {
    const flowMessageStats = await db
      .select({
        messageType: bidFlowMessages.messageType,
        status: bidFlowMessages.status,
        brokerId: bidFlowMessages.brokerId,
        brokerName: brokers.name,
        sentAt: bidFlowMessages.sentAt,
        deliveredAt: bidFlowMessages.deliveredAt,
        readAt: bidFlowMessages.readAt,
        respondedAt: bidFlowMessages.respondedAt,
      })
      .from(bidFlowMessages)
      .leftJoin(brokers, eq(bidFlowMessages.brokerId, brokers.id))
      .where(eq(bidFlowMessages.enquiryId, enquiryId));

    const responseStats = await db
      .select({
        responseType: bidFlowMessageResponses.responseType,
        flowMessageId: bidFlowMessageResponses.bidFlowMessageId,
        bidId: bidFlowMessageResponses.bidId,
        createdAt: bidFlowMessageResponses.createdAt,
      })
      .from(bidFlowMessageResponses)
      .leftJoin(bidFlowMessages, eq(bidFlowMessageResponses.bidFlowMessageId, bidFlowMessages.id))
      .where(eq(bidFlowMessages.enquiryId, enquiryId));

    return {
      flowMessages: flowMessageStats,
      responses: responseStats,
    };
  } catch (error) {
    console.error("Error getting flow message analytics:", error);
    throw error;
  }
}