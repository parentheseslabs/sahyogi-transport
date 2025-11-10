'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Truck, DollarSign, MapPin, Package, Weight, Calendar, Tag, User, FileText } from 'lucide-react';

interface CustomerOrder {
  id: number;
  enquiryId: number;
  quoteId: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Enquiry {
  id: number;
  leadId: number;
  from: string;
  to: string;
  cargoType: string;
  cargoWeight?: number;
  source: string;
  remarks?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Quote {
  id: number;
  enquiryId: number;
  costing?: string;
  quotationAmount: number;
  marginPercentage?: number;
  baseAmount?: number;
  isCustomAmount?: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Lead {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
}

interface TransportOrder {
  id: number;
  enquiryId: number;
  brokerName: string;
  route: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetails {
  id: number;
  enquiryId: number;
  quoteId: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  enquiry: Enquiry;
  quote: Quote;
  lead: Lead;
  transportOrders: TransportOrder[];
}

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      alert('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'active' | 'completed' | 'cancelled') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/customer-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');
      fetchOrderDetails();
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Customer order not found</div>
      </div>
    );
  }

  const { enquiry, quote, lead, transportOrders } = orderDetails;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/customer-orders')}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-black">Customer Order Details</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(orderDetails.status)}`}>
                {orderDetails.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">Order ID: CO{orderDetails.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={orderDetails.status}
            onChange={(e) => handleStatusUpdate(e.target.value as 'active' | 'completed' | 'cancelled')}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => router.push(`/enquiries/${enquiry.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
          >
            <Package size={12} />
            View Enquiry
          </button>
        </div>
      </div>

      {/* Lead Information */}
      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
          <User size={14} />
          Customer Information
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-xs font-medium text-black">{lead.name}</p>
          </div>
          {lead.company && (
            <div>
              <p className="text-xs text-gray-500">Company</p>
              <p className="text-xs font-medium text-black">{lead.company}</p>
            </div>
          )}
          {lead.phone && (
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-xs font-medium text-black">{lead.phone}</p>
            </div>
          )}
          {lead.email && (
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-xs font-medium text-black">{lead.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Enquiry Information */}
      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-black mb-3">Shipment Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Route</p>
              <p className="text-xs font-medium text-black">{enquiry.from} → {enquiry.to}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Package size={14} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Cargo Type</p>
              <p className="text-xs font-medium text-black">{enquiry.cargoType}</p>
            </div>
          </div>
          {enquiry.cargoWeight && (
            <div className="flex items-start gap-2">
              <Weight size={14} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Weight</p>
                <p className="text-xs font-medium text-black">{enquiry.cargoWeight} MT</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <Tag size={14} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Source</p>
              <p className="text-xs font-medium text-black capitalize">{enquiry.source.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Order Date</p>
              <p className="text-xs font-medium text-black">{new Date(orderDetails.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
        {enquiry.remarks && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">Enquiry Remarks</p>
            <p className="text-xs text-black mt-1">{enquiry.remarks}</p>
          </div>
        )}
      </div>

      {/* Selected Quote */}
      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
          <DollarSign size={14} />
          Selected Quote (Q{quote.id})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${
              quote.isCustomAmount ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {quote.isCustomAmount ? 'Custom' : 'Calculated'}
            </span>
          </div>
          {!quote.isCustomAmount && quote.baseAmount && (
            <div>
              <p className="text-xs text-gray-500">Base Amount</p>
              <p className="text-xs font-medium text-black">₹{quote.baseAmount.toLocaleString()}</p>
            </div>
          )}
          {!quote.isCustomAmount && quote.marginPercentage && (
            <div>
              <p className="text-xs text-gray-500">Margin</p>
              <p className="text-xs font-medium text-black">{quote.marginPercentage}%</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500">Final Amount</p>
            <p className="text-xs font-medium text-green-600 text-sm">₹{quote.quotationAmount.toLocaleString()}</p>
          </div>
        </div>
        {quote.costing && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">Costing Details</p>
            <p className="text-xs text-black mt-1">{quote.costing}</p>
          </div>
        )}
      </div>

      {/* Transport Orders */}
      <div className="bg-white rounded border border-gray-200">
        <h2 className="text-sm font-semibold text-black flex items-center gap-2 px-4 py-2 border-b border-gray-200">
          <Truck size={14} />
          Transport Orders ({transportOrders.length})
        </h2>
        {transportOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Broker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transportOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">TO{order.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">{order.brokerName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">{order.route}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">₹{order.amount}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">No transport orders found</p>
        )}
      </div>

      {/* Order Notes */}
      {orderDetails.notes && (
        <div className="bg-white rounded border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
            <FileText size={14} />
            Order Notes
          </h2>
          <p className="text-xs text-black">{orderDetails.notes}</p>
        </div>
      )}
    </div>
  );
}