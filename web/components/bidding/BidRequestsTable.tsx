"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Eye, RefreshCw, Users } from 'lucide-react';
import BrokerSelectionModal from './BrokerSelectionModal';

interface BidRequest {
  id: number; // from transport_bid_flow_messages.id
  transportEnquiryId: number;
  brokerId: number;
  sentAt: string;
  flowToken: string;
  gupshupMsgId?: string;
  respondedAt?: string;
  responseAmount?: number; // this is the bid amount
  brokerCompanyName: string;
  brokerPersonName: string;
  brokerPhone: string;
  brokerCity: string;
}

interface BidStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalResponded: number;
  totalBids: number;
  avgBidAmount?: number;
  minBidAmount?: number;
  maxBidAmount?: number;
}

interface BidRequestsTableProps {
  enquiryId: number;
  isExpanded: boolean;
}

export default function BidRequestsTable({ enquiryId, isExpanded }: BidRequestsTableProps) {
  const [bidRequests, setBidRequests] = useState<BidRequest[]>([]);
  const [stats, setStats] = useState<BidStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchBidData();
    }
  }, [enquiryId, isExpanded]);

  const fetchBidData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        Authorization: `Bearer ${token}`,
      };
      
      // Fetch both bid requests and stats in parallel
      const [bidResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bidding/enquiry/${enquiryId}/bids`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bidding/enquiry/${enquiryId}/stats`, { headers })
      ]);

      if (bidResponse.ok) {
        const bidData = await bidResponse.json();
        setBidRequests(bidData.bidRequests || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching bid data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBidData();
    setRefreshing(false);
  };

  const sendReminders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bidding/enquiry/${enquiryId}/send-reminders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error('Failed to send reminders');
      const results = await response.json();
      
      alert(`Reminders sent to ${results.remindersSent} brokers`);
      await fetchBidData(); // Refresh data
      
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders');
    }
  };

  const getStatusIcon = (status: string, hasResponse: boolean = false) => {
    if (hasResponse) {
      return <CheckCircle size={14} className="text-green-600" title="Responded" />;
    }
    
    switch (status) {
      case 'sent':
        return <Send size={14} className="text-blue-600" title="Sent" />;
      case 'delivered':
        return <MessageSquare size={14} className="text-yellow-600" title="Delivered" />;
      case 'read':
        return <Eye size={14} className="text-purple-600" title="Read" />;
      case 'failed':
        return <XCircle size={14} className="text-red-600" title="Failed" />;
      default:
        return <Clock size={14} className="text-gray-600" title="Pending" />;
    }
  };

  const getStatusBadge = (status: string, hasResponse: boolean = false) => {
    if (hasResponse) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Responded</span>;
    }
    
    const statusStyles = {
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-yellow-100 text-yellow-800',
      read: 'bg-purple-100 text-purple-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatCurrency = (amount: string) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nonResponders = bidRequests.filter(req => !req.respondedAt).length;

  return (
    <div className="border border-gray-200 rounded bg-white">
      {/* Header with Stats */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-900">Bids</h4>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 text-gray-600 hover:text-black rounded"
              title="Refresh data"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowBrokerModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              <Users size={12} />
              Send New Requests
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="mt-2 flex gap-4 text-xs">
            <span className="text-blue-600 font-medium">{stats.totalSent} Sent</span>
            {/* <span className="text-yellow-600 font-medium">{stats.totalDelivered} Delivered</span>
            <span className="text-purple-600 font-medium">{stats.totalRead} Read</span> */}
            <span className="text-green-600 font-medium">{stats.totalResponded} Responded</span>
            {stats.totalBids > 0 && (
              <span className="text-indigo-600 font-medium">{stats.totalBids} Bids</span>
            )}
            {/* {stats.minBidAmount && stats.maxBidAmount && (
              <span className="text-gray-600">
                Range: ₹{parseInt(stats.minBidAmount).toLocaleString('en-IN')} - 
                ₹{parseInt(stats.maxBidAmount).toLocaleString('en-IN')}
              </span>
            )} */}
          </div>
        )}

        {/* Action Buttons */}
        {/* {bidRequests.length > 0 && (
          <div className="mt-2 flex gap-2">
            {nonResponders > 0 && (
              <button
                onClick={sendReminders}
                className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
              >
                <MessageSquare size={12} />
                Send Reminders ({nonResponders})
              </button>
            )}
          </div>
        )} */}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">Loading bid requests...</div>
        ) : bidRequests.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <div className="text-gray-500 text-sm mb-2">No bid requests sent yet</div>
            <button
              onClick={() => setShowBrokerModal(true)}
              className="flex items-center gap-1 mx-auto px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              <Users size={14} />
              Send Bid Requests to Brokers
            </button>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Broker</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Phone</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">City</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Status</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Sent</th>
                {/* <th className="text-left py-2 px-3 font-medium text-gray-600">Delivered</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Read</th> */}
                <th className="text-left py-2 px-3 font-medium text-gray-600">Bid Amount</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Submitted</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bidRequests.map((request) => (
                <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-3">
                    <div>
                      <div className="font-medium text-black">
                        {request.brokerCompanyName || request.brokerPersonName}
                      </div>
                      {request.brokerCompanyName && request.brokerPersonName && (
                        <div className="text-gray-600 text-xs">{request.brokerPersonName}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-black">{request.brokerPhone}</td>
                  <td className="py-2 px-3 text-gray-600">{request.brokerCity}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('sent', !!request.responseAmount)}
                      {getStatusBadge('sent', !!request.responseAmount)}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {formatDateTime(request.sentAt)}
                  </td>
                  {/* <td className="py-2 px-3 text-gray-600">-</td>
                  <td className="py-2 px-3 text-gray-600">-</td> */}
                  <td className="py-2 px-3">
                    {request.responseAmount ? (
                      <span className="font-medium text-green-600">
                        ₹{request.responseAmount.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-gray-400">No bid</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {request.respondedAt ? formatDateTime(request.respondedAt) : '-'}
                  </td>
                  <td className="py-2 px-3">
                    {request.responseAmount && (
                      <span className="text-green-600 text-xs">✓ Responded</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Broker Selection Modal */}
      <BrokerSelectionModal
        isOpen={showBrokerModal}
        onClose={() => setShowBrokerModal(false)}
        enquiryId={enquiryId}
        onBidRequestsSent={(results) => {
          console.log('Bid requests sent:', results);
          fetchBidData(); // Refresh data
          alert(`Bid requests sent to ${results.results.filter(r => r.success).length} brokers`);
        }}
      />
    </div>
  );
}