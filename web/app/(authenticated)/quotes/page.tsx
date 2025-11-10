'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Calendar, DollarSign, Percent, Map, User, Package } from 'lucide-react';
import EnhancedPagination from '../../../components/EnhancedPagination';
import { useRouter } from 'next/navigation';

interface Quote {
  id: number;
  enquiryId: number;
  orderId?: number;
  enquiryFrom?: string;
  enquiryTo?: string;
  leadName?: string;
  costing?: string;
  quotationAmount: number;
  marginPercentage?: number;
  baseAmount?: number;
  isCustomAmount?: boolean;
  status: string;
  createdAt: string;
}

interface Enquiry {
  id: number;
  from: string;
  to: string;
  leadName?: string;
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
  status: string;
  fromDate: string;
  toDate: string;
  customerName: string;
  routeFrom: string;
  routeTo: string;
  pricingType: string;
  minAmount: string;
  maxAmount: string;
  minMargin: string;
  maxMargin: string;
  search: string;
}

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: '',
    fromDate: '',
    toDate: '',
    customerName: '',
    routeFrom: '',
    routeTo: '',
    pricingType: '',
    minAmount: '',
    maxAmount: '',
    minMargin: '',
    maxMargin: '',
    search: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [baseAmount, setBaseAmount] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [formData, setFormData] = useState({
    enquiryId: '',
    costing: '',
    marginPercentage: '15',
    customAmount: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchQuotes();
    fetchEnquiries();
  }, [pagination.page, pageSize, filters]);

  useEffect(() => {
    if (!isCustomAmount && formData.marginPercentage && baseAmount > 0) {
      const margin = parseFloat(formData.marginPercentage);
      const calculated = baseAmount + (baseAmount * margin / 100);
      setCalculatedAmount(calculated);
    } else if (isCustomAmount && formData.customAmount) {
      setCalculatedAmount(parseFloat(formData.customAmount));
    } else {
      setCalculatedAmount(0);
    }
  }, [formData.marginPercentage, formData.customAmount, baseAmount, isCustomAmount]);

  const fetchEnquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/enquiries?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEnquiries(data.enquiries);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    }
  };

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pageSize.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
      });

      const response = await fetch(`http://localhost:3001/api/quotes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch quotes');

      const data = await response.json();
      
      // Apply client-side filters for fields not supported by backend
      let filteredQuotes = data.quotes;
      
      // Filter by search term (Quote ID or Enquiry ID)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        filteredQuotes = filteredQuotes.filter((quote: Quote) => {
          // Check if search term matches Quote ID (with or without Q prefix)
          const quoteIdMatch = 
            quote.id.toString().toLowerCase().includes(searchTerm) ||
            `q${quote.id}`.toLowerCase().includes(searchTerm);
          
          // Check if search term matches Enquiry ID (with or without E prefix)
          const enquiryIdMatch = 
            quote.enquiryId.toString().toLowerCase().includes(searchTerm) ||
            `e${quote.enquiryId}`.toLowerCase().includes(searchTerm);
          
          return quoteIdMatch || enquiryIdMatch;
        });
      }
      
      // Filter by customer name
      if (filters.customerName) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.leadName?.toLowerCase().includes(filters.customerName.toLowerCase())
        );
      }
      
      // Filter by route from/to
      if (filters.routeFrom) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.enquiryFrom?.toLowerCase().includes(filters.routeFrom.toLowerCase())
        );
      }
      if (filters.routeTo) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.enquiryTo?.toLowerCase().includes(filters.routeTo.toLowerCase())
        );
      }
      
      // Filter by pricing type
      if (filters.pricingType) {
        if (filters.pricingType === 'custom') {
          filteredQuotes = filteredQuotes.filter((quote: Quote) => quote.isCustomAmount);
        } else if (filters.pricingType === 'calculated') {
          filteredQuotes = filteredQuotes.filter((quote: Quote) => !quote.isCustomAmount);
        }
      }
      
      // Filter by amount range
      if (filters.minAmount) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.quotationAmount >= parseFloat(filters.minAmount)
        );
      }
      if (filters.maxAmount) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.quotationAmount <= parseFloat(filters.maxAmount)
        );
      }
      
      // Filter by margin range
      if (filters.minMargin) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.marginPercentage !== undefined && quote.marginPercentage >= parseFloat(filters.minMargin)
        );
      }
      if (filters.maxMargin) {
        filteredQuotes = filteredQuotes.filter((quote: Quote) => 
          quote.marginPercentage !== undefined && quote.marginPercentage <= parseFloat(filters.maxMargin)
        );
      }
      
      setQuotes(filteredQuotes);
      setPagination({
        ...data.pagination,
        total: filteredQuotes.length,
        pages: Math.ceil(filteredQuotes.length / pageSize),
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseAmount = async (enquiryId: string) => {
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

  const handleAdd = () => {
    setIsEdit(false);
    setCurrentQuote(null);
    setIsCustomAmount(false);
    setBaseAmount(0);
    setFormData({
      enquiryId: '',
      costing: '',
      marginPercentage: '15',
      customAmount: '',
      status: 'pending',
    });
    setShowModal(true);
  };

  const handleEdit = (quote: Quote) => {
    setIsEdit(true);
    setCurrentQuote(quote);
    setIsCustomAmount(!!quote.isCustomAmount);
    if (quote.enquiryId) {
      fetchBaseAmount(quote.enquiryId.toString());
    }
    setFormData({
      enquiryId: quote.enquiryId.toString(),
      costing: quote.costing || '',
      marginPercentage: quote.marginPercentage?.toString() || '15',
      customAmount: quote.isCustomAmount ? quote.quotationAmount.toString() : '',
      status: quote.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/quotes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete quote');
      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCustomAmount && baseAmount === 0) {
      alert(`Cannot ${isEdit ? 'update' : 'create'} quote: No transport orders found for this enquiry. Please add transport orders first.`);
      return;
    }
    
    if (isCustomAmount && !formData.customAmount) {
      alert('Please enter a custom amount.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const requestData: any = {
        enquiryId: parseInt(formData.enquiryId),
        costing: formData.costing,
        status: formData.status,
        isCustomAmount: isCustomAmount,
      };

      if (isCustomAmount) {
        requestData.customAmount = parseFloat(formData.customAmount);
      } else {
        requestData.marginPercentage = parseFloat(formData.marginPercentage);
      }

      const url = isEdit
        ? `http://localhost:3001/api/quotes/${currentQuote?.id}`
        : 'http://localhost:3001/api/quotes';

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEdit ? 'update' : 'create'} quote`);
      }

      setShowModal(false);
      fetchQuotes();
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} quote:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} quote`);
    }
  };

  const handleEnquiryChange = (enquiryId: string) => {
    setFormData({ ...formData, enquiryId });
    if (enquiryId) {
      fetchBaseAmount(enquiryId);
    } else {
      setBaseAmount(0);
    }
  };

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPagination({ ...pagination, page: 1, limit: newPageSize });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">Quotes</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white rounded text-xs font-medium hover:bg-gray-800"
        >
          <Plus size={14} />
          Add Quote
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-black rounded text-xs font-medium hover:bg-gray-200"
          >
            <Search size={14} />
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
                  status: '',
                  fromDate: '',
                  toDate: '',
                  customerName: '',
                  routeFrom: '',
                  routeTo: '',
                  pricingType: '',
                  minAmount: '',
                  maxAmount: '',
                  minMargin: '',
                  maxMargin: '',
                  search: ''
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
              {/* Search Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Quote ID (Q123) or Enquiry ID (E123)"
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

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
                  value={filters.routeFrom}
                  onChange={(e) => {
                    setFilters({ ...filters, routeFrom: e.target.value });
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
                  value={filters.routeTo}
                  onChange={(e) => {
                    setFilters({ ...filters, routeTo: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="To location..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Pricing Type */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Pricing Type</label>
                <select
                  value={filters.pricingType}
                  onChange={(e) => {
                    setFilters({ ...filters, pricingType: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="">All Types</option>
                  <option value="custom">Custom</option>
                  <option value="calculated">Calculated</option>
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => {
                    setFilters({ ...filters, minAmount: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Min amount..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount (₹)</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => {
                    setFilters({ ...filters, maxAmount: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Max amount..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>

              {/* Margin Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Min Margin (%)</label>
                <input
                  type="number"
                  value={filters.minMargin}
                  onChange={(e) => {
                    setFilters({ ...filters, minMargin: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Min margin..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Margin (%)</label>
                <input
                  type="number"
                  value={filters.maxMargin}
                  onChange={(e) => {
                    setFilters({ ...filters, maxMargin: e.target.value });
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Max margin..."
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                />
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
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Quote ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Enquiry ID</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Customer</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Type</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Margin</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Amount (₹)</th>
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
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-black text-xs">No quotes found</td>
                </tr>
              ) : (
                quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      Q{quote.id}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      <button
                        onClick={() => router.push(`/enquiries/${quote.enquiryId}`)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        E{quote.enquiryId}
                      </button>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      {quote.leadName || '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {quote.enquiryFrom && quote.enquiryTo
                        ? `${quote.enquiryFrom} → ${quote.enquiryTo}`
                        : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        quote.isCustomAmount ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {quote.isCustomAmount ? 'Custom' : 'Calculated'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {quote.isCustomAmount ? '-' : (quote.marginPercentage ? `${quote.marginPercentage}%` : '-')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black font-medium">
                      ₹{quote.quotationAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${getStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(quote)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
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
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">{isEdit ? 'Edit Quote' : 'New Quote'}</h2>
              <button onClick={() => setShowModal(false)} className="text-black hover:text-black">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-black mb-1">Enquiry*</label>
                <select
                  value={formData.enquiryId}
                  onChange={(e) => handleEnquiryChange(e.target.value)}
                  required
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                >
                  <option value="">Select Enquiry</option>
                  {enquiries.map((enquiry) => (
                    <option key={enquiry.id} value={enquiry.id}>
                      {enquiry.leadName} - {enquiry.from} → {enquiry.to}
                    </option>
                  ))}
                </select>
              </div>

              {formData.enquiryId && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium">Base Amount:</span>
                      <div className="text-sm font-bold">₹{baseAmount.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Final Quote:</span>
                      <div className="text-sm font-bold text-green-600">₹{calculatedAmount.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {formData.enquiryId && (
                <div>
                  <label className="block text-xs font-medium text-black mb-2">Pricing Type</label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricingType"
                        checked={!isCustomAmount}
                        onChange={() => setIsCustomAmount(false)}
                        className="mr-2"
                      />
                      <span className="text-xs">Calculate from orders</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricingType"
                        checked={isCustomAmount}
                        onChange={() => setIsCustomAmount(true)}
                        className="mr-2"
                      />
                      <span className="text-xs">Custom amount</span>
                    </label>
                  </div>
                </div>
              )}

              {formData.enquiryId && !isCustomAmount ? (
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Margin Percentage (%)*</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.marginPercentage}
                    onChange={(e) => setFormData({ ...formData, marginPercentage: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                    placeholder="Enter margin percentage"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Margin: ₹{(baseAmount * (parseFloat(formData.marginPercentage) || 0) / 100).toLocaleString()}
                  </p>
                </div>
              ) : formData.enquiryId && isCustomAmount ? (
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Custom Amount (₹)*</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.customAmount}
                    onChange={(e) => setFormData({ ...formData, customAmount: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                    placeholder="Enter custom quote amount"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-medium text-black mb-1">Costing Details</label>
                <textarea
                  value={formData.costing}
                  onChange={(e) => setFormData({ ...formData, costing: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  placeholder="Enter costing breakdown details"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-black mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
    </div>
  );
}
