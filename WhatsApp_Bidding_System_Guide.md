# WhatsApp Bidding System - Implementation Guide

## Overview

This system allows you to send WhatsApp bid requests to transport brokers and receive bids through interactive flow forms. Brokers receive professional WhatsApp messages with bid buttons that open forms where they can submit their rates.

## How It Works

### 1. **Broker Selection**
- Navigate to Transport Broker Rate Enquiries page
- Click on the expand arrow (▼) next to any enquiry 
- Switch to the "WhatsApp Bid Requests" tab
- Click "Send New Requests" to open broker selection modal

### 2. **Sending Bid Requests**
- Search and filter brokers by name, company, city, or phone
- Use checkboxes to select multiple brokers
- Click "Send to X Brokers" to send WhatsApp messages
- Each broker receives a message with enquiry details and a "Place Bid" button

### 3. **Tracking Responses**
- Monitor real-time status: Sent → Delivered → Read → Responded
- View statistics dashboard showing response rates
- See bid amounts and remarks as they come in

### 4. **Managing Bids**
- All received bids appear in the table with broker details
- Compare bid amounts (min/max/average shown in stats)
- Send reminders to brokers who haven't responded
- View bid remarks and submission times

## Frontend Integration

### Option 1: Use the Complete Table Component
```tsx
import BidRequestsTable from '@/components/bidding/BidRequestsTable';

export default function YourEnquiryPage({ enquiryId }: { enquiryId: number }) {
  return (
    <div>
      <h1>Enquiry #{enquiryId}</h1>
      <BidRequestsTable 
        enquiryId={enquiryId} 
        isExpanded={true} 
      />
    </div>
  );
}
```

### Option 2: Use Individual Components
```tsx
import BrokerSelectionModal from '@/components/bidding/BrokerSelectionModal';

const [showModal, setShowModal] = useState(false);

// Button to trigger broker selection
<button onClick={() => setShowModal(true)}>
  Send Bid Requests
</button>

<BrokerSelectionModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  enquiryId={123}
  onBidRequestsSent={(results) => {
    console.log('Sent to', results.totalBrokers, 'brokers');
    // Refresh your data
  }}
/>
```

## API Endpoints

### Fetch Available Brokers
```typescript
GET /api/bidding/brokers

// Response: Array of brokers with phone numbers
[
  {
    "id": 1,
    "companyName": "ABC Transport",
    "personName": "John Doe", 
    "phone": "919876543210",
    "city": "Mumbai"
  }
]
```

### Send Bid Requests
```typescript
POST /api/bidding/enquiry/:id/send-bid-requests

// Request Body:
{
  "brokerIds": [1, 2, 3],
  "templateName": "kiran_transport_bid",
  "flowId": "24105313799145675"
}

// Response:
{
  "enquiryId": 123,
  "totalBrokers": 3,
  "results": [
    {
      "brokerId": 1,
      "brokerName": "ABC Transport",
      "success": true,
      "gupshupMessageId": "msg_123"
    }
  ]
}
```

### Fetch Bid Data
```typescript
GET /api/bidding/enquiry/:id/bids

// Response:
{
  "enquiry": { /* enquiry details */ },
  "bidRequests": [
    {
      "flowMessageId": 1,
      "messageStatus": "delivered", 
      "brokerCompanyName": "ABC Transport",
      "brokerPhone": "919876543210",
      "bidAmount": "45000", // If bid submitted
      "bidRemarks": "Includes GPS tracking"
    }
  ]
}
```

### Get Statistics
```typescript
GET /api/bidding/enquiry/:id/stats

// Response:
{
  "totalSent": 5,
  "totalDelivered": 4,
  "totalRead": 3,
  "totalResponded": 2,
  "totalBids": 2,
  "avgBidAmount": 47500,
  "minBidAmount": 45000,
  "maxBidAmount": 50000
}
```

### Send Reminders
```typescript
POST /api/bidding/enquiry/:id/send-reminders

// Response:
{
  "enquiryId": 123,
  "remindersSent": 2,
  "results": [/* reminder results */]
}
```

## WhatsApp Flow Configuration

### Template Structure
The system uses a WhatsApp template with:
- **Header**: "Goods Transport Rate Enquiry"
- **Body**: Dynamic enquiry details (route, cargo, weight, etc.)
- **Button**: "Place Bid" (opens the flow form)

### Flow Form Fields
The flow form includes:
- **Pre-filled data**: Enquiry details from the original request
- **Input fields**: 
  - Bid Amount (₹) - Required number input
  - Additional Remarks - Optional text area
- **Submit button**: "Submit Bid"

### Flow Response Processing
When brokers submit the form:
1. System receives the response via webhook
2. Validates bid amount and flow token
3. Creates bid record in database
4. Sends confirmation message to broker
5. Updates enquiry statistics

## Current Implementation Status

### ✅ **Completed Features**
- **Backend API**: Complete REST API for bidding operations
- **Database Schema**: Tables for bid flow messages, bids, and responses
- **WhatsApp Integration**: Template sending and flow response handling  
- **Frontend Components**: Broker selection modal and bid management table
- **Real-time Tracking**: Message status updates (sent/delivered/read/responded)
- **Statistics Dashboard**: Comprehensive bid analytics
- **Reminder System**: Automated reminders to non-responders

### 📱 **WhatsApp Features**
- **Professional Templates**: Branded enquiry messages with company details
- **Interactive Flows**: User-friendly bid submission forms
- **Status Tracking**: Real-time delivery and read receipts
- **Error Handling**: Invalid bid validation and error messages
- **Confirmation Messages**: Automatic bid confirmation to brokers

### 🔧 **Integration Points**
- **Transport Enquiries Page**: Tabbed interface with WhatsApp bid requests
- **Manual vs WhatsApp Bids**: Separate tracking for different bid sources  
- **Existing Broker Database**: Uses current broker records with phone numbers
- **Authentication**: Integrates with existing user authentication system

## Usage Example

### Option A: From Enquiries List Page
1. **Go to Transport Broker Rate Enquiries page**
2. **Click the expand arrow** next to any enquiry
3. **Switch to "WhatsApp Bid Requests" tab**
4. **Click "Send New Requests"** 
5. **Select brokers** using search and checkboxes
6. **Click "Send to X Brokers"**
7. **Monitor responses** in real-time table
8. **Send reminders** to non-responders as needed
9. **Compare bids** and select the best rates

### Option B: From Individual Enquiry Detail Page
1. **Click on any enquiry** to view details
2. **Navigate to the "WhatsApp Bid Requests" tab** in the bids section
3. **Use the integrated bid management interface** for detailed operations
4. **Switch to "Manual Bids" tab** to view traditional bids
5. **Create orders** directly from successful bids

The system is now fully integrated and ready to use! Brokers will receive professional WhatsApp messages and can submit bids through an intuitive flow interface.