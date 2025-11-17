"use client";

// Example component showing how to use the bidding API endpoints from frontend

import React from 'react';

export default function BiddingAPIExamples() {
  // Example 1: Fetch all available brokers
  const fetchBrokers = async () => {
    try {
      const response = await fetch('/api/bidding/brokers');
      if (!response.ok) throw new Error('Failed to fetch brokers');
      const brokers = await response.json();
      console.log('Available brokers:', brokers);
      return brokers;
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Example 2: Send bid requests to selected brokers
  const sendBidRequests = async (enquiryId: number, brokerIds: number[]) => {
    try {
      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/send-bid-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brokerIds: brokerIds, // Array of broker IDs
          templateName: 'kiran_transport_bid', // WhatsApp template name
          flowId: '24105313799145675' // Meta Flow ID
        }),
      });

      if (!response.ok) throw new Error('Failed to send bid requests');
      const results = await response.json();
      
      console.log('Bid requests sent:', results);
      // results.results contains individual broker results
      // results.totalBrokers shows how many brokers were targeted
      
      return results;
    } catch (error) {
      console.error('Error sending bid requests:', error);
    }
  };

  // Example 3: Fetch bid requests and responses for an enquiry
  const fetchBidData = async (enquiryId: number) => {
    try {
      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/bids`);
      if (!response.ok) throw new Error('Failed to fetch bid data');
      const data = await response.json();
      
      console.log('Enquiry details:', data.enquiry);
      console.log('Bid requests:', data.bidRequests);
      
      return data;
    } catch (error) {
      console.error('Error fetching bid data:', error);
    }
  };

  // Example 4: Get bid statistics
  const fetchBidStats = async (enquiryId: number) => {
    try {
      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = await response.json();
      
      console.log('Bid statistics:', {
        totalSent: stats.totalSent,
        totalDelivered: stats.totalDelivered,
        totalRead: stats.totalRead,
        totalResponded: stats.totalResponded,
        totalBids: stats.totalBids,
        avgBidAmount: stats.avgBidAmount,
        minBidAmount: stats.minBidAmount,
        maxBidAmount: stats.maxBidAmount
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Example 5: Send reminders to non-responders
  const sendReminders = async (enquiryId: number) => {
    try {
      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/send-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to send reminders');
      const results = await response.json();
      
      console.log(`Reminders sent to ${results.remindersSent} brokers`);
      console.log('Reminder results:', results.results);
      
      return results;
    } catch (error) {
      console.error('Error sending reminders:', error);
    }
  };

  // Complete workflow example
  const completeWorkflowExample = async () => {
    const enquiryId = 123; // Your enquiry ID

    // Step 1: Fetch available brokers
    console.log('Step 1: Fetching brokers...');
    const brokers = await fetchBrokers();
    
    if (!brokers || brokers.length === 0) {
      console.log('No brokers available');
      return;
    }

    // Step 2: Select brokers (example: first 3 brokers)
    const selectedBrokerIds = brokers.slice(0, 3).map(broker => broker.id);
    console.log('Step 2: Selected brokers:', selectedBrokerIds);

    // Step 3: Send bid requests
    console.log('Step 3: Sending bid requests...');
    const bidResults = await sendBidRequests(enquiryId, selectedBrokerIds);
    
    if (!bidResults) {
      console.log('Failed to send bid requests');
      return;
    }

    console.log(`Sent bid requests to ${bidResults.totalBrokers} brokers`);

    // Step 4: Wait a bit, then check responses
    console.log('Step 4: Waiting 30 seconds, then checking responses...');
    setTimeout(async () => {
      const bidData = await fetchBidData(enquiryId);
      const stats = await fetchBidStats(enquiryId);
      
      console.log('Final results:', { bidData, stats });

      // Step 5: Send reminders to non-responders (if any)
      const nonResponders = bidData.bidRequests.filter(
        req => req.messageStatus === 'delivered' && !req.bidId
      ).length;
      
      if (nonResponders > 0) {
        console.log(`Step 5: Sending reminders to ${nonResponders} non-responders...`);
        await sendReminders(enquiryId);
      }
    }, 30000); // 30 seconds
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">WhatsApp Bidding System - API Usage Examples</h2>
      
      <div className="space-y-3">
        <button
          onClick={fetchBrokers}
          className="block w-full text-left p-3 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
        >
          <div className="font-medium">1. Fetch Available Brokers</div>
          <div className="text-sm text-gray-600">GET /api/bidding/brokers</div>
        </button>

        <button
          onClick={() => sendBidRequests(123, [1, 2, 3])}
          className="block w-full text-left p-3 bg-green-50 border border-green-200 rounded hover:bg-green-100"
        >
          <div className="font-medium">2. Send Bid Requests</div>
          <div className="text-sm text-gray-600">POST /api/bidding/enquiry/123/send-bid-requests</div>
        </button>

        <button
          onClick={() => fetchBidData(123)}
          className="block w-full text-left p-3 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100"
        >
          <div className="font-medium">3. Fetch Bid Data</div>
          <div className="text-sm text-gray-600">GET /api/bidding/enquiry/123/bids</div>
        </button>

        <button
          onClick={() => fetchBidStats(123)}
          className="block w-full text-left p-3 bg-yellow-50 border border-yellow-200 rounded hover:bg-yellow-100"
        >
          <div className="font-medium">4. Get Bid Statistics</div>
          <div className="text-sm text-gray-600">GET /api/bidding/enquiry/123/stats</div>
        </button>

        <button
          onClick={() => sendReminders(123)}
          className="block w-full text-left p-3 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100"
        >
          <div className="font-medium">5. Send Reminders</div>
          <div className="text-sm text-gray-600">POST /api/bidding/enquiry/123/send-reminders</div>
        </button>

        <button
          onClick={completeWorkflowExample}
          className="block w-full text-left p-3 bg-red-50 border border-red-200 rounded hover:bg-red-100"
        >
          <div className="font-medium">🚀 Complete Workflow Example</div>
          <div className="text-sm text-gray-600">Run entire bidding workflow (check console for logs)</div>
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-medium mb-2">Quick Start:</h3>
        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Import the BidRequestsTable component into your enquiry page</li>
          <li>Pass the enquiryId as a prop</li>
          <li>The component will handle broker selection and bid management automatically</li>
          <li>Check browser console for API response logs when testing</li>
        </ol>
      </div>
    </div>
  );
}