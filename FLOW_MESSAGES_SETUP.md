# WhatsApp Flow Messages for Transport Bid System

## Overview

This system enables sending interactive WhatsApp Flow messages to transport brokers for collecting bids. The flow contains enquiry details and allows brokers to submit their bid amounts directly through WhatsApp.

## Components

### 1. Database Schema

#### Flow Messages Table (`flow_messages`)
- Tracks sent flow messages to brokers
- Links enquiries with brokers
- Stores message status and delivery information

#### Bids Table (`bids`)
- Stores bid responses from brokers
- Links to flow messages for traceability
- Tracks bid status (pending, submitted, accepted, etc.)

### 2. API Functions

#### `sendBidFlowMessage()` in `gupshup.ts`
- Sends formatted flow message to broker's WhatsApp
- Includes enquiry details (route, cargo, weight)
- Uses Meta Flow ID for interactive elements

#### `sendBidRequestToBrokers()` in `bidService.ts`
- Sends bid requests to multiple brokers simultaneously
- Tracks all sent messages in database
- Returns comprehensive status report

#### `processBidResponse()` in `bidService.ts`
- Processes incoming bid responses from flow webhook
- Validates bid data and creates bid records
- Updates flow message status

### 3. Webhooks

#### Flow Response Webhook (`/api/webhooks/gupshup_flow_response_webhook`)
- Receives flow submission responses from WhatsApp
- Processes bid amounts and remarks
- Sends confirmation messages to brokers

#### Message Status Webhook
- Tracks delivery and read receipts
- Updates flow message status in database

## Setup Instructions

### 1. Create WhatsApp Flow in Meta Business Manager

1. **Access Meta Business Manager**
   - Go to business.facebook.com
   - Navigate to WhatsApp > Flows

2. **Create New Flow**
   - Click "Create Flow"
   - Choose "Draft" mode for testing
   - Name: "Transport Bid Submission"

3. **Flow Design** (JSON structure):
```json
{
  "version": "4.0",
  "data_api_version": "3.0",
  "routing_model": "SINGLE_SCREEN",
  "screens": [
    {
      "id": "BID_FORM",
      "title": "Submit Your Bid",
      "terminal": true,
      "data": {},
      "layout": {
        "type": "SingleColumnLayout",
        "children": [
          {
            "type": "TextHeading",
            "text": "Transport Bid Submission"
          },
          {
            "type": "TextBody",
            "text": "Please enter your competitive bid amount for this transport enquiry."
          },
          {
            "type": "TextInput",
            "label": "Bid Amount (INR)",
            "input_type": "number",
            "name": "bid_amount",
            "required": true,
            "helper_text": "Enter amount in Indian Rupees"
          },
          {
            "type": "TextArea",
            "label": "Remarks (Optional)",
            "name": "remarks",
            "required": false,
            "helper_text": "Any additional notes about your service"
          },
          {
            "type": "Footer",
            "label": "Submit Bid",
            "on_click_action": {
              "name": "complete",
              "payload": {
                "bid_amount": "${form.bid_amount}",
                "remarks": "${form.remarks}",
                "flow_token": "${data.flow_token}"
              }
            }
          }
        ]
      }
    }
  ]
}
```

4. **Publish Flow**
   - Test the flow thoroughly
   - Publish for production use
   - Copy the Flow ID for configuration

### 2. Environment Configuration

Add to your `.env` file:
```env
# WhatsApp Flow Configuration
WHATSAPP_BID_FLOW_ID=your_flow_id_here
```

### 3. Database Migration

Run the migration to create new tables:
```bash
npm run db:generate
npm run db:migrate
```

## Usage

### 1. Send Bid Requests

**API Endpoint:** `POST /api/bid-requests/send-bid-request`

**Payload:**
```json
{
  "enquiryId": 123,
  "brokerIds": [1, 2, 3, 4],
  "flowId": "your_meta_flow_id"
}
```

**Response:**
```json
{
  "message": "Bid requests sent successfully",
  "data": {
    "enquiryId": 123,
    "totalBrokers": 4,
    "sent": 3,
    "failed": 1,
    "results": [...]
  }
}
```

### 2. Track Bid Responses

**API Endpoint:** `GET /api/bid-requests/enquiry/{enquiryId}/bids`

**Response:**
```json
{
  "enquiryId": 123,
  "totalBids": 3,
  "bids": [
    {
      "bidId": 1,
      "bidAmount": "45000.00",
      "remarks": "GPS tracking included",
      "status": "submitted",
      "brokerName": "Fast Transport",
      "submittedAt": "2024-11-08T10:30:00Z"
    }
  ]
}
```

### 3. Get Bid Statistics

**API Endpoint:** `GET /api/bid-requests/enquiry/{enquiryId}/bid-stats`

**Response:**
```json
{
  "enquiryId": 123,
  "stats": {
    "total": 3,
    "submitted": 3,
    "pending": 0,
    "lowestBid": 42000,
    "highestBid": 48000,
    "averageBid": 45000
  }
}
```

## Flow Message Example

When a broker receives a flow message, it will look like:

```
🚚 New Transport Bid Request

Hi Rajesh Transport! 👋

We have a new transport enquiry for you:

📋 Enquiry #123
📍 Route: Mumbai → Delhi
📦 Cargo: Electronics
⚖️ Weight: 5.5 MT
📝 Remarks: Fragile items, requires covered vehicle

Please submit your competitive bid amount for this transport.

Respond quickly to win more business! 🏆

[Submit Bid 💰] <- Interactive Button
```

## Error Handling

The system handles various error scenarios:

1. **Invalid Bid Amount**: Sends error message to broker
2. **Missing Flow Token**: Logs error and sends generic error message
3. **Duplicate Bids**: Prevents duplicate submissions
4. **Network Failures**: Tracks failed sends and provides retry mechanisms

## Monitoring

- All flow messages are logged with status tracking
- Bid submissions are timestamped and auditable
- Failed sends are recorded for retry attempts
- Delivery and read receipts are tracked

## Security Considerations

- Flow tokens are validated to prevent tampering
- Broker authentication through phone numbers
- Input validation for bid amounts
- Rate limiting should be implemented for production

## Future Enhancements

1. **Bid Expiry**: Automatic bid expiration after time limit
2. **Real-time Notifications**: WebSocket updates for new bids
3. **Bid Comparison**: Side-by-side bid comparison interface
4. **Broker Ratings**: Integration with broker performance metrics
5. **Auto-Award**: Automatic bid acceptance based on criteria