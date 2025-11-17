import { db } from "../db/connection";
import { brokerTransportRateBids, transportBrokerRateEnquiries, transportBidFlowMessages } from "../db/schema/brokerTransportRates";
import { brokers } from "../db/schema/brokers";
import { eq, and } from "drizzle-orm";

export interface ProcessBidResponseProps {
  flowToken: string;
  bidAmount: number;
  remarks?: string;
  phoneNumber: string;
  responseData?: any;
}

export async function processSimpleBidResponse(props: ProcessBidResponseProps) {
  try {
    // Parse flow token to get enquiry ID and broker ID
    // Flow token format: "{enquiryId}_{brokerId}_{timestamp}.{hash}"
    const tokenParts = props.flowToken.split('.');
    if (tokenParts.length !== 2) {
      throw new Error("Invalid flow token format");
    }
    
    const mainToken = tokenParts[0];
    const [enquiryId, brokerId, timestamp] = mainToken.split('_').map(Number);
    
    if (!enquiryId || !brokerId) {
      throw new Error("Invalid flow token: missing enquiry or broker ID");
    }

    console.log(`Processing bid: enquiryId=${enquiryId}, brokerId=${brokerId}, amount=${props.bidAmount}`);

    // Verify enquiry exists
    const [enquiry] = await db
      .select()
      .from(transportBrokerRateEnquiries)
      .where(eq(transportBrokerRateEnquiries.id, enquiryId))
      .limit(1);

    if (!enquiry) {
      throw new Error(`Enquiry with ID ${enquiryId} not found`);
    }

    // Verify broker exists
    const [broker] = await db
      .select()
      .from(brokers)
      .where(eq(brokers.id, brokerId))
      .limit(1);

    if (!broker) {
      throw new Error(`Broker with ID ${brokerId} not found`);
    }

    // Check if broker's phone matches the sender
    // if (broker.phone !== props.phoneNumber) {
    //   throw new Error(`Phone number mismatch. Expected: ${broker.phone}, Got: ${props.phoneNumber}`);
    // }

    // Check if bid already exists for this enquiry + broker combination
    const existingBid = await db
      .select()
      .from(brokerTransportRateBids)
      .where(
        and(
          eq(brokerTransportRateBids.enquiryId, enquiryId),
          eq(brokerTransportRateBids.brokerId, brokerId)
        )
      )
      .limit(1);

    // Update the flow message with response details
    await db
      .update(transportBidFlowMessages)
      .set({
        respondedAt: new Date(),
        responseAmount: props.bidAmount,
      })
      .where(eq(transportBidFlowMessages.flowToken, props.flowToken));

    if (existingBid.length > 0) {
      // Update existing bid
      await db
        .update(brokerTransportRateBids)
        .set({
          rate: props.bidAmount,
          updatedAt: new Date(),
        })
        .where(eq(brokerTransportRateBids.id, existingBid[0].id));

      console.log(`Updated existing bid ${existingBid[0].id} with new amount: ${props.bidAmount}`);
      
      return {
        bidId: existingBid[0].id,
        enquiryId,
        brokerId,
        bidAmount: props.bidAmount,
        status: "updated",
      };
    } else {
      // Create new bid
      const [newBid] = await db
        .insert(brokerTransportRateBids)
        .values({
          enquiryId,
          brokerId,
          rate: props.bidAmount,
        })
        .returning({ id: brokerTransportRateBids.id });

      console.log(`Created new bid ${newBid.id} for enquiry ${enquiryId}, broker ${brokerId}, amount: ${props.bidAmount}`);

      return {
        bidId: newBid.id,
        enquiryId,
        brokerId,
        bidAmount: props.bidAmount,
        status: "created",
      };
    }
  } catch (error) {
    console.error("Error processing simple bid response:", error);
    throw error;
  }
}