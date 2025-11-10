'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, Building2, Calendar, Package, MapPin, FileText, ArrowUpDown, ArrowUp, ArrowDown, Check, X, ShoppingCart } from 'lucide-react';

interface TransportBrokerRateEnquiry {
  id: number;
  routeId: number;
  cargoType: string;
  cargoWeight: number;
  transportDate: string;
  remarks?: string;
  status?: 'open' | 'bidding' | 'quoted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

interface Route {
  id: number;
  name?: string;
  locations?: Array<{ id: number; location: string; sequence: number }>;
}

interface Broker {
  id: number;
  companyName: string;
  personName: string;
  phone: string;
  city: string;
}

interface Bid {
  id: number;
  enquiryId: number;
  brokerId: number;
  rate: number;
  createdAt: string;
  updatedAt: string;
}

interface BidWithBroker {
  bid: Bid;
  broker: Broker;
}

export default function TransportBrokerRateEnquiryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [enquiry, setEnquiry] = useState<TransportBrokerRateEnquiry | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [bids, setBids] = useState<BidWithBroker[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidForm, setShowBidForm] = useState(false);
  const [editingBidId, setEditingBidId] = useState<number | null>(null);
  const [editingRate, setEditingRate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rate' | 'broker' | 'date'>('rate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({
    brokerId: '',
    rate: '',
  });
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<BidWithBroker | null>(null);
  const [orderFormData, setOrderFormData] = useState({});

  useEffect(() => {
    fetchEnquiry();
    fetchBids();
    fetchBrokers();
  }, [id]);

  const fetchEnquiry = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-broker-rate-enquiries/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch enquiry');

      const data = await response.json();
      setEnquiry(data);
      
      // Fetch route details
      if (data.routeId) {
        const routeResponse = await fetch(`http://localhost:3001/api/transport-routes/${data.routeId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (routeResponse.ok) {
          const routeData = await routeResponse.json();
          setRoute(routeData);
        }
      }
    } catch (error) {
      console.error('Error fetching enquiry:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids?enquiryId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bids');

      const data = await response.json();
      setBids(data);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const sortedBids = [...bids].sort((a, b) => {
    let compareValue = 0;
    
    switch (sortBy) {
      case 'rate':
        compareValue = a.bid.rate - b.bid.rate;
        break;
      case 'broker':
        compareValue = (a.broker?.companyName || '').localeCompare(b.broker?.companyName || '');
        break;
      case 'date':
        compareValue = new Date(a.bid.createdAt).getTime() - new Date(b.bid.createdAt).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (field: 'rate' | 'broker' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const fetchBrokers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/brokers?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch brokers');

      const data = await response.json();
      setBrokers(data.brokers || []);
    } catch (error) {
      console.error('Error fetching brokers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/transport-rate-bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId: parseInt(id),
          brokerId: parseInt(formData.brokerId),
          rate: parseFloat(formData.rate),
        }),
      });

      if (!response.ok) throw new Error('Failed to save bid');

      fetchBids();
      setShowBidForm(false);
      setFormData({ brokerId: '', rate: '' });
    } catch (error) {
      console.error('Error saving bid:', error);
      alert('Failed to save bid');
    }
  };

  const handleInlineEdit = (bid: Bid) => {
    setEditingBidId(bid.id);
    setEditingRate(bid.rate.toString());
  };

  const handleInlineSave = async (bidId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids/${bidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rate: parseFloat(editingRate) }),
      });

      if (!response.ok) throw new Error('Failed to update bid');

      fetchBids();
      setEditingBidId(null);
      setEditingRate('');
    } catch (error) {
      console.error('Error updating bid:', error);
      alert('Failed to update bid');
    }
  };

  const handleInlineCancel = () => {
    setEditingBidId(null);
    setEditingRate('');
  };

  const handleDelete = async (bidId: number) => {
    if (!confirm('Are you sure you want to delete this bid?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids/${bidId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete bid');

      fetchBids();
    } catch (error) {
      console.error('Error deleting bid:', error);
      alert('Failed to delete bid');
    }
  };

  const handleCreateOrder = (bidWithBroker: BidWithBroker) => {
    setSelectedBid(bidWithBroker);
    setShowCreateOrderModal(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBid) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/transport-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId: parseInt(id),
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const order = await response.json();
      alert(`Order ${order.id} created successfully!`);
      setShowCreateOrderModal(false);
      setSelectedBid(null);
      setOrderFormData({});
      
      // Refresh enquiry to update status
      fetchEnquiry();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  const getRouteDisplay = () => {
    if (!route) return `Route ID: ${enquiry?.routeId}`;
    
    if (route.name) return route.name;
    
    if (route.locations && route.locations.length > 0) {
      const sortedLocations = [...route.locations].sort((a, b) => a.sequence - b.sequence);
      return sortedLocations.map(loc => loc.location).join(' → ');
    }
    
    return `Route ID: ${route.id}`;
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusStyles = {
      open: 'bg-blue-100 text-blue-800',
      bidding: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${statusStyles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!enquiry) {
    return <div className="text-center py-8">Enquiry not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/transport-broker-rate-enquiries')}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-xl font-bold text-black">Transport Rate Enquiry Details</h1>
          {getStatusBadge(enquiry.status)}
        </div>
        <button
          onClick={() => router.push(`/transport-broker-rate-enquiries/${id}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
        >
          <Edit size={14} />
          Edit Enquiry
        </button>
      </div>

      {/* Enquiry Details */}
      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold mb-3 text-black">Enquiry Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <MapPin size={12} />
              <span>Route</span>
            </div>
            <p className="font-medium text-black">{getRouteDisplay()}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Package size={12} />
              <span>Cargo Type</span>
            </div>
            <p className="font-medium text-black">{enquiry.cargoType}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Package size={12} />
              <span>Weight (MT)</span>
            </div>
            <p className="font-medium text-black">{enquiry.cargoWeight}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Calendar size={12} />
              <span>Transport Date</span>
            </div>
            <p className="font-medium text-black">
              {new Date(enquiry.transportDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <FileText size={12} />
              <span>Remarks</span>
            </div>
            <p className="font-medium text-black">{enquiry.remarks || '-'}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <Calendar size={12} />
              <span>Created</span>
            </div>
            <p className="font-medium text-black">
              {new Date(enquiry.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Bids Section */}
      <div className="bg-white rounded border border-gray-200">
        <div className="flex justify-between items-center px-4 py-2">
          <h2 className="text-sm font-semibold text-black">Bids ({bids.length})</h2>
          <button
            onClick={() => {
              setFormData({ brokerId: '', rate: '' });
              setShowBidForm(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
          >
            <Plus size={14} />
            Add Bid
          </button>
        </div>

        {/* Bid Form */}
        {showBidForm && (
          <div className="mx-4 mb-4 p-3 bg-gray-50 rounded border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Broker
                  </label>
                  <select
                    value={formData.brokerId}
                    onChange={(e) => setFormData({ ...formData, brokerId: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-black"
                    required
                  >
                    <option value="">Select Broker</option>
                    {brokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.companyName} - {broker.personName} ({broker.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    placeholder="Enter rate"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-black"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidForm(false);
                    setFormData({ brokerId: '', rate: '' });
                  }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
                >
                  Add Bid
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bids Table */}
        {bids.length === 0 ? (
          <p className="text-center py-8 text-gray-500 text-xs">No bids received yet</p>
        ) : (
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    Sl. No
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    <button
                      onClick={() => handleSort('broker')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Broker
                      {sortBy === 'broker' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    Contact
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    City
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    <button
                      onClick={() => handleSort('rate')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Rate (₹)
                      {sortBy === 'rate' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Date
                      {sortBy === 'date' ? (
                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                      ) : (
                        <ArrowUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedBids.map((bidWithBroker, index) => (
                  <tr key={bidWithBroker.bid.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      {index+1}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                      B{bidWithBroker.bid.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      {bidWithBroker.broker?.companyName || 'Unknown Broker'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {bidWithBroker.broker?.personName || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {bidWithBroker.broker?.city || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {editingBidId === bidWithBroker.bid.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editingRate}
                            onChange={(e) => setEditingRate(e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-black"
                            step="0.01"
                            autoFocus
                          />
                          <button
                            onClick={() => handleInlineSave(bidWithBroker.bid.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={handleInlineCancel}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-black">
                          ₹{bidWithBroker.bid.rate.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(bidWithBroker.bid.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleCreateOrder(bidWithBroker)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="Create Order"
                          disabled={editingBidId !== null || enquiry?.status === 'quoted' || enquiry?.status === 'closed'}
                        >
                          <ShoppingCart size={12} />
                        </button>
                        <button
                          onClick={() => handleInlineEdit(bidWithBroker.bid)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                          disabled={editingBidId !== null}
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(bidWithBroker.bid.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          disabled={editingBidId !== null}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreateOrderModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4 text-black">Create Order</h2>
            
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <p className="text-gray-600">Broker:</p>
                <p className="font-medium text-black">{selectedBid.broker?.companyName}</p>
              </div>
              <div className="text-sm">
                <p className="text-gray-600">Rate:</p>
                <p className="font-medium text-black">₹{selectedBid.bid.rate.toLocaleString()}</p>
              </div>
              <p className="text-sm text-gray-600">
                This will create an order for this enquiry with the selected bid.
              </p>
            </div>

            <form onSubmit={handleSubmitOrder}>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateOrderModal(false);
                    setSelectedBid(null);
                  }}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
                >
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}