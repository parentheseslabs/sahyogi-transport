"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Table } from '../ui/table';
import BrokerSelectionModal from './BrokerSelectionModal';

interface Enquiry {
  id: number;
  from: string;
  to: string;
  cargoType: string;
  cargoWeight?: number;
  remarks?: string;
  status: string;
  createdAt: string;
}

interface BidRequest {
  flowMessageId: number;
  flowToken: string;
  messageStatus: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  respondedAt?: string;
  brokerId: number;
  brokerCompanyName: string;
  brokerPersonName: string;
  brokerPhone: string;
  brokerCity: string;
  bidId?: number;
  bidAmount?: string;
  bidRemarks?: string;
  bidStatus?: string;
  bidSubmittedAt?: string;
}

interface BidManagementProps {
  enquiryId: number;
}

export default function BidManagement({ enquiryId }: BidManagementProps) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [bidRequests, setBidRequests] = useState<BidRequest[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);

  useEffect(() => {
    fetchBidData();
    fetchStats();
  }, [enquiryId]);

  const fetchBidData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/bids`);
      if (!response.ok) throw new Error('Failed to fetch bid data');
      const data = await response.json();
      setEnquiry(data.enquiry);
      setBidRequests(data.bidRequests);
    } catch (error) {
      console.error('Error fetching bid data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const sendReminders = async () => {
    try {
      const nonResponders = bidRequests
        .filter(req => req.messageStatus === 'delivered' && !req.bidId)
        .map(req => req.brokerId);

      if (nonResponders.length === 0) {
        alert('No brokers to send reminders to');
        return;
      }

      const response = await fetch(`/api/bidding/enquiry/${enquiryId}/send-reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to send reminders');
      const results = await response.json();
      
      alert(`Reminders sent to ${results.remindersSent} brokers`);
      fetchBidData(); // Refresh data
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    }
  };

  const getStatusBadge = (status: string, hasResponse: boolean = false) => {
    if (hasResponse) {
      return <Badge className="bg-green-600 text-white">Responded</Badge>;
    }
    
    switch (status) {
      case 'sent':
        return <Badge className="bg-blue-600 text-white">Sent</Badge>;
      case 'delivered':
        return <Badge className="bg-yellow-600 text-white">Delivered</Badge>;
      case 'read':
        return <Badge className="bg-purple-600 text-white">Read</Badge>;
      case 'failed':
        return <Badge className="bg-red-600 text-white">Failed</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  if (loading && !enquiry) {
    return <div className="p-6">Loading bid management...</div>;
  }

  return (
    <div className="p-6">
      {/* Enquiry Header */}
      {enquiry && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Bid Management - Enquiry #{enquiry.id}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>Route:</strong> {enquiry.from} → {enquiry.to}</div>
                <div><strong>Cargo:</strong> {enquiry.cargoType}</div>
                {enquiry.cargoWeight && (
                  <div><strong>Weight:</strong> {enquiry.cargoWeight} MT</div>
                )}
                <div><strong>Status:</strong> <Badge>{enquiry.status}</Badge></div>
              </div>
              {enquiry.remarks && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Remarks:</strong> {enquiry.remarks}
                </div>
              )}
            </div>
            <Button 
              onClick={() => setShowBrokerModal(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              Send New Bid Requests
            </Button>
          </div>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalSent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalDelivered}</div>
            <div className="text-sm text-gray-600">Delivered</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalRead}</div>
            <div className="text-sm text-gray-600">Read</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalResponded}</div>
            <div className="text-sm text-gray-600">Responded</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.totalBids}</div>
            <div className="text-sm text-gray-600">Bids</div>
          </Card>
          {stats.minBidAmount && (
            <Card className="p-4 text-center">
              <div className="text-xl font-bold text-green-600">
                ₹{parseInt(stats.minBidAmount).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Min Bid</div>
            </Card>
          )}
          {stats.maxBidAmount && (
            <Card className="p-4 text-center">
              <div className="text-xl font-bold text-red-600">
                ₹{parseInt(stats.maxBidAmount).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Max Bid</div>
            </Card>
          )}
          {stats.avgBidAmount && (
            <Card className="p-4 text-center">
              <div className="text-xl font-bold text-blue-600">
                ₹{parseInt(stats.avgBidAmount).toLocaleString('en-IN')}
              </div>
              <div className="text-sm text-gray-600">Avg Bid</div>
            </Card>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mb-6 flex gap-3">
        <Button 
          onClick={sendReminders}
          variant="outline"
          disabled={!bidRequests.some(req => req.messageStatus === 'delivered' && !req.bidId)}
        >
          Send Reminders to Non-Responders
        </Button>
        <Button onClick={fetchBidData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Bid Requests Table */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Bid Requests & Responses</h3>
        
        {bidRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bid requests sent yet. Click "Send New Bid Requests" to start.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th>Broker</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Sent At</th>
                  <th>Delivered</th>
                  <th>Read</th>
                  <th>Bid Amount</th>
                  <th>Bid Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bidRequests.map((request) => (
                  <tr key={request.flowMessageId}>
                    <td>
                      <div>
                        <div className="font-medium">
                          {request.brokerCompanyName || request.brokerPersonName}
                        </div>
                        {request.brokerCompanyName && request.brokerPersonName && (
                          <div className="text-sm text-gray-600">
                            {request.brokerPersonName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{request.brokerPhone}</td>
                    <td>{request.brokerCity}</td>
                    <td>{getStatusBadge(request.messageStatus, !!request.bidId)}</td>
                    <td>{formatDateTime(request.sentAt)}</td>
                    <td>
                      {request.deliveredAt ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {request.readAt ? (
                        <span className="text-blue-600">✓</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {request.bidAmount ? (
                        <span className="font-medium text-green-600">
                          {formatCurrency(request.bidAmount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">No bid</span>
                      )}
                    </td>
                    <td>
                      {request.bidStatus && (
                        <Badge className="bg-blue-600 text-white">
                          {request.bidStatus}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {request.bidId && request.bidRemarks && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => alert(`Remarks: ${request.bidRemarks}`)}
                        >
                          View Remarks
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Broker Selection Modal */}
      <BrokerSelectionModal
        isOpen={showBrokerModal}
        onClose={() => setShowBrokerModal(false)}
        enquiryId={enquiryId}
        onBidRequestsSent={(results) => {
          console.log('Bid requests sent:', results);
          fetchBidData(); // Refresh data
          fetchStats(); // Refresh stats
        }}
      />
    </div>
  );
}