'use client';

import React, { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Calendar, Truck, Package, MapPin, Eye, ArrowUp, ArrowDown, ArrowUpDown, ChevronUp, ChevronDown, Save, XCircle, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BidRequestsTable from '../../../components/bidding/BidRequestsTable';

interface TransportBrokerRateEnquiry {
  id: number;
  route_id?: number;
  routeId?: number;
  cargoType: string;
  cargoWeight: number;
  transportDate: string;
  remarks?: string;
  routeFrom?: string;
  routeTo?: string;
  status?: 'open' | 'bidding' | 'quoted' | 'closed';
  l1Rate?: number | null;
  l2Rate?: number | null;
  l1Broker?: string | null;
  l2Broker?: string | null;
  bidCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Route {
  id: number;
  name?: string;
  locations?: Array<{ id: number; location: string; sequence: number; remarks?: string }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TransportBrokerRateEnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<TransportBrokerRateEnquiry[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [pageSize, setPageSize] = useState(10);
  const [expandedEnquiries, setExpandedEnquiries] = useState<Set<number>>(new Set());
  const [bidsByEnquiry, setBidsByEnquiry] = useState<Record<number, any[]>>({});
  const [loadingBids, setLoadingBids] = useState<Set<number>>(new Set());
  const [brokers, setBrokers] = useState<any[]>([]);
  const [addingBidForEnquiry, setAddingBidForEnquiry] = useState<number | null>(null);
  const [editingBid, setEditingBid] = useState<number | null>(null);
  const [newBidForm, setNewBidForm] = useState({ brokerId: '', rate: '' });
  const [editBidForm, setEditBidForm] = useState({ rate: '' });
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [activeTab, setActiveTab] = useState<Record<number, 'manual' | 'whatsapp'>>({}); // Track active tab per enquiry

  const showToast = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  useEffect(() => {
    fetchEnquiries();
    fetchRoutes();
    fetchBrokers();
  }, [pagination.page, statusFilter, fromDate, toDate, sortBy, sortOrder, pageSize]);

  const fetchRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-routes?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`http://localhost:3001/api/transport-broker-rate-enquiries?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch enquiries');

      const data = await response.json();
      setEnquiries(data.enquiries || []);
      setPagination(data.pagination || {
        page: 1,
        limit: pageSize,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false,
      });
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchEnquiries();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPagination({ ...pagination, page: 1 });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPagination({ ...pagination, page: 1, limit: newPageSize });
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-broker-rate-enquiries/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to delete enquiry';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // Response is not JSON, use status text or generic message
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      showToast('Enquiry deleted successfully', 'success');
      fetchEnquiries();
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete enquiry';
      
      // Check for foreign key constraint violation (multiple possible indicators)
      if (errorMessage.toLowerCase().includes('foreign key constraint') || 
          errorMessage.toLowerCase().includes('still referenced') ||
          errorMessage.toLowerCase().includes('violates foreign key') ||
          errorMessage.toLowerCase().includes('23503') ||
          errorMessage.includes('transport_rate_bids')) {
        showToast('Cannot delete enquiry: This enquiry has active bids. Please delete all bids first before deleting the enquiry.', 'warning');
      } else {
        showToast(`Error: ${errorMessage}`, 'error');
      }
    }
  };

  const getRouteDisplay = (enquiry: TransportBrokerRateEnquiry) => {
    if (enquiry.routeFrom && enquiry.routeTo) {
      return `${enquiry.routeFrom} → ${enquiry.routeTo}`;
    }
    
    // Handle both possible field names for route ID
    const routeId = enquiry.route_id || enquiry.routeId;
    const route = routes.find(r => r.id === routeId);
    
    if (route) {
      // If route has a name, use it
      if (route.name) {
        return route.name;
      }
      
      // If route has locations, build the display from locations
      if (route.locations && route.locations.length > 0) {
        const sortedLocations = [...route.locations].sort((a, b) => a.sequence - b.sequence);
        const from = sortedLocations[0]?.location || 'Unknown';
        const to = sortedLocations[sortedLocations.length - 1]?.location || 'Unknown';
        return `${from} → ${to}`;
      }
      
      // Fallback to route ID if we found the route but no details
      return `Route ${route.id}`;
    }
    
    // If no route found but we have an ID, show the ID
    if (routeId) {
      return `Route ID: ${routeId}`;
    }
    
    return 'Route not found';
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
      <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${statusStyles[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  const toggleEnquiryExpansion = async (enquiryId: number) => {
    const newExpanded = new Set(expandedEnquiries);
    
    if (expandedEnquiries.has(enquiryId)) {
      newExpanded.delete(enquiryId);
      setExpandedEnquiries(newExpanded);
    } else {
      newExpanded.add(enquiryId);
      setExpandedEnquiries(newExpanded);
      
      // Fetch bids if not already fetched
      if (!bidsByEnquiry[enquiryId]) {
        await fetchBidsForEnquiry(enquiryId);
      }
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

      if (response.ok) {
        const data = await response.json();
        setBrokers(data.brokers || []);
      }
    } catch (error) {
      console.error('Error fetching brokers:', error);
    }
  };

  const fetchBidsForEnquiry = async (enquiryId: number) => {
    setLoadingBids(new Set(loadingBids).add(enquiryId));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids?enquiryId=${enquiryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bids');

      const bids = await response.json();
      setBidsByEnquiry(prev => ({
        ...prev,
        [enquiryId]: bids
      }));
    } catch (error) {
      console.error('Error fetching bids:', error);
      setBidsByEnquiry(prev => ({
        ...prev,
        [enquiryId]: []
      }));
    } finally {
      const newLoadingBids = new Set(loadingBids);
      newLoadingBids.delete(enquiryId);
      setLoadingBids(newLoadingBids);
    }
  };

  const handleAddBid = async (enquiryId: number) => {
    if (!newBidForm.brokerId || !newBidForm.rate) {
      alert('Please select a broker and enter a rate');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId,
          brokerId: parseInt(newBidForm.brokerId),
          rate: parseFloat(newBidForm.rate),
        }),
      });

      if (!response.ok) throw new Error('Failed to add bid');

      setNewBidForm({ brokerId: '', rate: '' });
      setAddingBidForEnquiry(null);
      await fetchBidsForEnquiry(enquiryId);
      await refreshEnquiryData(enquiryId);
    } catch (error) {
      console.error('Error adding bid:', error);
      alert('Failed to add bid');
    }
  };

  const handleEditBid = async (bidId: number, enquiryId: number) => {
    if (!editBidForm.rate) {
      alert('Please enter a rate');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids/${bidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rate: parseFloat(editBidForm.rate),
        }),
      });

      if (!response.ok) throw new Error('Failed to update bid');

      setEditBidForm({ rate: '' });
      setEditingBid(null);
      await fetchBidsForEnquiry(enquiryId);
      await refreshEnquiryData(enquiryId);
    } catch (error) {
      console.error('Error updating bid:', error);
      alert('Failed to update bid');
    }
  };

  const handleDeleteBid = async (bidId: number, enquiryId: number) => {
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

      await fetchBidsForEnquiry(enquiryId);
      await refreshEnquiryData(enquiryId);
    } catch (error) {
      console.error('Error deleting bid:', error);
      alert('Failed to delete bid');
    }
  };

  const startAddingBid = (enquiryId: number) => {
    setAddingBidForEnquiry(enquiryId);
    setNewBidForm({ brokerId: '', rate: '' });
  };

  const startEditingBid = (bidId: number, currentRate: number) => {
    setEditingBid(bidId);
    setEditBidForm({ rate: currentRate.toString() });
  };

  const cancelAddingBid = () => {
    setAddingBidForEnquiry(null);
    setNewBidForm({ brokerId: '', rate: '' });
  };

  const cancelEditingBid = () => {
    setEditingBid(null);
    setEditBidForm({ rate: '' });
  };

  const refreshEnquiryData = async (enquiryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-broker-rate-enquiries/${enquiryId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch updated enquiry data');

      const updatedEnquiry = await response.json();
      
      // Update the enquiry in the local state
      setEnquiries(prevEnquiries => 
        prevEnquiries.map(enquiry => 
          enquiry.id === enquiryId 
            ? { ...enquiry, ...updatedEnquiry }
            : enquiry
        )
      );
    } catch (error) {
      console.error('Error refreshing enquiry data:', error);
    }
  };

  const getActiveTab = (enquiryId: number): 'manual' | 'whatsapp' => {
    return activeTab[enquiryId] || 'whatsapp'; // Default to WhatsApp tab
  };

  const setTabForEnquiry = (enquiryId: number, tab: 'manual' | 'whatsapp') => {
    setActiveTab(prev => ({ ...prev, [enquiryId]: tab }));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Transport Broker Rate Enquiries</h1>
        <button
          onClick={() => router.push('/transport-broker-rate-enquiries/new')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
        >
          <Plus size={14} />
          Create Transport Enquiry
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black" size={14} />
            <input
              type="text"
              placeholder="Search by ID, cargo type or route..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="bidding">Bidding</option>
            <option value="quoted">Quoted</option>
            <option value="closed">Closed</option>
          </select>

          <button
            onClick={(e) => handleSearch(e as any)}
            className="px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
          >
            Search
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1">
            <Calendar size={12} className="text-gray-500" />
            <span className="text-xs text-gray-600">Date Range:</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
            placeholder="From Date"
          />
          <span className="text-xs text-gray-500">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
            placeholder="To Date"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
              title="Clear date filter"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1800px] text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase w-8"></th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    ID
                    {getSortIcon('id')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cargoType')}
                >
                  <div className="flex items-center gap-1">
                    Cargo
                    {getSortIcon('cargoType')}
                  </div>
                </th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('cargoWeight')}
                >
                  <div className="flex items-center gap-1">
                    Weight (MT)
                    {getSortIcon('cargoWeight')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L1 Broker</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L1 Amount</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L2 Broker</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L2 Amount</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('transportDate')}
                >
                  <div className="flex items-center gap-1">
                    Transport Date
                    {getSortIcon('transportDate')}
                  </div>
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Remarks</th>
                <th 
                  className="px-3 py-2 text-left text-xs font-medium text-black uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    Created
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-3 py-6 text-center text-black text-xs">Loading...</td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-6 text-center text-black text-xs">No rate enquiries found</td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <React.Fragment key={enquiry.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => toggleEnquiryExpansion(enquiry.id)}
                          className="p-1 text-gray-600 hover:text-black rounded"
                          title="Toggle bids"
                        >
                          {expandedEnquiries.has(enquiry.id) ? (
                            <ChevronUp size={12} />
                          ) : (
                            <ChevronDown size={12} />
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                        TE{enquiry.id}
                      </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1 text-black">
                        <MapPin size={12} />
                        <span className="font-medium">{getRouteDisplay(enquiry)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      <div className="flex items-center gap-1">
                        <Package size={12} />
                        {enquiry.cargoType}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black font-medium">
                      {enquiry.cargoWeight}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {enquiry.l1Broker ? (
                        <span className="font-medium text-green-600">{enquiry.l1Broker}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {enquiry.l1Rate ? (
                        <span className="font-medium text-green-600">₹{enquiry.l1Rate.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {enquiry.l2Broker ? (
                        <span className="font-medium text-blue-600">{enquiry.l2Broker}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {enquiry.l2Rate ? (
                        <span className="font-medium text-blue-600">₹{enquiry.l2Rate.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(enquiry.transportDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {getStatusBadge(enquiry.status)}
                    </td>
                    <td className="px-3 py-2 text-xs text-black">
                      <span className="truncate block max-w-xs" title={enquiry.remarks}>
                        {enquiry.remarks || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(enquiry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => router.push(`/transport-broker-rate-enquiries/${enquiry.id}`)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                          title="View Details & Bids"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => router.push(`/transport-broker-rate-enquiries/${enquiry.id}/edit`)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                          title="Edit Enquiry"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(enquiry.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Enquiry"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedEnquiries.has(enquiry.id) && (
                    <tr>
                      <td colSpan={14} className="px-3 py-2 bg-gray-50 space-y-3">
                        {/* WhatsApp Bid Requests */}
                        <BidRequestsTable
                          enquiryId={enquiry.id}
                          isExpanded={expandedEnquiries.has(enquiry.id)}
                        />
                        
                        {/* Bids */}
                        <div className="border border-gray-200 rounded bg-white">
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                              <h4 className="text-sm font-medium text-gray-900">Bids</h4>
                              <button
                                onClick={() => fetchBidsForEnquiry(enquiry.id)}
                                className="p-1 text-gray-600 hover:text-black rounded"
                                title="Refresh bids"
                              >
                                <RefreshCw size={14} className={loadingBids.has(enquiry.id) ? 'animate-spin' : ''} />
                              </button>
                            </div>
                          </div>
                          <div className="p-3">
                              {loadingBids.has(enquiry.id) ? (
                                <div className="text-xs text-gray-500 py-2">Loading manual bids...</div>
                              ) : bidsByEnquiry[enquiry.id]?.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="text-left py-1 px-2 text-gray-600">Broker</th>
                                    <th className="text-left py-1 px-2 text-gray-600">Company</th>
                                    <th className="text-left py-1 px-2 text-gray-600">City</th>
                                    <th className="text-left py-1 px-2 text-gray-600">Rate</th>
                                    <th className="text-left py-1 px-2 text-gray-600">Date</th>
                                    <th className="text-right py-1 px-2 text-gray-600">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bidsByEnquiry[enquiry.id].map((bidData: any) => (
                                    <tr key={bidData.bid.id} className="border-b border-gray-100">
                                      <td className="py-1 px-2 text-black">
                                        {bidData.broker?.personName || '-'}
                                      </td>
                                      <td className="py-1 px-2 text-black">
                                        {bidData.broker?.companyName || '-'}
                                      </td>
                                      <td className="py-1 px-2 text-black">
                                        {bidData.broker?.city || '-'}
                                      </td>
                                      <td className="py-1 px-2 text-black font-medium">
                                        {editingBid === bidData.bid.id ? (
                                          <input
                                            type="number"
                                            value={editBidForm.rate}
                                            onChange={(e) => setEditBidForm({ rate: e.target.value })}
                                            className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                            placeholder="Rate"
                                          />
                                        ) : (
                                          `₹${bidData.bid.rate.toLocaleString()}`
                                        )}
                                      </td>
                                      <td className="py-1 px-2 text-black">
                                        {new Date(bidData.bid.createdAt).toLocaleDateString()}
                                      </td>
                                      <td className="py-1 px-2 text-right">
                                        <div className="flex justify-end gap-1">
                                          {editingBid === bidData.bid.id ? (
                                            <>
                                              <button
                                                onClick={() => handleEditBid(bidData.bid.id, enquiry.id)}
                                                className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                                title="Save"
                                              >
                                                <Save size={10} />
                                              </button>
                                              <button
                                                onClick={cancelEditingBid}
                                                className="p-0.5 text-gray-600 hover:bg-gray-50 rounded"
                                                title="Cancel"
                                              >
                                                <X size={10} />
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                onClick={() => startEditingBid(bidData.bid.id, bidData.bid.rate)}
                                                className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit Rate"
                                              >
                                                <Edit size={10} />
                                              </button>
                                              <button
                                                onClick={() => handleDeleteBid(bidData.bid.id, enquiry.id)}
                                                className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                                                title="Delete Bid"
                                              >
                                                <Trash2 size={10} />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                  {addingBidForEnquiry === enquiry.id && (
                                    <tr className="border-b border-gray-100 bg-blue-50">
                                      <td className="py-1 px-2">
                                        <select
                                          value={newBidForm.brokerId}
                                          onChange={(e) => setNewBidForm({ ...newBidForm, brokerId: e.target.value })}
                                          className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                        >
                                          <option value="">Select Broker</option>
                                          {brokers.map((broker) => (
                                            <option key={broker.id} value={broker.id}>
                                              {broker.personName}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="py-1 px-2 text-black text-xs">
                                        {newBidForm.brokerId && brokers.find(b => b.id.toString() === newBidForm.brokerId)?.companyName || '-'}
                                      </td>
                                      <td className="py-1 px-2 text-black text-xs">
                                        {newBidForm.brokerId && brokers.find(b => b.id.toString() === newBidForm.brokerId)?.city || '-'}
                                      </td>
                                      <td className="py-1 px-2">
                                        <input
                                          type="number"
                                          value={newBidForm.rate}
                                          onChange={(e) => setNewBidForm({ ...newBidForm, rate: e.target.value })}
                                          className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                                          placeholder="Rate"
                                        />
                                      </td>
                                      <td className="py-1 px-2 text-black text-xs">
                                        -
                                      </td>
                                      <td className="py-1 px-2 text-right">
                                        <div className="flex justify-end gap-1">
                                          <button
                                            onClick={() => handleAddBid(enquiry.id)}
                                            className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                            title="Save Bid"
                                          >
                                            <Save size={10} />
                                          </button>
                                          <button
                                            onClick={cancelAddingBid}
                                            className="p-0.5 text-gray-600 hover:bg-gray-50 rounded"
                                            title="Cancel"
                                          >
                                            <X size={10} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="px-2 py-2">
                              <div className="text-xs text-gray-500 mb-2">No bids found for this enquiry</div>
                              {addingBidForEnquiry !== enquiry.id && (
                                <button
                                  onClick={() => startAddingBid(enquiry.id)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  <Plus size={10} />
                                  Add Bid
                                </button>
                              )}
                              {addingBidForEnquiry === enquiry.id && (
                                <div className="border border-gray-200 rounded p-2 bg-blue-50">
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                    <div>
                                      <label className="text-xs text-gray-600 mb-1 block">Broker</label>
                                      <select
                                        value={newBidForm.brokerId}
                                        onChange={(e) => setNewBidForm({ ...newBidForm, brokerId: e.target.value })}
                                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                      >
                                        <option value="">Select Broker</option>
                                        {brokers.map((broker) => (
                                          <option key={broker.id} value={broker.id}>
                                            {broker.personName} - {broker.companyName}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-600 mb-1 block">Rate</label>
                                      <input
                                        type="number"
                                        value={newBidForm.rate}
                                        onChange={(e) => setNewBidForm({ ...newBidForm, rate: e.target.value })}
                                        className="w-full px-1 py-0.5 border border-gray-300 rounded text-xs"
                                        placeholder="Enter rate"
                                      />
                                    </div>
                                    <div className="flex items-end gap-1">
                                      <button
                                        onClick={() => handleAddBid(enquiry.id)}
                                        className="px-2 py-0.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={cancelAddingBid}
                                        className="px-2 py-0.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {bidsByEnquiry[enquiry.id]?.length > 0 && addingBidForEnquiry !== enquiry.id && (
                            <div className="px-2 py-2 border-t border-gray-200">
                              <button
                                onClick={() => startAddingBid(enquiry.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                <Plus size={10} />
                                Add Bid
                              </button>
                            </div>
                          )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 0 && (
          <div className="px-3 py-2 border-t border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="text-black">
                {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-gray-600">per page</span>
              </div>
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={!pagination.hasPrev}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>
              
              {/* Page Numbers */}
              <div className="flex gap-1">
                {(() => {
                  const pages = [];
                  const currentPage = pagination.page;
                  const totalPages = pagination.pages;
                  
                  // Show first page
                  if (totalPages > 0) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setPagination({ ...pagination, page: 1 })}
                        className={`px-2 py-1 border rounded text-xs ${
                          currentPage === 1
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        1
                      </button>
                    );
                  }
                  
                  // Show dots if there's a gap
                  if (currentPage > 3) {
                    pages.push(
                      <span key="dots1" className="px-1 text-gray-500">...</span>
                    );
                  }
                  
                  // Show pages around current page
                  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                    if (i === 1 || i === totalPages) continue; // Skip first and last as they're handled separately
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPagination({ ...pagination, page: i })}
                        className={`px-2 py-1 border rounded text-xs ${
                          currentPage === i
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  // Show dots if there's a gap
                  if (currentPage < totalPages - 2) {
                    pages.push(
                      <span key="dots2" className="px-1 text-gray-500">...</span>
                    );
                  }
                  
                  // Show last page
                  if (totalPages > 1) {
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setPagination({ ...pagination, page: totalPages })}
                        className={`px-2 py-1 border rounded text-xs ${
                          currentPage === totalPages
                            ? 'bg-black text-white border-black'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
              </div>

              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={!pagination.hasNext}
                className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg max-w-md ${
          toast.type === 'success' ? 'bg-green-500 text-white' :
          toast.type === 'warning' ? 'bg-yellow-500 text-black' :
          'bg-red-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-3 text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}