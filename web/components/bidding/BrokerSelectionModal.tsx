"use client";

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface Broker {
  id: number;
  companyName: string;
  personName: string;
  phone: string;
  city: string;
  remarks?: string;
}

interface BrokerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiryId: number;
  onBidRequestsSent: (results: any) => void;
}

export default function BrokerSelectionModal({
  isOpen,
  onClose,
  enquiryId,
  onBidRequestsSent
}: BrokerSelectionModalProps) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBrokerIds, setSelectedBrokerIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchBrokers();
    }
  }, [isOpen]);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bidding/brokers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch brokers');
      const data = await response.json();
      setBrokers(data);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrokers = brokers.filter(broker => 
    broker.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.phone?.includes(searchTerm)
  );

  const toggleBrokerSelection = (brokerId: number) => {
    setSelectedBrokerIds(prev => 
      prev.includes(brokerId)
        ? prev.filter(id => id !== brokerId)
        : [...prev, brokerId]
    );
  };

  const selectAll = () => {
    setSelectedBrokerIds(filteredBrokers.map(broker => broker.id));
  };

  const clearAll = () => {
    setSelectedBrokerIds([]);
  };

  const sendBidRequests = async () => {
    if (selectedBrokerIds.length === 0) {
      alert('Please select at least one broker');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bidding/enquiry/${enquiryId}/send-bid-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brokerIds: selectedBrokerIds,
          templateName: 'kiran_transport_bid',
          flowId: '24105313799145675'
        }),
      });

      if (!response.ok) throw new Error('Failed to send bid requests');
      const results = await response.json();
      
      onBidRequestsSent(results);
      onClose();
      setSelectedBrokerIds([]);
      
    } catch (error) {
      console.error('Error sending bid requests:', error);
      alert('Failed to send bid requests. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Brokers for Bid Requests" size="2xl">
      <div className="p-6 w-full">
        {/* Search and Actions */}
        <div className="mb-6">
          <div className="flex gap-4 items-center mb-4">
            <Input
              placeholder="Search brokers by name, company, city, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={selectAll} variant="outline" size="sm">
              Select All ({filteredBrokers.length})
            </Button>
            <Button onClick={clearAll} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedBrokerIds.length} of {filteredBrokers.length} brokers selected
            </span>
            <Button
              onClick={sendBidRequests}
              disabled={selectedBrokerIds.length === 0 || sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? 'Sending...' : `Send Bid Requests (${selectedBrokerIds.length})`}
            </Button>
          </div>
        </div>

        {/* Broker Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading brokers...</div>
            ) : filteredBrokers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No brokers found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={filteredBrokers.length > 0 && selectedBrokerIds.length === filteredBrokers.length}
                        onChange={() => selectedBrokerIds.length === filteredBrokers.length ? clearAll() : selectAll()}
                        className="w-4 h-4 text-blue-600"
                      />
                    </th>
                    <th className="text-left p-3 font-medium text-gray-700">Company Name</th>
                    <th className="text-left p-3 font-medium text-gray-700">Contact Person</th>
                    <th className="text-left p-3 font-medium text-gray-700">Phone</th>
                    <th className="text-left p-3 font-medium text-gray-700">City</th>
                    <th className="text-left p-3 font-medium text-gray-700">Remarks</th>
                    <th className="text-left p-3 font-medium text-gray-700 w-20">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBrokers.map((broker) => (
                    <tr
                      key={broker.id}
                      className={`border-t cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedBrokerIds.includes(broker.id) ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => toggleBrokerSelection(broker.id)}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedBrokerIds.includes(broker.id)}
                          onChange={() => toggleBrokerSelection(broker.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                      </td>
                      <td className="p-3 font-medium">{broker.companyName || '-'}</td>
                      <td className="p-3">{broker.personName || '-'}</td>
                      <td className="p-3 font-mono text-sm">{broker.phone}</td>
                      <td className="p-3">{broker.city}</td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate" title={broker.remarks || ''}>
                        {broker.remarks || '-'}
                      </td>
                      <td className="p-3">
                        {selectedBrokerIds.includes(broker.id) && (
                          <Badge className="bg-blue-600 text-white text-xs">Selected</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={sendBidRequests}
            disabled={selectedBrokerIds.length === 0 || sending}
            className="bg-green-600 hover:bg-green-700"
          >
            {sending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Sending Bid Requests...
              </>
            ) : (
              `Send to ${selectedBrokerIds.length} Brokers`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}