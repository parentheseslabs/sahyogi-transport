'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Filter, ChevronDown, ChevronUp, DollarSign, Truck, Eye, Package, Calendar, MapPin, Weight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import EnhancedPagination from '../../../components/EnhancedPagination';

interface Enquiry {
  id: number;
  leadId: number;
  leadName?: string;
  from: string;
  to: string;
  cargoType: string;
  cargoWeight?: number;
  source: string;
  remarks?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  customerOrderId?: number;
}

interface Quote {
  id: number;
  enquiryId: number;
  costing?: string;
  quotationAmount: number;
  marginPercentage?: number;
  baseAmount?: number;
  isCustomAmount?: boolean;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface Order {
  id: number;
  enquiryId: number;
  brokerName: string;
  route: string;
  amount: number;
  createdAt: string;
}

interface BrokerEnquiry {
  id: number;
  routeId: number;
  cargoType: string;
  cargoWeight?: number;
  transportDate?: string;
  remarks?: string;
  status: string;
  routeName?: string;
  createdAt: string;
}

interface BrokerBid {
  id: number;
  enquiryId: number;
  brokerId: number;
  rate: number;
  brokerName?: string;
  createdAt: string;
}

interface Lead {
  id: number;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  search: string;
  source: string;
  status: string;
  fromDate: string;
  toDate: string;
  customerName: string;
  fromLocation: string;
  toLocation: string;
  cargoType: string;
  minWeight: string;
  maxWeight: string;
  hasQuotes: string;
  hasCustomerOrder: string;
}

export default function EnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<{[key: number]: Quote[]}>({});
  const [orders, setOrders] = useState<{[key: number]: Order[]}>({});
  const [expandedEnquiries, setExpandedEnquiries] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    source: '',
    status: '',
    fromDate: '',
    toDate: '',
    customerName: '',
    fromLocation: '',
    toLocation: '',
    cargoType: '',
    minWeight: '',
    maxWeight: '',
    hasQuotes: '',
    hasCustomerOrder: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEnquiry, setCurrentEnquiry] = useState<Enquiry | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    leadId: '',
    from: '',
    to: '',
    cargoType: '',
    cargoWeight: '',
    remarks: '',
    source: 'unknown',
    referrer: '',
  });
  const [quoteFormData, setQuoteFormData] = useState({
    costing: '',
    marginPercentage: '15',
    customAmount: '',
    status: 'pending' as const,
  });
  const [baseAmount, setBaseAmount] = useState(0);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    brokerName: '',
    route: '',
    amount: '',
  });

  useEffect(() => {
    fetchEnquiries();
    fetchLeads();
  }, [pagination.page, filters, pageSize, sortBy, sortOrder]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchQuotesForEnquiry = async (enquiryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/quotes?enquiryId=${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setQuotes(prev => ({ ...prev, [enquiryId]: data.quotes }));
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const fetchOrdersForEnquiry = async (enquiryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-orders?enquiryId=${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(prev => ({ ...prev, [enquiryId]: data.orders.map((item: any) => item.order) }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const toggleEnquiryExpanded = (enquiryId: number) => {
    const newExpanded = new Set(expandedEnquiries);
    if (newExpanded.has(enquiryId)) {
      newExpanded.delete(enquiryId);
    } else {
      newExpanded.add(enquiryId);
      if (!quotes[enquiryId]) {
        fetchQuotesForEnquiry(enquiryId);
      }
      if (!orders[enquiryId]) {
        fetchOrdersForEnquiry(enquiryId);
      }
    }
    setExpandedEnquiries(newExpanded);
  };

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.source && { source: filters.source }),
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`http://localhost:3001/api/enquiries?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch enquiries');

      const data = await response.json();
      
      // Apply client-side filters
      let filteredEnquiries = data.enquiries;
      
      // Handle main search (ID, customer, route, cargo)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => {
          // Search in enquiry ID
          const idMatch = enquiry.id.toString().includes(searchTerm);
          
          // Search in customer/lead name
          const customerMatch = enquiry.leadName?.toLowerCase().includes(searchTerm);
          
          // Search in route (from and to)
          const routeMatch = 
            enquiry.from.toLowerCase().includes(searchTerm) ||
            enquiry.to.toLowerCase().includes(searchTerm);
          
          // Search in cargo type
          const cargoMatch = enquiry.cargoType.toLowerCase().includes(searchTerm);
          
          return idMatch || customerMatch || routeMatch || cargoMatch;
        });
      }
      
      // Filter by customer name
      if (filters.customerName) {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => 
          enquiry.leadName?.toLowerCase().includes(filters.customerName.toLowerCase())
        );
      }
      
      // Filter by from location
      if (filters.fromLocation) {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => 
          enquiry.from.toLowerCase().includes(filters.fromLocation.toLowerCase())
        );
      }
      
      // Filter by to location
      if (filters.toLocation) {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => 
          enquiry.to.toLowerCase().includes(filters.toLocation.toLowerCase())
        );
      }
      
      // Filter by cargo type
      if (filters.cargoType) {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => 
          enquiry.cargoType.toLowerCase().includes(filters.cargoType.toLowerCase())
        );
      }
      
      // Filter by weight range
      if (filters.minWeight) {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => 
          enquiry.cargoWeight !== undefined && enquiry.cargoWeight >= parseFloat(filters.minWeight)
        );
      }
      if (filters.maxWeight) {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => 
          enquiry.cargoWeight !== undefined && enquiry.cargoWeight <= parseFloat(filters.maxWeight)
        );
      }
      
      // Filter by has customer order
      if (filters.hasCustomerOrder === 'yes') {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => enquiry.customerOrderId);
      } else if (filters.hasCustomerOrder === 'no') {
        filteredEnquiries = filteredEnquiries.filter((enquiry: Enquiry) => !enquiry.customerOrderId);
      }
      
      setEnquiries(filteredEnquiries);
      setPagination({
        ...data.pagination,
        total: filteredEnquiries.length,
        pages: Math.ceil(filteredEnquiries.length / 10),
      });
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleAdd = () => {
    setIsEdit(false);
    setCurrentEnquiry(null);
    setFormData({
      leadId: '',
      from: '',
      to: '',
      cargoType: '',
      cargoWeight: '',
      remarks: '',
      source: 'unknown',
      referrer: '',
    });
    setShowModal(true);
  };

  const handleEdit = (enquiry: Enquiry) => {
    setIsEdit(true);
    setCurrentEnquiry(enquiry);
    setFormData({
      leadId: enquiry.leadId.toString(),
      from: enquiry.from,
      to: enquiry.to,
      cargoType: enquiry.cargoType,
      cargoWeight: enquiry.cargoWeight?.toString() || '',
      remarks: enquiry.remarks || '',
      source: enquiry.source,
      referrer: '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/enquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete enquiry');
      fetchEnquiries();
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      alert('Failed to delete enquiry');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const url = isEdit
        ? `http://localhost:3001/api/enquiries/${currentEnquiry?.id}`
        : 'http://localhost:3001/api/enquiries';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Failed to ${isEdit ? 'update' : 'create'} enquiry`);

      setShowModal(false);
      fetchEnquiries();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} enquiry:`, error);
      alert(`Failed to ${isEdit ? 'update' : 'create'} enquiry`);
    }
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPagination({ ...pagination, page: 1, limit: newPageSize });
  };

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage });
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

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown size={12} className="opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />;
  };

  const fetchBaseAmountForQuote = async (enquiryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/quotes/base-amount/${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBaseAmount(data.baseAmount);
      }
    } catch (error) {
      console.error('Error fetching base amount:', error);
    }
  };

  const handleAddQuote = (enquiryId: number) => {
    setSelectedEnquiryId(enquiryId);
    fetchBaseAmountForQuote(enquiryId);
    setIsCustomAmount(false);
    setIsEditMode(false);
    setEditingQuote(null);
    setQuoteFormData({
      costing: '',
      marginPercentage: '15',
      customAmount: '',
      status: 'pending',
    });
    setShowQuoteModal(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setSelectedEnquiryId(quote.enquiryId);
    fetchBaseAmountForQuote(quote.enquiryId);
    setIsCustomAmount(!!quote.isCustomAmount);
    setIsEditMode(true);
    setEditingQuote(quote);
    setQuoteFormData({
      costing: quote.costing || '',
      marginPercentage: quote.marginPercentage?.toString() || '15',
      customAmount: quote.isCustomAmount ? quote.quotationAmount.toString() : '',
      status: quote.status,
    });
    setShowQuoteModal(true);
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCustomAmount && !isEditMode && baseAmount === 0) {
      alert('Cannot create quote: No transport orders found for this enquiry. Please add transport orders first.');
      return;
    }

    if (isCustomAmount && !quoteFormData.customAmount) {
      alert('Please enter a custom amount.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const requestData: any = {
        costing: quoteFormData.costing,
        status: quoteFormData.status,
        isCustomAmount: isCustomAmount,
      };

      if (!isEditMode) {
        requestData.enquiryId = selectedEnquiryId;
      }

      if (isCustomAmount) {
        requestData.customAmount = parseFloat(quoteFormData.customAmount);
      } else {
        requestData.marginPercentage = parseFloat(quoteFormData.marginPercentage);
      }

      const url = isEditMode 
        ? `http://localhost:3001/api/quotes/${editingQuote?.id}`
        : 'http://localhost:3001/api/quotes';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? 'update' : 'create'} quote`);
      }

      setShowQuoteModal(false);
      setIsCustomAmount(false);
      setIsEditMode(false);
      setEditingQuote(null);
      if (selectedEnquiryId) {
        fetchQuotesForEnquiry(selectedEnquiryId);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} quote:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} quote`);
    }
  };

  const handleAddOrder = (enquiryId: number) => {
    setSelectedEnquiryId(enquiryId);
    setOrderFormData({
      brokerName: '',
      route: '',
      amount: '',
    });
    setShowOrderModal(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/transport-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId: selectedEnquiryId,
          brokerName: orderFormData.brokerName,
          route: orderFormData.route,
          amount: parseFloat(orderFormData.amount),
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      setShowOrderModal(false);
      if (selectedEnquiryId) {
        fetchOrdersForEnquiry(selectedEnquiryId);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Customer Enquiries</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
        >
          <Plus size={14} />
          Add Customer Enquiry
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-black" size={14} />
            <input
              type="text"
              placeholder="Search by ID, customer, route, or cargo..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-black rounded text-xs font-medium hover:bg-gray-200"
          >
            <Filter size={14} />
            {showFilters ? 'Hide' : 'Show'} Filters
            {Object.values(filters).filter(v => v).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-black text-white rounded-full text-xs">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
          {Object.values(filters).filter(v => v).length > 0 && (
            <button
              onClick={() => {
                setFilters({
                  search: '',
                  source: '',
                  status: '',
                  fromDate: '',
                  toDate: '',
                  customerName: '',
                  fromLocation: '',
                  toLocation: '',
                  cargoType: '',
                  minWeight: '',
                  maxWeight: '',
                  hasQuotes: '',
                  hasCustomerOrder: ''
                });
                setPagination({ ...pagination, page: 1 });
              }}
              className="px-3 py-1.5 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({ ...filters, status: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={filters.source}
                  onChange={(e) => {
                    setFilters({ ...filters, source: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="">All Sources</option>
                  <option value="unknown">Unknown</option>
                  <option value="referral">Referral</option>
                  <option value="india_mart">IndiaMart</option>
                  <option value="just_dial">JustDial</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => {
                    setFilters({ ...filters, fromDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => {
                    setFilters({ ...filters, toDate: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Customer Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => {
                    setFilters({ ...filters, customerName: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Search customer..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Route From/To */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Location</label>
                <input
                  type="text"
                  value={filters.fromLocation}
                  onChange={(e) => {
                    setFilters({ ...filters, fromLocation: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="From location..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Location</label>
                <input
                  type="text"
                  value={filters.toLocation}
                  onChange={(e) => {
                    setFilters({ ...filters, toLocation: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="To location..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Cargo Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cargo Type</label>
                <input
                  type="text"
                  value={filters.cargoType}
                  onChange={(e) => {
                    setFilters({ ...filters, cargoType: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Cargo type..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Weight Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Weight (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.minWeight}
                  onChange={(e) => {
                    setFilters({ ...filters, minWeight: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Min weight..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Weight (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={filters.maxWeight}
                  onChange={(e) => {
                    setFilters({ ...filters, maxWeight: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Max weight..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Has Customer Order */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Has Customer Order</label>
                <select
                  value={filters.hasCustomerOrder}
                  onChange={(e) => {
                    setFilters({ ...filters, hasCustomerOrder: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="">All</option>
                  <option value="yes">With Order</option>
                  <option value="no">Without Order</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Expand</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">From</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">To</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Cargo</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Weight (MT)</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Source</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-black text-xs">Loading...</td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-black text-xs">No enquiries found</td>
                </tr>
              ) : (
                enquiries.map((enquiry) => (
                  <React.Fragment key={enquiry.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <button
                          onClick={() => toggleEnquiryExpanded(enquiry.id)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                        >
                          {expandedEnquiries.has(enquiry.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">CE{enquiry.id}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                        {enquiry.leadName || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black">{enquiry.from}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black">{enquiry.to}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black">{enquiry.cargoType}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                        {enquiry.cargoWeight || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded text-xs capitalize">
                          {enquiry.source.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium capitalize ${
                          enquiry.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          enquiry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {enquiry.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                        {new Date(enquiry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          {enquiry.customerOrderId && (
                            <button
                              onClick={() => router.push(`/customer-orders/${enquiry.customerOrderId}`)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="View Customer Order"
                            >
                              <Package size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => router.push(`/enquiries/${enquiry.id}`)}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                            title="View Details"
                          >
                            <Eye size={12} />
                          </button>
                          <button
                            onClick={() => handleAddQuote(enquiry.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Add Quote"
                          >
                            <DollarSign size={12} />
                          </button>
                          <button
                            onClick={() => handleAddOrder(enquiry.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Add Order"
                          >
                            <Truck size={12} />
                          </button>
                          <button
                            onClick={() => handleEdit(enquiry)}
                            className="p-1 text-black hover:bg-gray-100 rounded"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(enquiry.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedEnquiries.has(enquiry.id) && (
                      <tr key={`${enquiry.id}-quotes`}>
                        <td colSpan={11} className="px-3 py-3 bg-gray-50">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium text-xs text-black">Quotes</h4>
                              <button
                                onClick={() => handleAddQuote(enquiry.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                              >
                                <Plus size={10} />
                                Add Quote
                              </button>
                            </div>
                            {quotes[enquiry.id] && quotes[enquiry.id].length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs bg-white rounded border border-gray-300">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">ID</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Type</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Margin</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Final</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Status</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Created</th>
                                      <th className="px-2 py-1 text-right text-xs font-medium text-black">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {quotes[enquiry.id].map((quote) => (
                                      <tr key={quote.id} className="hover:bg-gray-50">
                                        <td className="px-2 py-1 text-xs text-black">#{quote.id}</td>
                                        <td className="px-2 py-1">
                                          <span className={`px-1 py-0.5 rounded text-xs ${
                                            quote.isCustomAmount ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                          }`}>
                                            {quote.isCustomAmount ? 'Custom' : 'Calc'}
                                          </span>
                                        </td>
                                        <td className="px-2 py-1 text-xs text-black">
                                          {quote.isCustomAmount ? '-' : (quote.marginPercentage ? `${quote.marginPercentage}%` : '-')}
                                        </td>
                                        <td className="px-2 py-1 text-xs font-medium text-black">
                                          ₹{quote.quotationAmount.toLocaleString()}
                                        </td>
                                        <td className="px-2 py-1">
                                          <span className={`px-1 py-0.5 rounded text-xs capitalize ${
                                            quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                          }`}>
                                            {quote.status}
                                          </span>
                                        </td>
                                        <td className="px-2 py-1 text-xs text-black">
                                          {new Date(quote.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-2 py-1 text-right">
                                          <button
                                            onClick={() => handleEditQuote(quote)}
                                            className="p-1 text-black hover:bg-gray-100 rounded"
                                            title="Edit Quote"
                                          >
                                            <Edit size={10} />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 text-center py-2">
                                No quotes yet. Click "Add Quote" to create one.
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-3">
                              <h4 className="font-medium text-xs text-black">Orders</h4>
                              <button
                                onClick={() => handleAddOrder(enquiry.id)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                              >
                                <Plus size={10} />
                                Add Order
                              </button>
                            </div>
                            {orders[enquiry.id] && orders[enquiry.id].length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs bg-white rounded border border-gray-300">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">ID</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Broker</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Route</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Amount</th>
                                      <th className="px-2 py-1 text-left text-xs font-medium text-black">Created</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {orders[enquiry.id].map((order) => (
                                      <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-2 py-1 text-xs text-black">#{order.id}</td>
                                        <td className="px-2 py-1 text-xs font-medium text-black">{order.brokerName}</td>
                                        <td className="px-2 py-1 text-xs text-black">{order.route}</td>
                                        <td className="px-2 py-1 text-xs font-medium text-black">₹{order.amount}</td>
                                        <td className="px-2 py-1 text-xs text-black">
                                          {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 text-center py-2">
                                No orders yet. Click "Add Order" to create one.
                              </div>
                            )}
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

        <EnhancedPagination
          pagination={pagination}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">{isEdit ? 'Edit Enquiry' : 'New Enquiry'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Customer*</label>
                <select
                  value={formData.leadId}
                  onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Customer</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-black mb-1">From*</label>
                  <input
                    type="text"
                    value={formData.from}
                    onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-black mb-1">To*</label>
                  <input
                    type="text"
                    value={formData.to}
                    onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Cargo Type*</label>
                <input
                  type="text"
                  value={formData.cargoType}
                  onChange={(e) => setFormData({ ...formData, cargoType: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Cargo Weight (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cargoWeight}
                  onChange={(e) => setFormData({ ...formData, cargoWeight: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="unknown">Unknown</option>
                  <option value="referral">Referral</option>
                  <option value="india_mart">IndiaMart</option>
                  <option value="just_dial">JustDial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-black text-white rounded text-xs hover:bg-gray-800"
                >
                  {isEdit ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">{isEditMode ? 'Edit Quote' : 'Create Quote'}</h2>
              <button onClick={() => setShowQuoteModal(false)} className="text-black hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-3">
              <div className="bg-gray-50 p-2 rounded">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium">Base Amount:</span>
                    <div className="text-sm font-bold">₹{baseAmount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="font-medium">Final Quote:</span>
                    <div className="text-sm font-bold text-green-600">
                      ₹{isCustomAmount 
                        ? (parseFloat(quoteFormData.customAmount) || 0).toLocaleString()
                        : (baseAmount + (baseAmount * (parseFloat(quoteFormData.marginPercentage) || 0) / 100)).toLocaleString()
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Pricing Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pricingType"
                      checked={!isCustomAmount}
                      onChange={() => setIsCustomAmount(false)}
                      className="mr-1"
                    />
                    <span className="text-xs">Calculate</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="pricingType"
                      checked={isCustomAmount}
                      onChange={() => setIsCustomAmount(true)}
                      className="mr-1"
                    />
                    <span className="text-xs">Custom</span>
                  </label>
                </div>
              </div>

              {!isCustomAmount ? (
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Margin Percentage (%)*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={quoteFormData.marginPercentage}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, marginPercentage: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                    placeholder="Enter margin percentage"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Custom Amount (₹)*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteFormData.customAmount}
                    onChange={(e) => setQuoteFormData({ ...quoteFormData, customAmount: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                    placeholder="Enter custom quote amount"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-black mb-1">Costing Details</label>
                <textarea
                  value={quoteFormData.costing}
                  onChange={(e) => setQuoteFormData({ ...quoteFormData, costing: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  placeholder="Enter costing breakdown details"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Status</label>
                <select
                  value={quoteFormData.status}
                  onChange={(e) => setQuoteFormData({ ...quoteFormData, status: e.target.value as 'pending' | 'accepted' | 'rejected' })}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                >
                  {isEditMode ? 'Update Quote' : 'Create Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">Create Order</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-black hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Broker Name*</label>
                <input
                  type="text"
                  value={orderFormData.brokerName}
                  onChange={(e) => setOrderFormData({ ...orderFormData, brokerName: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  placeholder="Enter broker name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Route*</label>
                <input
                  type="text"
                  value={orderFormData.route}
                  onChange={(e) => setOrderFormData({ ...orderFormData, route: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  placeholder="e.g. Delhi to Mumbai"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Amount (₹)*</label>
                <input
                  type="number"
                  step="0.01"
                  value={orderFormData.amount}
                  onChange={(e) => setOrderFormData({ ...orderFormData, amount: e.target.value })}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  placeholder="Enter amount charged by broker"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
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
