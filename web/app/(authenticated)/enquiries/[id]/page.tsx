'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Plus, DollarSign, Truck, MapPin, Package, Weight, Calendar, Tag, User, X, Eye, Search, Link, ChevronDown, ChevronRight, ShoppingCart } from 'lucide-react';
import TransportEnquiryForm from '@/components/forms/TransportEnquiryForm';
import EnhancedPagination from '@/components/EnhancedPagination';

interface Enquiry {
  id: number;
  leadId: number;
  from: string;
  to: string;
  cargoType: string;
  cargoWeight?: number;
  source: string;
  remarks?: string;
  status: 'pending' | 'accepted' | 'rejected';
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
  updatedAt: string;
}

interface Order {
  id: number;
  enquiryId: number;
  brokerName: string;
  route: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

interface CustomerOrder {
  id: number;
  enquiryId: number;
  quoteId: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

interface TransportRoute {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Broker {
  id: number;
  companyName: string;
  personName: string;
  phone?: string;
  city?: string;
}

interface LinkedTransportEnquiry {
  linkId: number;
  notes?: string;
  createdAt: string;
  transportEnquiry: {
    id: number;
    routeId: number;
    cargoType: string;
    cargoWeight?: number;
    transportDate?: string;
    remarks?: string;
    status: string;
    routeName?: string;
    createdAt: string;
    updatedAt: string;
    bidCount?: number;
    l1Rate?: number | null;
    l2Rate?: number | null;
    l1Broker?: string | null;
    l2Broker?: string | null;
  };
}

interface AvailableTransportEnquiry {
  id: number;
  routeId: number;
  cargoType: string;
  cargoWeight?: number;
  transportDate?: string;
  remarks?: string;
  status: string;
  routeName?: string;
  createdAt: string;
  updatedAt: string;
  bidCount?: number;
  l1Rate?: number | null;
  l2Rate?: number | null;
  l1Broker?: string | null;
  l2Broker?: string | null;
}

export default function EnquiryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const enquiryId = params.id as string;

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerOrder, setCustomerOrder] = useState<CustomerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [baseAmount, setBaseAmount] = useState(0);
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [availableBrokers, setAvailableBrokers] = useState<Broker[]>([]);
  const [availableRoutes, setAvailableRoutes] = useState<TransportRoute[]>([]);
  const [quoteFormData, setQuoteFormData] = useState({
    costing: '',
    marginPercentage: '15',
    customAmount: '',
    status: 'pending' as const,
  });
  const [orderFormData, setOrderFormData] = useState({
    brokerId: '',
    routeId: '',
    amount: '',
    notes: '',
  });
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [promoteNotes, setPromoteNotes] = useState('');
  const [brokerEnquiries, setBrokerEnquiries] = useState<BrokerEnquiry[]>([]);
  const [brokerBids, setBrokerBids] = useState<{[key: number]: BrokerBid[]}>({});
  const [showBrokerEnquiries, setShowBrokerEnquiries] = useState(false);
  const [loadingBrokerData, setLoadingBrokerData] = useState(false);
  const [linkedTransportEnquiries, setLinkedTransportEnquiries] = useState<LinkedTransportEnquiry[]>([]);
  const [showTransportEnquiryModal, setShowTransportEnquiryModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableTransportEnquiries, setAvailableTransportEnquiries] = useState<AvailableTransportEnquiry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiries, setSelectedEnquiries] = useState<number[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [linkingEnquiries, setLinkingEnquiries] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [transportBids, setTransportBids] = useState<{[key: number]: any[]}>({});
  const [loadingBids, setLoadingBids] = useState<{[key: number]: boolean}>({});
  
  // Link modal pagination and filters
  const [linkModalPagination, setLinkModalPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [linkModalPageSize, setLinkModalPageSize] = useState(10);
  const [linkModalFilters, setLinkModalFilters] = useState({
    status: '',
    fromDate: '',
    toDate: '',
    cargoType: '',
  });

  useEffect(() => {
    fetchEnquiryDetails();
    fetchBrokersAndRoutes();
  }, [enquiryId]);

  useEffect(() => {
    if (showLinkModal) {
      setLinkModalPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
      fetchAvailableTransportEnquiries();
    }
  }, [showLinkModal, linkModalPageSize, linkModalFilters]);

  // Debounced search effect
  useEffect(() => {
    if (!showLinkModal) return;
    
    const timeoutId = setTimeout(() => {
      setLinkModalPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
      fetchAvailableTransportEnquiries();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, showLinkModal]);

  // Pagination effect
  useEffect(() => {
    if (showLinkModal && linkModalPagination.page > 1) {
      fetchAvailableTransportEnquiries();
    }
  }, [linkModalPagination.page]);

  useEffect(() => {
    if (!isCustomAmount && quoteFormData.marginPercentage && baseAmount > 0) {
      const margin = parseFloat(quoteFormData.marginPercentage);
      const calculated = baseAmount + (baseAmount * margin / 100);
      setCalculatedAmount(calculated);
    } else if (isCustomAmount && quoteFormData.customAmount) {
      setCalculatedAmount(parseFloat(quoteFormData.customAmount));
    } else {
      setCalculatedAmount(0);
    }
  }, [quoteFormData.marginPercentage, quoteFormData.customAmount, baseAmount, isCustomAmount]);

  const fetchBrokersAndRoutes = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch brokers and routes in parallel
      const [brokersResponse, routesResponse] = await Promise.all([
        fetch('http://localhost:3001/api/transport-orders/brokers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:3001/api/transport-orders/routes', {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      if (brokersResponse.ok) {
        const brokersData = await brokersResponse.json();
        setAvailableBrokers(brokersData.brokers);
      }

      if (routesResponse.ok) {
        const routesData = await routesResponse.json();
        setAvailableRoutes(routesData.routes);
      }
    } catch (error) {
      console.error('Error fetching brokers and routes:', error);
    }
  };

  const fetchEnquiryDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch enquiry details
      const enquiryResponse = await fetch(`http://localhost:3001/api/enquiries/${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!enquiryResponse.ok) {
        throw new Error('Failed to fetch enquiry');
      }
      
      const enquiryData = await enquiryResponse.json();
      setEnquiry(enquiryData);
      
      // Fetch lead details
      if (enquiryData.leadId) {
        const leadResponse = await fetch(`http://localhost:3001/api/leads/${enquiryData.leadId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (leadResponse.ok) {
          const leadData = await leadResponse.json();
          setLead(leadData);
        }
      }
      
      // Fetch quotes
      const quotesResponse = await fetch(`http://localhost:3001/api/quotes?enquiryId=${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        setQuotes(quotesData.quotes);
      }
      
      // Fetch orders
      const ordersResponse = await fetch(`http://localhost:3001/api/transport-orders?enquiryId=${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders.map((item: any) => ({
          ...item.order,
          brokerName: item.broker?.companyName || 'Unknown Broker',
          route: item.route?.name || 'Unknown Route'
        })));
      }
      
      // Fetch customer order if it exists
      const customerOrderResponse = await fetch(`http://localhost:3001/api/customer-orders?enquiryId=${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (customerOrderResponse.ok) {
        const customerOrderData = await customerOrderResponse.json();
        if (customerOrderData.orders && customerOrderData.orders.length > 0) {
          setCustomerOrder(customerOrderData.orders[0]);
        }
      }

      // Fetch linked transport enquiries
      fetchLinkedTransportEnquiries();
    } catch (error) {
      console.error('Error fetching enquiry details:', error);
      alert('Failed to fetch enquiry details');
    } finally {
      setLoading(false);
    }
  };

  const fetchBaseAmount = async () => {
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

  const fetchBaseAmountForQuote = async (targetEnquiryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/quotes/base-amount/${targetEnquiryId}`, {
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

  const fetchLinkedTransportEnquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/enquiry-transport-links/${enquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedTransportEnquiries(data);
      }
    } catch (error) {
      console.error('Error fetching linked transport enquiries:', error);
    }
  };

  const handleCreateTransportEnquiry = async (data: {
    route_id: string;
    cargoType: string;
    cargoWeight: string;
    transportDate: string;
    remarks?: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/enquiry-transport-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId: parseInt(enquiryId),
          routeId: parseInt(data.route_id),
          cargoType: data.cargoType,
          cargoWeight: parseFloat(data.cargoWeight),
          transportDate: data.transportDate,
          remarks: data.remarks,
          notes: ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transport enquiry');
      }

      alert('Transport enquiry created successfully!');
      setShowTransportEnquiryModal(false);
      fetchLinkedTransportEnquiries(); // Refresh the list
    } catch (error) {
      console.error('Error creating transport enquiry:', error);
      alert(error instanceof Error ? error.message : 'Failed to create transport enquiry');
    }
  };

  const fetchAvailableTransportEnquiries = async () => {
    setLoadingAvailable(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: linkModalPagination.page.toString(),
        limit: linkModalPageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(linkModalFilters.status && { status: linkModalFilters.status }),
        ...(linkModalFilters.fromDate && { fromDate: linkModalFilters.fromDate }),
        ...(linkModalFilters.toDate && { toDate: linkModalFilters.toDate }),
        ...(linkModalFilters.cargoType && { cargoType: linkModalFilters.cargoType }),
      });
      
      const response = await fetch(`http://localhost:3001/api/enquiry-transport-links/available/${enquiryId}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableTransportEnquiries(data.enquiries || data);
        if (data.pagination) {
          setLinkModalPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching available transport enquiries:', error);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleCloseLinkModal = () => {
    setShowLinkModal(false);
    setSelectedEnquiries([]);
    setSearchQuery('');
    setAvailableTransportEnquiries([]);
    setLinkModalPagination({ page: 1, limit: 10, total: 0, pages: 0, hasNext: false, hasPrev: false });
    setLinkModalFilters({ status: '', fromDate: '', toDate: '', cargoType: '' });
  };

  const handleLinkModalPageChange = (page: number) => {
    setLinkModalPagination(prev => ({ ...prev, page }));
  };

  const handleLinkModalPageSizeChange = (newPageSize: number) => {
    setLinkModalPageSize(newPageSize);
    setLinkModalPagination(prev => ({ ...prev, page: 1, limit: newPageSize }));
  };

  const toggleRowExpansion = async (transportEnquiryId: number) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (expandedRows.has(transportEnquiryId)) {
      newExpandedRows.delete(transportEnquiryId);
    } else {
      newExpandedRows.add(transportEnquiryId);
      // Fetch bids if not already loaded
      if (!transportBids[transportEnquiryId]) {
        await fetchTransportBids(transportEnquiryId);
      }
    }
    
    setExpandedRows(newExpandedRows);
  };

  const fetchTransportBids = async (transportEnquiryId: number) => {
    setLoadingBids(prev => ({ ...prev, [transportEnquiryId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids?enquiryId=${transportEnquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransportBids(prev => ({ ...prev, [transportEnquiryId]: data.bids || [] }));
      }
    } catch (error) {
      console.error('Error fetching transport bids:', error);
    } finally {
      setLoadingBids(prev => ({ ...prev, [transportEnquiryId]: false }));
    }
  };

  const handlePlaceOrder = async (bid: any, transportEnquiry: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/transport-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId: parseInt(enquiryId),
          transportEnquiryId: transportEnquiry.id,
          bidId: bid.id,
          brokerId: bid.brokerId,
          amount: bid.rate,
          notes: `Order placed from bid #${bid.id} for ${transportEnquiry.cargoType}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      alert('Order placed successfully!');
      // Refresh the data
      fetchEnquiryDetails();
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order');
    }
  };

  const handleCreateTransportOrder = (transportEnquiry: any) => {
    let suggestedBrokerId = '';
    let brokerMatchInfo = '';
    
    // Try to find matching broker by name
    if (transportEnquiry.l1Broker && availableBrokers.length > 0) {
      const matchingBroker = availableBrokers.find(broker => 
        broker.companyName.toLowerCase().includes(transportEnquiry.l1Broker.toLowerCase()) ||
        broker.personName.toLowerCase().includes(transportEnquiry.l1Broker.toLowerCase())
      );
      if (matchingBroker) {
        suggestedBrokerId = matchingBroker.id.toString();
        brokerMatchInfo = `Matched broker: ${matchingBroker.companyName}`;
      } else {
        brokerMatchInfo = `No matching broker found for: ${transportEnquiry.l1Broker}. Please select manually.`;
      }
    }

    let suggestedRouteId = '';
    let routeMatchInfo = '';
    
    // Try to find matching route
    if (transportEnquiry.routeId && availableRoutes.length > 0) {
      const matchingRoute = availableRoutes.find(route => route.id === transportEnquiry.routeId);
      if (matchingRoute) {
        suggestedRouteId = matchingRoute.id.toString();
        routeMatchInfo = `Matched route: ${matchingRoute.name}`;
      } else {
        routeMatchInfo = `Route ID ${transportEnquiry.routeId} not found. Please select manually.`;
      }
    } else if (transportEnquiry.routeName) {
      // Try to match by route name
      const matchingRoute = availableRoutes.find(route => 
        route.name.toLowerCase().includes(transportEnquiry.routeName.toLowerCase())
      );
      if (matchingRoute) {
        suggestedRouteId = matchingRoute.id.toString();
        routeMatchInfo = `Matched route: ${matchingRoute.name}`;
      } else {
        routeMatchInfo = `No matching route found for: ${transportEnquiry.routeName}. Please select manually.`;
      }
    }

    const suggestedAmount = transportEnquiry.l1Rate ? transportEnquiry.l1Rate.toString() : '';
    
    let notes = `Auto-created from Transport Enquiry #${transportEnquiry.id}`;
    if (brokerMatchInfo) notes += `\n${brokerMatchInfo}`;
    if (routeMatchInfo) notes += `\n${routeMatchInfo}`;
    
    setOrderFormData({
      brokerId: suggestedBrokerId,
      routeId: suggestedRouteId,
      amount: suggestedAmount,
      notes: notes,
    });
    
    // Show alert if no matches found
    if (!suggestedBrokerId && !suggestedRouteId) {
      alert('No matching broker or route found. Please select them manually in the form.');
    } else if (!suggestedBrokerId) {
      alert('No matching broker found. Please select broker manually.');
    } else if (!suggestedRouteId) {
      alert('No matching route found. Please select route manually.');
    }
    
    // Close browser enquiries if open and show order modal
    setShowBrokerEnquiries(false);
    setShowOrderModal(true);
  };

  const handleLinkEnquiries = async () => {
    if (selectedEnquiries.length === 0) {
      alert('Please select at least one transport enquiry to link');
      return;
    }

    setLinkingEnquiries(true);
    try {
      const token = localStorage.getItem('token');
      
      // Link each selected enquiry
      for (const transportEnquiryId of selectedEnquiries) {
        const response = await fetch('http://localhost:3001/api/enquiry-transport-links/link', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            enquiryId: parseInt(enquiryId),
            transportEnquiryId,
            notes: 'Linked via search modal'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to link transport enquiry');
        }
      }

      alert(`Successfully linked ${selectedEnquiries.length} transport enquir${selectedEnquiries.length === 1 ? 'y' : 'ies'}!`);
      handleCloseLinkModal();
      fetchLinkedTransportEnquiries(); // Refresh the linked list
    } catch (error) {
      console.error('Error linking transport enquiries:', error);
      alert(error instanceof Error ? error.message : 'Failed to link transport enquiries');
    } finally {
      setLinkingEnquiries(false);
    }
  };

  const handleShowQuoteModal = () => {
    fetchBaseAmount();
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

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/quotes/${quoteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete quote');
      }

      alert('Quote deleted successfully!');
      fetchEnquiryDetails(); // Refresh the quotes list
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete quote');
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCustomAmount && baseAmount === 0) {
      alert(`Cannot ${isEditMode ? 'update' : 'create'} quote: No transport orders found for this enquiry. Please add transport orders first.`);
      return;
    }
    
    if (isCustomAmount && !quoteFormData.customAmount) {
      alert('Please enter a custom amount.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const requestData: any = {
        enquiryId: parseInt(enquiryId),
        costing: quoteFormData.costing,
        status: quoteFormData.status,
        isCustomAmount: isCustomAmount,
      };

      if (isCustomAmount) {
        requestData.customAmount = parseFloat(quoteFormData.customAmount);
      } else {
        requestData.marginPercentage = parseFloat(quoteFormData.marginPercentage);
      }

      const url = isEditMode ? `http://localhost:3001/api/quotes/${editingQuote!.id}` : 'http://localhost:3001/api/quotes';
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
      setQuoteFormData({ costing: '', marginPercentage: '15', customAmount: '', status: 'pending' });
      setIsCustomAmount(false);
      setIsEditMode(false);
      setEditingQuote(null);
      fetchEnquiryDetails();
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} quote:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} quote`);
    }
  };

  const fetchBrokerEnquiries = async () => {
    if (!enquiry) return;
    
    setLoadingBrokerData(true);
    try {
      const token = localStorage.getItem('token');
      // Use specialized route to search for broker enquiries matching route and cargo type
      const params = new URLSearchParams({
        from: enquiry.from,
        to: enquiry.to,
        cargoType: enquiry.cargoType,
        limit: '20'
      });
      
      const response = await fetch(`http://localhost:3001/api/transport-broker-rate-enquiries/search/by-route?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBrokerEnquiries(data.enquiries || []);
        
        // Fetch bids for each enquiry
        for (const brokerEnquiry of data.enquiries || []) {
          fetchBidsForEnquiry(brokerEnquiry.id);
        }
      }
    } catch (error) {
      console.error('Error fetching broker enquiries:', error);
    } finally {
      setLoadingBrokerData(false);
    }
  };

  const fetchBidsForEnquiry = async (brokerEnquiryId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/transport-rate-bids?enquiryId=${brokerEnquiryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBrokerBids(prev => ({
          ...prev,
          [brokerEnquiryId]: data.bids || []
        }));
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const handleShowOrderModal = () => {
    setOrderFormData({ 
      brokerId: '', 
      routeId: '', 
      amount: '', 
      notes: '',
      brokerName: '', 
      route: '' 
    });
    setShowBrokerEnquiries(false);
    setShowOrderModal(true);
  };

  const handleBrowseBrokerEnquiries = () => {
    setShowBrokerEnquiries(true);
    fetchBrokerEnquiries();
  };

  const handleSelectBid = (bid: BrokerBid, brokerEnquiry: BrokerEnquiry) => {
    // Try to find the broker in our list
    const matchingBroker = availableBrokers.find(broker => broker.id === bid.brokerId);
    
    setOrderFormData({
      brokerId: matchingBroker ? bid.brokerId.toString() : '',
      routeId: '', // We'll need to determine this from route name if possible
      amount: bid.rate.toString(),
      notes: `Selected from bid #${bid.id}`,
      // Legacy support
      brokerName: bid.brokerName || `Broker ${bid.brokerId}`,
      route: `${enquiry?.from} → ${enquiry?.to}`,
    });
    setShowBrokerEnquiries(false);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Validate required fields
      if (!orderFormData.brokerId) {
        alert('Please select a broker');
        return;
      }
      if (!orderFormData.routeId) {
        alert('Please select a route');
        return;
      }

      const requestData = {
        enquiryId: parseInt(enquiryId),
        brokerId: parseInt(orderFormData.brokerId),
        routeId: parseInt(orderFormData.routeId),
        amount: parseFloat(orderFormData.amount),
        notes: orderFormData.notes,
      };

      const response = await fetch('http://localhost:3001/api/transport-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }
      
      setShowOrderModal(false);
      setOrderFormData({ 
        brokerId: '', 
        routeId: '', 
        amount: '', 
        notes: '',
        brokerName: '', 
        route: '' 
      });
      fetchEnquiryDetails();
    } catch (error) {
      console.error('Error creating order:', error);
      alert(error instanceof Error ? error.message : 'Failed to create order');
    }
  };

  const handleDeleteEnquiry = async () => {
    if (!confirm('Are you sure you want to delete this enquiry? This will also delete all related quotes and orders.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/enquiries/${enquiryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to delete enquiry');
      router.push('/enquiries');
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      alert('Failed to delete enquiry');
    }
  };

  const handlePromoteEnquiry = () => {
    const acceptedQuotes = quotes.filter(quote => quote.status === 'accepted');
    if (acceptedQuotes.length === 0) {
      alert('Please ensure at least one quote is accepted before promoting to customer order.');
      return;
    }
    
    if (acceptedQuotes.length === 1) {
      setSelectedQuoteId(acceptedQuotes[0].id);
    } else {
      setSelectedQuoteId(null);
    }
    
    setPromoteNotes('');
    setShowPromoteModal(true);
  };

  const handlePromoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuoteId) {
      alert('Please select a quote to proceed with the customer order.');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/customer-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enquiryId: parseInt(enquiryId),
          quoteId: selectedQuoteId,
          notes: promoteNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer order');
      }
      
      alert('Enquiry successfully promoted to customer order!');
      setShowPromoteModal(false);
      fetchEnquiryDetails(); // Refresh to show updated status and customer order
    } catch (error) {
      console.error('Error promoting enquiry:', error);
      alert(error instanceof Error ? error.message : 'Failed to promote enquiry');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-gray-500">Enquiry not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/enquiries')}
            className="p-1.5 hover:bg-gray-100 rounded"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-black">Enquiry Details</h1>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                enquiry.status === 'accepted' ? 'bg-green-100 text-green-700' :
                enquiry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {enquiry.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">ID: #{enquiry.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {customerOrder && (
            <button
              onClick={() => router.push(`/customer-orders/${customerOrder.id}`)}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              <Eye size={12} />
              View Order
            </button>
          )}
          {enquiry.status === 'pending' && quotes.some(q => q.status === 'accepted') && (
            <button
              onClick={handlePromoteEnquiry}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              <DollarSign size={12} />
              Promote to Order
            </button>
          )}
          <button
            onClick={() => router.push(`/enquiries?edit=${enquiry.id}`)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
          >
            <Edit size={12} />
            Edit
          </button>
          <button
            onClick={handleDeleteEnquiry}
            className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded text-xs hover:bg-red-50"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      {/* Lead Information */}
      {lead && (
        <div className="bg-white rounded border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-black mb-3 flex items-center gap-2">
            <User size={14} />
            Lead Information
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
      )}

      {/* Enquiry Information */}
      <div className="bg-white rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-black mb-3">Enquiry Information</h2>
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
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-xs font-medium text-black">{new Date(enquiry.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
        {enquiry.remarks && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500">Remarks</p>
            <p className="text-xs text-black mt-1">{enquiry.remarks}</p>
          </div>
        )}
      </div>

      {/* Quotes Section */}
      <div className="bg-white rounded border border-gray-300">
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-black flex items-center gap-2">
            <DollarSign size={14} />
            Quotes ({quotes.length})
          </h2>
          <button
            onClick={handleShowQuoteModal}
            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
          >
            <Plus size={10} />
            Add Quote
          </button>
        </div>
        {quotes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Base Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Margin</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Final Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">Q{quote.id}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        quote.isCustomAmount ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {quote.isCustomAmount ? 'Custom' : 'Calculated'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {quote.isCustomAmount ? '-' : `₹${quote.baseAmount ? quote.baseAmount.toLocaleString() : '-'}`}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {quote.isCustomAmount ? '-' : (quote.marginPercentage ? `${quote.marginPercentage}%` : '-')}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-black">
                      ₹{quote.quotationAmount.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                        quote.status === 'accepted' ? 'bg-green-100 text-green-700' :
                        quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {quote.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                      {new Date(quote.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditQuote(quote)}
                          className="p-1 text-black hover:bg-gray-100 rounded"
                          title="Edit Quote"
                        >
                          <Edit size={10} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Quote"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">No quotes yet</p>
        )}
      </div>

      {/* Orders Section */}
      <div className="bg-white rounded border border-gray-300">
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-black flex items-center gap-2">
            <Truck size={14} />
            Truck Orders ({orders.length})
          </h2>
          <button
            onClick={handleShowOrderModal}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
          >
            <Plus size={10} />
            Add Order
          </button>
        </div>
        {orders.length > 0 ? (
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
                {orders.map((order) => (
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
          <p className="text-xs text-gray-500 text-center py-4">No orders yet</p>
        )}
      </div>

      {/* Transport Enquiries Section */}
      <div className="bg-white rounded border border-gray-300">
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-300">
          <h2 className="text-sm font-semibold text-black flex items-center gap-2">
            <Package size={14} />
            Transport Enquiries ({linkedTransportEnquiries.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTransportEnquiryModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
            >
              <Plus size={10} />
              Create Transport Enquiry
            </button>
            <button
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              <Link size={10} />
              Link Existing Enquiries
            </button>
          </div>
        </div>
        {linkedTransportEnquiries.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-xs min-w-[1400px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase w-8"></th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Cargo Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Weight (MT)</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Transport Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Bids</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L1 Broker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L1 Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L2 Broker</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">L2 Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {linkedTransportEnquiries.map((link) => (
                  <React.Fragment key={link.linkId}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <button
                          onClick={() => toggleRowExpansion(link.transportEnquiry.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title={expandedRows.has(link.transportEnquiry.id) ? "Collapse bids" : "Expand to see bids"}
                        >
                          {expandedRows.has(link.transportEnquiry.id) ? 
                            <ChevronDown size={14} /> : 
                            <ChevronRight size={14} />
                          }
                        </button>
                      </td>
                      <td className="px-3 py-2 text-black">#{link.transportEnquiry.id}</td>
                      <td className="px-3 py-2 text-black">{link.transportEnquiry.routeName || 'N/A'}</td>
                      <td className="px-3 py-2 text-black">{link.transportEnquiry.cargoType}</td>
                      <td className="px-3 py-2 text-black">{link.transportEnquiry.cargoWeight || 'N/A'}</td>
                      <td className="px-3 py-2 text-black">
                        {link.transportEnquiry.transportDate ? 
                          new Date(link.transportEnquiry.transportDate).toLocaleDateString() : 
                          'N/A'
                        }
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          link.transportEnquiry.status === 'open' ? 'bg-blue-100 text-blue-700' :
                          link.transportEnquiry.status === 'bidding' ? 'bg-yellow-100 text-yellow-700' :
                          link.transportEnquiry.status === 'quoted' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {link.transportEnquiry.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-black font-medium">
                        <button
                          onClick={() => toggleRowExpansion(link.transportEnquiry.id)}
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          {link.transportEnquiry.bidCount || 0} bids
                        </button>
                      </td>
                      <td className="px-3 py-2 text-black">
                        {link.transportEnquiry.l1Broker || '-'}
                      </td>
                      <td className="px-3 py-2 text-black font-medium">
                        {link.transportEnquiry.l1Rate ? `₹${link.transportEnquiry.l1Rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-black">
                        {link.transportEnquiry.l2Broker || '-'}
                      </td>
                      <td className="px-3 py-2 text-black font-medium">
                        {link.transportEnquiry.l2Rate ? `₹${link.transportEnquiry.l2Rate.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-black">
                        {new Date(link.transportEnquiry.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCreateTransportOrder(link.transportEnquiry)}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            title="Create Transport Order"
                          >
                            <Plus size={10} />
                            Order
                          </button>
                          <button
                            onClick={() => router.push(`/transport-broker-rate-enquiries/${link.transportEnquiry.id}`)}
                            className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Bids Row */}
                    {expandedRows.has(link.transportEnquiry.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={14} className="px-3 py-4">
                          <div className="ml-6">
                            <h4 className="text-sm font-medium text-black mb-2">Bids for Transport Enquiry #{link.transportEnquiry.id}</h4>
                            {loadingBids[link.transportEnquiry.id] ? (
                              <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mx-auto"></div>
                                <p className="text-xs text-gray-500 mt-2">Loading bids...</p>
                              </div>
                            ) : transportBids[link.transportEnquiry.id]?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs bg-white rounded border">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Bid ID</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Broker</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Rate</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Remarks</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {transportBids[link.transportEnquiry.id].map((bid: any) => (
                                      <tr key={bid.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-black">#{bid.id}</td>
                                        <td className="px-3 py-2 text-black">{bid.brokerName || 'Unknown Broker'}</td>
                                        <td className="px-3 py-2 text-black font-medium">₹{bid.rate?.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-black">{bid.remarks || '-'}</td>
                                        <td className="px-3 py-2 text-black">
                                          {new Date(bid.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-3 py-2">
                                          <button
                                            onClick={() => handlePlaceOrder(bid, link.transportEnquiry)}
                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                          >
                                            <ShoppingCart size={10} />
                                            Place Order
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 py-4">No bids available for this transport enquiry</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500 text-center py-4">No transport enquiries yet</p>
        )}
      </div>

      {/* Transport Enquiry Modal */}
      {showTransportEnquiryModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">Create Transport Enquiry</h2>
              <button onClick={() => setShowTransportEnquiryModal(false)} className="text-black hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <TransportEnquiryForm
              onSubmit={handleCreateTransportEnquiry}
              onCancel={() => setShowTransportEnquiryModal(false)}
              loading={false}
              submitText="Create Transport Enquiry"
              showHeader={false}
              className="p-0"
              initialValues={{
                cargoType: enquiry.cargoType || '',
                cargoWeight: enquiry.cargoWeight ? enquiry.cargoWeight.toString() : '',
                transportDate: new Date().toISOString().split('T')[0],
                remarks: `Route: ${enquiry.from} → ${enquiry.to}${enquiry.remarks ? `\nOriginal Remarks: ${enquiry.remarks}` : ''}`
              }}
            />
          </div>
        </div>
      )}

      {/* Link Existing Transport Enquiries Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-black">Link Existing Transport Enquiries</h2>
              <button onClick={handleCloseLinkModal} className="text-black hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Search Section */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Search by ID, cargo type, route, weight, or remarks... (searches automatically)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded text-sm text-black focus:ring-1 focus:ring-black focus:border-transparent"
                />
                {loadingAvailable && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Filters Section */}
            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={linkModalFilters.status}
                    onChange={(e) => {
                      setLinkModalFilters({ ...linkModalFilters, status: e.target.value });
                      setLinkModalPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Cargo Type Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cargo Type</label>
                  <input
                    type="text"
                    value={linkModalFilters.cargoType}
                    onChange={(e) => {
                      setLinkModalFilters({ ...linkModalFilters, cargoType: e.target.value });
                      setLinkModalPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    placeholder="Filter by cargo type"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* From Date Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={linkModalFilters.fromDate}
                    onChange={(e) => {
                      setLinkModalFilters({ ...linkModalFilters, fromDate: e.target.value });
                      setLinkModalPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* To Date Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={linkModalFilters.toDate}
                    onChange={(e) => {
                      setLinkModalFilters({ ...linkModalFilters, toDate: e.target.value });
                      setLinkModalPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {(linkModalFilters.status || linkModalFilters.cargoType || linkModalFilters.fromDate || linkModalFilters.toDate) && (
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <button
                    onClick={() => {
                      setLinkModalFilters({ status: '', fromDate: '', toDate: '', cargoType: '' });
                      setLinkModalPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs font-medium hover:bg-red-200"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            {/* Available Enquiries List */}
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded">
              {loadingAvailable ? (
                <div className="p-4 text-center text-gray-500">Searching for available transport enquiries...</div>
              ) : availableTransportEnquiries.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchQuery || linkModalFilters.status || linkModalFilters.cargoType || linkModalFilters.fromDate || linkModalFilters.toDate
                    ? 'No transport enquiries found matching your search criteria. Try adjusting your filters or search terms.'
                    : 'No available transport enquiries found. Make sure there are unlinked transport enquiries in the system.'}
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        <input
                          type="checkbox"
                          checked={selectedEnquiries.length === availableTransportEnquiries.length && availableTransportEnquiries.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEnquiries(availableTransportEnquiries.map(te => te.id));
                            } else {
                              setSelectedEnquiries([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Route</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Cargo Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Weight (MT)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Transport Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-black uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {availableTransportEnquiries.map((enquiry) => (
                      <tr key={enquiry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedEnquiries.includes(enquiry.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEnquiries([...selectedEnquiries, enquiry.id]);
                              } else {
                                setSelectedEnquiries(selectedEnquiries.filter(id => id !== enquiry.id));
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black font-medium">
                          #{enquiry.id}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} />
                            {enquiry.routeName || `Route ID: ${enquiry.routeId}`}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                          <div className="flex items-center gap-1">
                            <Package size={12} />
                            {enquiry.cargoType}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black font-medium">
                          {enquiry.cargoWeight || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            {enquiry.transportDate ? new Date(enquiry.transportDate).toLocaleDateString() : '-'}
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                          <span className={`px-1.5 py-0.5 rounded text-xs capitalize ${
                            enquiry.status === 'open' ? 'bg-blue-100 text-blue-800' :
                            enquiry.status === 'bidding' ? 'bg-yellow-100 text-yellow-800' :
                            enquiry.status === 'quoted' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {enquiry.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-black">
                          {new Date(enquiry.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {linkModalPagination.pages > 0 && (
              <div className="border-t border-gray-200">
                <EnhancedPagination
                  pagination={linkModalPagination}
                  pageSize={linkModalPageSize}
                  onPageChange={handleLinkModalPageChange}
                  onPageSizeChange={handleLinkModalPageSizeChange}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-600">
                {selectedEnquiries.length > 0 && (
                  <span>{selectedEnquiries.length} enquir{selectedEnquiries.length === 1 ? 'y' : 'ies'} selected</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCloseLinkModal}
                  className="px-4 py-2 border border-gray-300 text-black rounded text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkEnquiries}
                  disabled={selectedEnquiries.length === 0 || linkingEnquiries}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {linkingEnquiries ? 'Linking...' : `Link Selected (${selectedEnquiries.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">{isEditMode ? 'Edit Quote' : 'Create Quote'}</h2>
              <button onClick={() => setShowQuoteModal(false)} className="text-black hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-3">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Margin: ₹{(baseAmount * (parseFloat(quoteFormData.marginPercentage) || 0) / 100).toLocaleString()}
                  </p>
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

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">Create Order</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-black hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {!showBrokerEnquiries ? (
              <form onSubmit={handleOrderSubmit} className="space-y-3">
                {(orderFormData.brokerId || orderFormData.routeId || orderFormData.notes) && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-xs text-blue-700 font-medium">Auto-populated from Transport Enquiry</p>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Form has been pre-filled with transport enquiry data. You can modify the values as needed.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleBrowseBrokerEnquiries}
                    className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                  >
                    Browse Broker Enquiries
                  </button>
                  <span className="text-xs text-gray-500 self-center">or select broker/route:</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">Broker*</label>
                  <select
                    value={orderFormData.brokerId}
                    onChange={(e) => setOrderFormData({ ...orderFormData, brokerId: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select a broker</option>
                    {availableBrokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.companyName} ({broker.personName}) - {broker.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-black mb-1">Route*</label>
                  <select
                    value={orderFormData.routeId}
                    onChange={(e) => setOrderFormData({ ...orderFormData, routeId: e.target.value })}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  >
                    <option value="">Select a route</option>
                    {availableRoutes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name}
                      </option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-xs font-medium text-black mb-1">Notes</label>
                  <textarea
                    value={orderFormData.notes}
                    onChange={(e) => setOrderFormData({ ...orderFormData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                    placeholder="Additional notes about this order..."
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
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-black">Available Broker Enquiries</h3>
                  <button
                    onClick={() => setShowBrokerEnquiries(false)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    ← Back to Manual Entry
                  </button>
                </div>

                {loadingBrokerData ? (
                  <div className="text-center py-4">
                    <div className="text-xs text-gray-500">Loading broker enquiries...</div>
                  </div>
                ) : brokerEnquiries.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="text-xs text-gray-500">No broker enquiries found for "{enquiry?.cargoType}"</div>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {brokerEnquiries.map((brokerEnquiry) => (
                      <div key={brokerEnquiry.id} className="border border-gray-200 rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs font-medium text-black">
                              Enquiry #{brokerEnquiry.id} - {brokerEnquiry.cargoType}
                            </div>
                            <div className="text-xs text-gray-500">
                              {brokerEnquiry.cargoWeight ? `${brokerEnquiry.cargoWeight} MT` : 'Weight not specified'}
                            </div>
                            {brokerEnquiry.remarks && (
                              <div className="text-xs text-gray-600 mt-1">{brokerEnquiry.remarks}</div>
                            )}
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${
                            brokerEnquiry.status === 'quoted' ? 'bg-green-100 text-green-700' :
                            brokerEnquiry.status === 'bidding' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {brokerEnquiry.status}
                          </span>
                        </div>
                        
                        {brokerBids[brokerEnquiry.id] && brokerBids[brokerEnquiry.id].length > 0 ? (
                          <div className="space-y-1">
                            <div className="text-xs font-medium text-black">Available Bids:</div>
                            {brokerBids[brokerEnquiry.id].map((bid) => (
                              <div key={bid.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                <div className="text-xs">
                                  <span className="font-medium">{bid.brokerName || `Broker ${bid.brokerId}`}</span>
                                  <span className="text-gray-500 ml-2">₹{bid.rate.toLocaleString()}</span>
                                </div>
                                <button
                                  onClick={() => handleSelectBid(bid, brokerEnquiry)}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  Select
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">No bids available for this enquiry</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promote to Order Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-black">Promote to Customer Order</h2>
              <button onClick={() => setShowPromoteModal(false)} className="text-black hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-3">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-xs text-blue-700 mb-2">
                  This will create a customer order and mark the enquiry as accepted.
                </p>
                <div className="text-xs">
                  <span className="font-medium">Enquiry:</span> {enquiry.from} → {enquiry.to}
                </div>
              </div>

              {quotes.filter(q => q.status === 'accepted').length > 1 && (
                <div>
                  <label className="block text-xs font-medium text-black mb-1">Select Quote*</label>
                  <select
                    value={selectedQuoteId || ''}
                    onChange={(e) => setSelectedQuoteId(parseInt(e.target.value))}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  >
                    <option value="">Choose accepted quote</option>
                    {quotes.filter(q => q.status === 'accepted').map((quote) => (
                      <option key={quote.id} value={quote.id}>
                        Quote #{quote.id} - ₹{quote.quotationAmount.toLocaleString()} ({quote.isCustomAmount ? 'Custom' : 'Calculated'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {quotes.filter(q => q.status === 'accepted').length === 1 && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs font-medium text-black mb-1">Selected Quote:</p>
                  <p className="text-xs text-gray-700">
                    Quote #{quotes.find(q => q.status === 'accepted')?.id} - ₹{quotes.find(q => q.status === 'accepted')?.quotationAmount.toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-black mb-1">Order Notes</label>
                <textarea
                  value={promoteNotes}
                  onChange={(e) => setPromoteNotes(e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs text-black focus:ring-1 focus:ring-black"
                  placeholder="Add any notes for this customer order..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Create Customer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}