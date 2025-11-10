import { Request, Response } from "express";
import {
  transcribeAudioURL,
  addMessageToConversation,
  getConversation,
  clearConversation,
  extractEnquiryFromConversation,
} from "../util/openai";
import { sendTextMsg } from "../util/gupshup";
import { leads, enquiries } from "../db/schema";
import { eq, ilike, and } from "drizzle-orm";
import { db } from "../db/connection";
import * as dotenv from "dotenv";

dotenv.config();

async function processEndOfConversation(phoneNumber: string) {
  try {
    const messages = getConversation(phoneNumber);

    if (messages.length === 0) {
      console.log(`No conversation found for ${phoneNumber}`);
      return;
    }

    console.log(
      `Processing conversation for ${phoneNumber} with ${messages.length} messages`
    );

    // Extract enquiry data using OpenAI
    const enquiryData = await extractEnquiryFromConversation(
      phoneNumber,
      messages
    );
    console.log("Extracted enquiry data:", enquiryData);

    // Validate extracted phone number
    if (!enquiryData.customerPhoneNumber || enquiryData.customerPhoneNumber.trim() === '') {
      throw new Error('No customer phone number found in conversation. Please provide customer phone number.');
    }

    // Check if customer/lead already exists by extracted phone number
    let leadId: number;
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.phone, enquiryData.customerPhoneNumber))
      .limit(1);

    if (existingLead.length > 0) {
      // Found existing customer with this phone number
      leadId = existingLead[0].id;
      console.log(`Found existing lead with ID: ${leadId} for phone: ${enquiryData.customerPhoneNumber}`);
    } else {
      // No customer found with this phone number - create new lead
      const [newLead] = await db
        .insert(leads)
        .values({
          userId: 1, // Use userId 1 for WhatsApp enquiries
          name: enquiryData.customerName,
          phone: enquiryData.customerPhoneNumber,
          source: "unknown" as const,
        })
        .returning({ id: leads.id });

      leadId = newLead.id;
      console.log(`Created new lead with ID: ${leadId} for customer: ${enquiryData.customerName} (phone: ${enquiryData.customerPhoneNumber})`);
    }

    // Create enquiry
    const [newEnquiry] = await db
      .insert(enquiries)
      .values({
        userId: 1, // Use userId 1 for WhatsApp enquiries
        leadId,
        from: enquiryData.from,
        to: enquiryData.to,
        cargoType: enquiryData.cargoType,
        cargoWeight: enquiryData.cargoWeight,
        remarks: enquiryData.remarks,
        source: "unknown" as const,
        status: "pending" as const,
      })
      .returning({ id: enquiries.id });

    console.log(`Created new enquiry with ID: ${newEnquiry.id}`);

    // Send success message to user (to the WhatsApp sender)
    await sendTextMsg({
      text: `✅ Enquiry has been successfully submitted!\n\n📋 *Enquiry #CE${newEnquiry.id}*\n👤 *Customer:* ${enquiryData.customerName}\n📱 *Phone:* ${enquiryData.customerPhoneNumber}\n📍 *Route:* ${enquiryData.from} → ${enquiryData.to}\n📦 *Cargo:* ${enquiryData.cargoType}${enquiryData.cargoWeight ? `\n⚖️ *Weight:* ${enquiryData.cargoWeight} MT` : ''}${enquiryData.remarks ? `\n📝 *Remarks:* ${enquiryData.remarks}` : ''}\n\nWe will get back to the customer soon with quotes. Thank you! 🙏`,
      toPhoneNumber: phoneNumber, // Send to WhatsApp sender (your authorized number)
    });

    // Clear the conversation from memory
    clearConversation(phoneNumber);
  } catch (error) {
    console.error("Error processing end of conversation:", error);
    
    // Send failure message to user
    try {
      const errorMessage = error instanceof Error && error.message.includes('No customer phone number') 
        ? `❌ Error: No customer phone number found in conversation. Please make sure to include the customer's phone number in the enquiry details.`
        : `❌ Sorry, there was an error processing the enquiry. Please try again or contact our support team.`;
        
      await sendTextMsg({
        text: errorMessage,
        toPhoneNumber: phoneNumber, // Send to WhatsApp sender
      });
    } catch (msgError) {
      console.error("Error sending failure message:", msgError);
    }
    
    // Still clear the conversation even if there was an error
    clearConversation(phoneNumber);
  }
}

interface Body {
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
        contacts: Array<{
          profile: { name: string };
          wa_id: string; // Phone number
        }>;
        messages: Array<
          {
            from: string; // Phone Number
            id: string;
            timestamp: string;
          } & (
            | { type: "text"; text: { body: string } }
            | {
                type: "audio";
                audio: {
                  id: string;
                  mime_type: string;
                  sha256: string;
                  url: string;
                  voice: boolean;
                };
              }
            | {
                type: "image";
                image: {
                  caption?: string;
                  id: string;
                  mime_type: string;
                  sha256: string;
                  url: string;
                };
              }
          )
        >;
      };
    }>;
  }>;
}

// https://partner-docs.gupshup.io/docs/set-callback-url-1
export const gupshup_v3_msg_webhook = async (
  req: Request<any, any, Body>,
  res: Response
) => {
  // console.log(JSON.stringify(req.body, null, 2));
  try {
    for (const entry of req.body.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        for (const msg of change.value.messages) {
          const senderPhoneNumber = msg.from;
          // Only process messages from the authorized number
          if (
            ["917595903437", "918902673788"].find(
              (v) => senderPhoneNumber === v
            )
          ) {
            await placeOrder(msg, senderPhoneNumber);
          }
        }
      }
    }
  } catch (err) {
    console.error("Webhook error:", err);
  } finally {
    res.sendStatus(200);
  }
};

export async function placeOrder(msg: any, senderPhoneNumber: string) {
  let messageContent = "";

  // Process different message types
  if (msg.type === "text") {
    messageContent = msg.text.body;
  } else if (msg.type === "audio") {
    try {
      messageContent = await transcribeAudioURL(msg.audio.url);
      console.log(`Transcribed audio: ${messageContent}`);
    } catch (error) {
      console.error("Error transcribing audio:", error);
      return;
    }
  } else if (msg.type === "image") {
    messageContent = msg.image.caption || "[Image received]";
  }

  // Check if user wants to end the conversation
  if (messageContent.toLowerCase().trim() === "end") {
    await processEndOfConversation(senderPhoneNumber);
  } else {
    // Add message to conversation
    addMessageToConversation(senderPhoneNumber, messageContent);
    console.log(`Added message from ${senderPhoneNumber}: ${messageContent}`);
  }
}

/**
 * Voice Message
{
  "entry": [
    {
      "changes": [
        {
          "field": "messages",
          "value": {
            "contacts": [
              {
                "profile": {
                  "name": "Soumit"
                },
                "wa_id": "917595903437"
              }
            ],
            "messages": [
              {
                "audio": {
                  "id": "1408004134667495",
                  "mime_type": "audio/ogg; codecs=opus",
                  "sha256": "CyMEHvRmOVeLLKt04hueogRguSSD0LZjAnRu60033oM=",
                  "url": "https://filemanager.gupshup.io/wa/3553ab46-e985-4195-989d-9bb90653e439/wa/media/1408004134667495?download=false",
                  "voice": true
                },
                "from": "917595903437",
                "id": "wamid.HBgMOTE3NTk1OTAzNDM3FQIAEhggQUMwRDI1ODg0N0ZGRTg4MjdDRUJGQTlCQkQxQkMwMEYA",
                "timestamp": "1760434985",
                "type": "audio"
              }
            ],
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "919147370292",
              "phone_number_id": "744596618744161"
            }
          }
        }
      ],
      "id": "658675287277946"
    }
  ],
  "gs_app_id": "3553ab46-e985-4195-989d-9bb90653e439",
  "object": "whatsapp_business_account"
}

 */

/**
GUPSHUP INCOMING WHATSAPP IMAGE MESSAGE
{
  "entry": [
    {
      "changes": [
        {
          "field": "messages",
          "value": {
            "contacts": [
              {
                "profile": {
                  "name": "Soumit"
                },
                "wa_id": "917595903437"
              }
            ],
            "messages": [
              {
                "context": {
                  "forwarded": true
                },
                "from": "917595903437",
                "id": "wamid.HBgMOTE3NTk1OTAzNDM3FQIAEhggQUM2MDMxQkFDMkVEOENGNUQ0QUM5RDI1M0EzNTMzQUIA",
                "image": {
                  "caption": "3 size ka \n4pc each",
                  "id": "669334766233018",
                  "mime_type": "image/jpeg",
                  "sha256": "QGqcHbByhiJM2iEZEfa6AEGgI4vd+vt0G0p7Zig1Vu4=",
                  "url": "https://filemanager.gupshup.io/wa/3553ab46-e985-4195-989d-9bb90653e439/wa/media/669334766233018?download=false"
                },
                "timestamp": "1761220621",
                "type": "image"
              }
            ],
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "919147370292",
              "phone_number_id": "744596618744161"
            }
          }
        }
      ],
      "id": "658675287277946"
    }
  ],
  "gs_app_id": "3553ab46-e985-4195-989d-9bb90653e439",
  "object": "whatsapp_business_account"
}

 */
