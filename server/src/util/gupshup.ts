import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const {
  API_URL,
  GUPSHUP_PARTNER_EMAIL,
  GUPSHUP_PARTNER_PASSWORD,
  GUPSHUP_APP_ID,
  GUPSHUP_SUB_TAG,
} = process.env;
const WEBHOOK_URL = new URL(
  "/api/webhooks/gupshup_incoming_msg_webhook",
  API_URL!
).toString();

// Flow responses are now handled in the main incoming message webhook
const FLOW_WEBHOOK_URL = WEBHOOK_URL;

const partnerClient = axios.create({ baseURL: "https://partner.gupshup.io/" });

export async function getPartnerToken() {
  try {
    const params = new URLSearchParams();
    params.set("email", GUPSHUP_PARTNER_EMAIL!);
    params.set("password", GUPSHUP_PARTNER_PASSWORD!);
    const r = await partnerClient.post<{ token: string }>(
      "/partner/account/login",
      params,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return r.data.token;
  } catch (err) {
    console.error(err);
  }
}

export async function getAppToken({
  appId,
  partnerToken,
}: {
  appId: string;
  partnerToken: string;
}) {
  try {
    const res = await partnerClient.get<{
      status: "success";
      token: {
        token: string;
        expiresOn: string;
      };
    }>(`/partner/app/${appId}/token/`, {
      headers: { Authorization: partnerToken },
    });
    const { token, expiresOn } = res.data.token;
    return { token, expiresOn };
  } catch (err) {
    console.error(err);
  }
}

export async function getSubscriptions({
  appToken,
  appId,
}: {
  appToken: string;
  appId: string;
}) {
  try {
    const res = await partnerClient.get<{
      status: "success";
      subscriptions: {
        id: string;
        tag: string;
        url: string;
      }[];
    }>(`/partner/app/${appId}/subscription`, {
      headers: { Authorization: appToken },
    });
    return res.data.subscriptions;
  } catch (err) {
    console.error(err);
  }
}

let cachedAppToken: { token: string; expiresOn: string } | undefined;

export function isCachedAppTokenExpired() {
  return false;
}

export async function getCachedAppToken() {
  if (!cachedAppToken || isCachedAppTokenExpired()) {
    cachedAppToken = undefined;
    const partnerToken = await getPartnerToken();
    if (!partnerToken) return;
    const appToken = await getAppToken({
      appId: GUPSHUP_APP_ID!,
      partnerToken,
    });
    if (!appToken) return;
    cachedAppToken = appToken;
  }
  return cachedAppToken.token;
}

export async function updateSubscriptionUrl({
  appId,
  subId,
  url,
  appToken,
}: {
  appToken: string;
  appId: string;
  subId: string;
  url: string;
}) {
  try {
    var params = new URLSearchParams();
    params.set("url", url);
    params.set("doCheck", "false");
    params.set("modes", "ALL,FAILED,TEMPLATE");
    params.set("version", "3");
    await partnerClient.put<
      { status: "success" } | { status: "error"; message: string }
    >(`/partner/app/${appId}/subscription/${subId}`, params, {
      headers: {
        Authorization: appToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return true;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response) {
        console.error(err.response?.data);
      } else {
        console.error(err.message);
      }
    } else {
      console.error(err);
    }
    return false;
  }
}

export async function createSubscription(props: {
  appId: string;
  appToken: string;
  url: string;
  tag: string;
  modes: string;
  version: "0" | "1" | "2" | "3";
  meta: any;
}) {
  try {
    const params = new URLSearchParams();
    params.set("url", props.url);
    params.set("tag", props.tag);
    params.set("showOnUI", "true");
    params.set("version", props.version);
    params.set("modes", props.modes);
    params.set("meta", JSON.stringify(props.meta));
    const res = await partnerClient.post<{
      status: "success";
      subscription: { id: string; tag: string };
    }>(`/partner/app/${props.appId}/subscription`, params, {
      headers: { Authorization: props.appToken },
    });
    return res.data.subscription;
  } catch (err) {
    if (err instanceof AxiosError) {
      if (err.response) {
        console.error(
          "Code:",
          err.code,
          "Response:",
          err.response.data as { status: "error"; message: string }
        );
      } else {
        console.error(err.message);
      }
    } else {
      console.error(err);
    }
  }
}

/**
 * Creates the necessary subscriptions if not present.
 * Otherwise it updates the subscriptions
 */
export async function createNecessarySubscriptions() {
  const appToken = await getCachedAppToken();
  if (!appToken) {
    console.error("Failed to get a valid app token");
    return false;
  }
  const subscriptions = await getSubscriptions({
    appId: GUPSHUP_APP_ID!,
    appToken,
  });
  if (typeof subscriptions === "undefined") {
    console.error("Failed to fetch subscriptions");
    return false;
  }

  const subIdx = subscriptions.findIndex((s) => s.tag === GUPSHUP_SUB_TAG!);
  if (subIdx == -1) {
    console.log(`Failed to find subscription with tag ${GUPSHUP_SUB_TAG!}`);
    console.log(`Creating subscription with tag ${GUPSHUP_SUB_TAG!}`);
    const sub = await createSubscription({
      appId: GUPSHUP_APP_ID!,
      url: WEBHOOK_URL!,
      tag: GUPSHUP_SUB_TAG!,
      modes: "ALL,FAILED,TEMPLATE",
      version: "3",
      meta: {},
      appToken,
    });
    if (sub) {
      console.log(
        `Successfully created subscription id: ${sub.id} tag: ${sub.tag}`
      );
    } else {
      console.error(
        `Failed to create subscription for tag ${GUPSHUP_SUB_TAG!}`
      );
      return false;
    }
  } else {
    const sub = subscriptions[subIdx];
    console.log(`Found webhook with tag: ${sub.tag} url: ${sub.url}`);
    if (sub.url !== WEBHOOK_URL) {
      console.log(
        `Updating url of tag: ${sub.tag} from ${sub.url} to ${WEBHOOK_URL}`
      );
      const success = await updateSubscriptionUrl({
        appId: GUPSHUP_APP_ID!,
        subId: sub.id,
        url: WEBHOOK_URL,
        appToken,
      });
      if (success) {
        console.log(
          `Successfully updated subscription id: ${sub.id} tag: ${sub.tag}`
        );
      } else {
        console.error(
          `Failed to update subscription id: ${sub.id} tag: ${sub.tag}`
        );
        return false;
      }
    }
  }
  return true;
}

export async function sendTextMsg(props: {
  text: string;
  toPhoneNumber: string;
}) {
  const appToken = await getCachedAppToken();
  const headers = { Authorization: appToken };
  const { data } = await partnerClient.post<{
    messages: { id: string }[];
    messaging_product: string;
    contacts: { input: string; wa_id: string }[];
  }>(
    `/partner/app/${GUPSHUP_APP_ID}/v3/message`,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: props.toPhoneNumber,
      type: 'text',
      text: { body: props.text },
    },
    { headers }
  );
  return data;
}

/**
 * Sends a text-based template message
 */
async function sendTextTemplate(props: {
  appId: string;
  toPhoneNumber: string;
  templateName: string;
  languageCode: string;
  parameters?: string[];
}) {
  const {
    appId,
    toPhoneNumber,
    templateName,
    languageCode,
    parameters = [],
  } = props;
  const appToken = await getCachedAppToken();
  const headers = { Authorization: appToken };

  const components =
    parameters.length > 0
      ? [
          {
            type: "body",
            parameters: parameters.map((param, index) => ({
              type: "text",
              text: param,
            })),
          },
        ]
      : [];

  return (
    await partnerClient.post<{
      messages: { id: string }[];
      messaging_product: string;
      contacts: { input: string; wa_id: string }[];
    }>(
      `/partner/app/${appId}/v3/message`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhoneNumber,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components,
        },
      },
      { headers }
    )
  ).data;
}

export async function sendFlowMessage(props: {
  toPhoneNumber: string;
  flowId: string;
  headerText: string;
  bodyText: string;
  footerText?: string;
  buttonText: string;
  flowData?: any; // Dynamic flow data if needed
}) {
  try {
    const appToken = await getCachedAppToken();
    if (!appToken) {
      throw new Error("Failed to get app token");
    }

    const headers = { Authorization: appToken };
    
    const flowPayload = {
      id: props.flowId,
      cta: props.buttonText,
      ...(props.flowData && { flow_data: props.flowData })
    };

    const params = new URLSearchParams();
    params.set("messaging_product", "whatsapp");
    params.set("recipient_type", "individual");
    params.set("to", props.toPhoneNumber);
    params.set("type", "interactive");
    
    const interactivePayload = {
      type: "flow",
      header: {
        type: "text",
        text: props.headerText
      },
      body: {
        text: props.bodyText
      },
      ...(props.footerText && {
        footer: {
          text: props.footerText
        }
      }),
      action: {
        name: "flow",
        parameters: {
          flow_id: props.flowId,
          flow_cta: props.buttonText,
          flow_action: "navigate",
          flow_action_payload: {
            screen: "DETAILS",
            ...(props.flowData && { data: props.flowData })
          }
        }
      }
    };

    params.set("interactive", JSON.stringify(interactivePayload));

    const response = await partnerClient.post<{
      messages: { id: string }[];
      messaging_product: string;
      contacts: { input: string; wa_id: string }[];
    }>(`/partner/app/${GUPSHUP_APP_ID}/v3/message`, params, { headers });

    return response.data;
  } catch (error) {
    console.error("Error sending flow message:", error);
    throw error;
  }
}

export async function sendBidFlowTemplate(props: {
  toPhoneNumber: string;
  templateName: string;
  languageCode?: string;
  enquiryDetails: string;
  flowId: string;
  flowToken: string;
  flowData?: Record<string, any>;
}) {
  try {
    const appToken = await getCachedAppToken();
    if (!appToken) {
      throw new Error("Failed to get app token");
    }

    const headers = { Authorization: appToken };
    
    const templateMessage = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: props.toPhoneNumber,
      type: "template",
      template: {
        name: props.templateName,
        language: { 
          code: props.languageCode || "en" 
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: props.enquiryDetails
              }
            ]
          },
          {
            type: "button",
            sub_type: "flow",
            index: "0",
            parameters: [
              {
                type: "action",
                action: {
                  flow_token: props.flowToken,
                  flow_action_data: {
                    flow_id: props.flowId,
                    navigate_screen: "BID_FORM",
                    ...(props.flowData || {})
                  }
                }
              }
            ]
          }
        ]
      }
    };

    const response = await partnerClient.post<{
      messages: { id: string }[];
      messaging_product: string;
      contacts: { input: string; wa_id: string }[];
    }>(`/partner/app/${GUPSHUP_APP_ID}/v3/message`, templateMessage, { headers });

    return response.data;
  } catch (error) {
    console.error("Error sending bid flow template:", error);
    throw error;
  }
}

export async function testSendBidTemplate(phoneNumber: string = "917595903437") {
  const enquiryDetails = "📋 *Enquiry 24* 📍 *Route:* Mumbai → Thane 📦 *Cargo:* Furniture ⚖️ *Weight:* 2.4 MT 🚛 *Vehicle:* Truck 📝 *Remarks:* Available on saturday only";
  
  const flowData = {
    enquiryId: "24",
    from: "Mumbai",
    to: "Thane", 
    cargoType: "Furniture",
    cargoWeight: "2.4",
    remarks: "Available on saturday only",
    vehicleType: "Truck"
  };

  const flowToken = `test_bid_token_${JSON.stringify({
    enquiry_id: 24,
    broker_id: 1, 
    timestamp: Date.now()
  })}`;

  try {
    console.log(`Sending bid template to ${phoneNumber}`);
    console.log("Enquiry Details:", enquiryDetails);
    console.log("Flow Data:", JSON.stringify(flowData, null, 2));
    console.log("Flow Token:", flowToken);

    const response = await sendBidFlowTemplate({
      toPhoneNumber: phoneNumber,
      templateName: "kiran_transport_bid",
      languageCode: "en",
      enquiryDetails,
      flowId: "24105313799145675", 
      flowToken,
      flowData
    });

    console.log("Template sent successfully:", JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error("Failed to send bid template:", error);
    throw error;
  }
}

export async function sendBidFlowMessage(props: {
  toPhoneNumber: string;
  brokerName: string;
  enquiryId: number;
  from: string;
  to: string;
  cargoType: string;
  cargoWeight?: number;
  remarks?: string;
  templateName?: string;
  flowId: string;
  flowToken: string;
  isReminder?: boolean;
}) {
  const isReminderMsg = props.isReminder || false;
  
  // Format enquiry details for the template parameter
  const enquiryDetails = `📋 *Enquiry ${props.enquiryId}*                                                                                             
📍 *Route:* ${props.from} → ${props.to}                                                                                                       
📦 *Cargo:* ${props.cargoType}                                                                                      
${props.cargoWeight ? `⚖️ *Weight:* ${props.cargoWeight} MT` : ''}                                                                                   
🚛 *Vehicle:* Truck                                                                                      
${props.remarks ? `📝 *Remarks:* ${props.remarks}` : 'Available on saturday only'}`;

  // Use template if provided, otherwise fallback to interactive flow
  if (props.templateName) {
    return await sendBidFlowTemplate({
      toPhoneNumber: props.toPhoneNumber,
      templateName: props.templateName,
      languageCode: "en",
      enquiryDetails,
      flowId: props.flowId,
      flowToken: props.flowToken
    });
  }

  // Fallback to interactive flow message (existing logic)
  const headerText = isReminderMsg 
    ? `🔔 Bid Reminder - Transport Request`
    : `🚚 New Transport Bid Request`;
  
  const reminderPrefix = isReminderMsg 
    ? `⏰ **REMINDER:** You haven't submitted your bid yet.\n\n`
    : '';
  
  const bodyText = `${reminderPrefix}Hi ${props.brokerName}! 👋

We have a ${isReminderMsg ? 'pending' : 'new'} transport enquiry for you:

${enquiryDetails}

Please submit your competitive bid amount for this transport.`;

  const footerText = isReminderMsg 
    ? "Submit your bid now to avoid missing out! ⏰"
    : "Respond quickly to win more business! 🏆";
  const buttonText = "Submit Bid 💰";

  // Flow data to pass to the flow - now includes flow token
  const flowData = {
    enquiry_id: props.enquiryId.toString(),
    from: props.from,
    to: props.to,
    cargo_type: props.cargoType,
    cargo_weight: props.cargoWeight?.toString() || "",
    broker_name: props.brokerName,
    phone_number: props.toPhoneNumber,
    flow_token: props.flowToken // Include flow token in the data
  };

  return await sendFlowMessage({
    toPhoneNumber: props.toPhoneNumber,
    flowId: props.flowId,
    headerText,
    bodyText,
    footerText,
    buttonText,
    flowData
  });
}

export async function setupGupshup() {
  return await createNecessarySubscriptions();
}
