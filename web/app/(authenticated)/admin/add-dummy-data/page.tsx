'use client';

import { useState } from 'react';

const dummyBrokers = [
  {
    companyName: 'Express Logistics Pvt Ltd',
    personName: 'Rajesh Kumar',
    phone: '+91-9876543210',
    alternatePhone: '+91-9876543211',
    city: 'Mumbai',
    remarks: 'Specializes in heavy machinery transport',
    referrer: 'Trade Association',
    regions: [
      {region: 'Western', state: 'Maharashtra', city: 'Mumbai'},
      {region: 'Western', state: 'Gujarat', city: 'Ahmedabad'},
      {region: 'Northern', state: 'Rajasthan', city: 'Jaipur'},
      {region: 'Northern', state: 'Delhi', city: 'New Delhi'}
    ],
    vehicleTypes: ['32 Ft Trailer', '40 Ft Container', 'Heavy Duty Truck', 'Open Body Truck']
  },
  {
    companyName: 'Rapid Transport Solutions',
    personName: 'Suresh Patel',
    phone: '+91-9123456789',
    alternatePhone: '+91-9123456790',
    city: 'Ahmedabad',
    remarks: 'Fast delivery, competitive rates',
    referrer: 'Business Partner',
    regions: [
      {region: 'Western', state: 'Gujarat', city: 'Ahmedabad'},
      {region: 'Northern', state: 'Rajasthan', city: 'Jodhpur'},
      {region: 'Central', state: 'Madhya Pradesh', city: 'Indore'}
    ],
    vehicleTypes: ['Tata Ace', '14 Ft Truck', '19 Ft Truck', 'Eicher Truck']
  },
  {
    companyName: 'National Freight Carriers',
    personName: 'Amit Singh',
    phone: '+91-8765432109',
    city: 'Delhi',
    remarks: 'Pan-India operations, reliable service',
    referrer: 'Online Directory',
    regions: [
      {region: 'Northern', state: 'Delhi', city: 'Delhi'},
      {region: 'Northern', state: 'Punjab', city: 'Chandigarh'},
      {region: 'Northern', state: 'Haryana', city: 'Gurgaon'},
      {region: 'Northern', state: 'Uttar Pradesh', city: 'Noida'},
      {region: 'Northern', state: 'Uttarakhand', city: 'Dehradun'}
    ],
    vehicleTypes: ['Mini Truck', '14 Ft Truck', '17 Ft Truck', '19 Ft Truck', '24 Ft Truck']
  },
  {
    companyName: 'Southern Express Logistics',
    personName: 'Venkat Reddy',
    phone: '+91-7654321098',
    alternatePhone: '+91-7654321099',
    city: 'Bangalore',
    remarks: 'Excellent for South India routes',
    referrer: 'IndiaMart',
    regions: [
      {region: 'Southern', state: 'Karnataka', city: 'Bangalore'},
      {region: 'Southern', state: 'Tamil Nadu', city: 'Chennai'},
      {region: 'Southern', state: 'Andhra Pradesh', city: 'Hyderabad'},
      {region: 'Southern', state: 'Kerala', city: 'Kochi'},
      {region: 'Southern', state: 'Telangana', city: 'Hyderabad'}
    ],
    vehicleTypes: ['Tempo', '14 Ft Truck', '19 Ft Truck', 'Container Truck']
  },
  {
    companyName: 'Western Cargo Movers',
    personName: 'Deepak Sharma',
    phone: '+91-6543210987',
    city: 'Pune',
    remarks: 'Cost-effective solutions',
    regions: [
      {region: 'Western', state: 'Maharashtra', city: 'Pune'},
      {region: 'Western', state: 'Goa', city: 'Panaji'},
      {region: 'Southern', state: 'Karnataka', city: 'Mangalore'}
    ],
    vehicleTypes: ['Mini Truck', '17 Ft Truck', '20 Ft Container']
  },
  {
    companyName: 'Eastern Transport Hub',
    personName: 'Ravi Ghosh',
    phone: '+91-5432109876',
    alternatePhone: '+91-5432109877',
    city: 'Kolkata',
    remarks: 'Strong network in Eastern India',
    referrer: 'Trade Fair',
    regions: [
      {region: 'Eastern', state: 'West Bengal', city: 'Kolkata'},
      {region: 'Eastern', state: 'Odisha', city: 'Bhubaneswar'},
      {region: 'Eastern', state: 'Bihar', city: 'Patna'},
      {region: 'Eastern', state: 'Jharkhand', city: 'Ranchi'},
      {region: 'Northeastern', state: 'Assam', city: 'Guwahati'}
    ],
    vehicleTypes: ['Tata 407', '14 Ft Truck', '19 Ft Truck', 'Trailer']
  },
  {
    companyName: 'Himalayan Freight Services',
    personName: 'Manoj Thapa',
    phone: '+91-4321098765',
    city: 'Siliguri',
    remarks: 'Specialized in hill station deliveries',
    regions: [
      {region: 'Eastern', state: 'West Bengal', city: 'Siliguri'},
      {region: 'Northeastern', state: 'Sikkim', city: 'Gangtok'},
      {region: 'International', state: 'West Bengal', city: 'Border Areas'}
    ],
    vehicleTypes: ['Mini Truck', '14 Ft Truck', '4x4 Truck']
  },
  {
    companyName: 'Central India Logistics',
    personName: 'Prakash Jain',
    phone: '+91-3210987654',
    alternatePhone: '+91-3210987655',
    city: 'Indore',
    remarks: 'Good rates for bulk cargo',
    referrer: 'Business Network',
    regions: [
      {region: 'Central', state: 'Madhya Pradesh', city: 'Indore'},
      {region: 'Central', state: 'Chhattisgarh', city: 'Raipur'},
      {region: 'Western', state: 'Maharashtra', city: 'Nagpur'}
    ],
    vehicleTypes: ['14 Ft Truck', '17 Ft Truck', '19 Ft Truck', '24 Ft Truck', 'Trailer']
  }
];

const dummyRoutes = [
  {
    name: 'Mumbai - Delhi Express Route',
    locations: [
      { location: 'Mumbai, Maharashtra', sequence: 1 },
      { location: 'Nashik, Maharashtra', sequence: 2 },
      { location: 'Indore, Madhya Pradesh', sequence: 3 },
      { location: 'Delhi, NCR', sequence: 4 }
    ]
  },
  {
    name: 'Chennai - Kolkata Coastal Route',
    locations: [
      { location: 'Chennai, Tamil Nadu', sequence: 1 },
      { location: 'Visakhapatnam, Andhra Pradesh', sequence: 2 },
      { location: 'Bhubaneswar, Odisha', sequence: 3 },
      { location: 'Kolkata, West Bengal', sequence: 4 }
    ]
  },
  {
    name: 'Bangalore - Pune Highway',
    locations: [
      { location: 'Bangalore, Karnataka', sequence: 1 },
      { location: 'Hubli, Karnataka', sequence: 2 },
      { location: 'Pune, Maharashtra', sequence: 3 }
    ]
  },
  {
    name: 'Gujarat - Rajasthan Corridor',
    locations: [
      { location: 'Ahmedabad, Gujarat', sequence: 1 },
      { location: 'Udaipur, Rajasthan', sequence: 2 },
      { location: 'Jaipur, Rajasthan', sequence: 3 }
    ]
  }
];

const dummyRateEnquiries = [
  {
    route_id: 1, // Will be replaced with actual route ID
    cargoType: 'Electronics & IT Equipment',
    cargoWeight: 8.5,
    transportDate: new Date('2024-01-15').toISOString(),
    remarks: 'Fragile items, need GPS tracking and insurance'
  },
  {
    route_id: 2,
    cargoType: 'Textile & Garments',
    cargoWeight: 15.0,
    transportDate: new Date('2024-01-18').toISOString(),
    remarks: 'Bulk shipment, weather protection required'
  },
  {
    route_id: 3,
    cargoType: 'Automobile Spare Parts',
    cargoWeight: 12.5,
    transportDate: new Date('2024-01-20').toISOString(),
    remarks: 'Multiple pickup points in Bangalore industrial area'
  },
  {
    route_id: 4,
    cargoType: 'FMCG & Food Products',
    cargoWeight: 20.0,
    transportDate: new Date('2024-01-22').toISOString(),
    remarks: 'Temperature controlled transport required, max 25°C'
  },
  {
    route_id: 1,
    cargoType: 'Heavy Industrial Machinery',
    cargoWeight: 35.0,
    transportDate: new Date('2024-01-25').toISOString(),
    remarks: 'ODC cargo, special permits required, crane loading needed'
  },
  {
    route_id: 2,
    cargoType: 'Chemical Products (Non-Hazardous)',
    cargoWeight: 18.5,
    transportDate: new Date('2024-01-28').toISOString(),
    remarks: 'Proper documentation and safety equipment mandatory'
  },
  {
    route_id: 3,
    cargoType: 'Construction Materials',
    cargoWeight: 40.0,
    transportDate: new Date('2024-02-01').toISOString(),
    remarks: 'Cement bags and steel rods, tarpaulin cover required'
  },
  {
    route_id: 4,
    cargoType: 'Pharmaceutical Products',
    cargoWeight: 5.5,
    transportDate: new Date('2024-02-05').toISOString(),
    remarks: 'Cold chain maintenance critical, 2-8°C temperature range'
  },
  {
    route_id: 1,
    cargoType: 'Furniture & Home Decor',
    cargoWeight: 10.0,
    transportDate: new Date('2024-02-08').toISOString(),
    remarks: 'Fragile wooden furniture, bubble wrap packing done'
  },
  {
    route_id: 2,
    cargoType: 'Agricultural Produce',
    cargoWeight: 25.0,
    transportDate: new Date('2024-02-10').toISOString(),
    remarks: 'Fresh vegetables, quick transit time essential'
  }
];

const dummyEnquiries = [
  {
    leadId: 1,
    from: 'Mumbai, Maharashtra',
    to: 'Delhi, NCR',
    cargoType: 'Electronics Equipment',
    cargoWeight: 5.5,
    remarks: 'Fragile items, need careful handling',
    source: 'india_mart',
    referrer: 'IndiaMart Premium Lead'
  },
  {
    leadId: 2,
    from: 'Ahmedabad, Gujarat',
    to: 'Bangalore, Karnataka',
    cargoType: 'Textile Goods',
    cargoWeight: 12.0,
    remarks: 'Bulk shipment, standard packaging',
    source: 'just_dial',
    referrer: 'JustDial Business Directory'
  },
  {
    leadId: 3,
    from: 'Chennai, Tamil Nadu',
    to: 'Kolkata, West Bengal',
    cargoType: 'Industrial Machinery',
    cargoWeight: 25.0,
    remarks: 'Heavy machinery, crane required for loading/unloading',
    source: 'referral',
    referrer: 'Existing Client Reference'
  },
  {
    leadId: 4,
    from: 'Pune, Maharashtra',
    to: 'Hyderabad, Telangana',
    cargoType: 'Food Products',
    cargoWeight: 8.5,
    remarks: 'Temperature controlled transport required',
    source: 'india_mart',
    referrer: 'IndiaMart Verified Supplier'
  },
  {
    leadId: 5,
    from: 'Gurgaon, Haryana',
    to: 'Jaipur, Rajasthan',
    cargoType: 'Automobile Parts',
    cargoWeight: 15.5,
    remarks: 'Multiple pickup points, consolidation required',
    source: 'referral',
    referrer: 'Industry Association'
  },
  {
    leadId: 6,
    from: 'Indore, Madhya Pradesh',
    to: 'Lucknow, Uttar Pradesh',
    cargoType: 'Pharmaceutical Products',
    cargoWeight: 3.2,
    remarks: 'Time sensitive delivery, documentation important',
    source: 'unknown'
  },
  {
    leadId: 7,
    from: 'Surat, Gujarat',
    to: 'Nagpur, Maharashtra',
    cargoType: 'Construction Materials',
    cargoWeight: 35.0,
    remarks: 'Heavy load, open truck preferred',
    source: 'just_dial',
    referrer: 'JustDial Construction Directory'
  },
  {
    leadId: 8,
    from: 'Vadodara, Gujarat',
    to: 'Raipur, Chhattisgarh',
    cargoType: 'Chemical Products',
    cargoWeight: 18.5,
    remarks: 'Hazardous material handling, special permits required',
    source: 'india_mart',
    referrer: 'IndiaMart Chemical Division'
  },
  {
    leadId: 1,
    from: 'Coimbatore, Tamil Nadu',
    to: 'Kochi, Kerala',
    cargoType: 'Furniture & Furnishings',
    cargoWeight: 6.8,
    remarks: 'Wooden furniture, moisture protection needed',
    source: 'referral',
    referrer: 'Interior Design Partner'
  },
  {
    leadId: 2,
    from: 'Visakhapatnam, Andhra Pradesh',
    to: 'Bhubaneswar, Odisha',
    cargoType: 'Steel Products',
    cargoWeight: 42.0,
    remarks: 'Heavy steel consignment, trailer truck required',
    source: 'unknown'
  },
  {
    leadId: 3,
    from: 'Tirupur, Tamil Nadu',
    to: 'Kanpur, Uttar Pradesh',
    cargoType: 'Ready-made Garments',
    cargoWeight: 9.2,
    remarks: 'Export quality garments, careful handling required',
    source: 'india_mart',
    referrer: 'Export Division'
  },
  {
    leadId: 4,
    from: 'Nashik, Maharashtra',
    to: 'Patna, Bihar',
    cargoType: 'Agricultural Products',
    cargoWeight: 22.0,
    remarks: 'Seasonal produce, quick delivery preferred',
    source: 'just_dial',
    referrer: 'Agricultural Traders Association'
  }
];

const dummyLeads = [
  {
    name: 'Priya Industries',
    phone: '+91-9988776655',
    alternatePhone: '+91-9988776656',
    source: 'india_mart',
    referrer: 'Online Portal'
  },
  {
    name: 'Global Manufacturing Co.',
    phone: '+91-8877665544',
    source: 'just_dial',
    referrer: 'JustDial Listing'
  },
  {
    name: 'Tech Solutions Pvt Ltd',
    phone: '+91-7766554433',
    alternatePhone: '+91-7766554434',
    source: 'referral',
    referrer: 'Existing Client - ABC Corp'
  },
  {
    name: 'Modern Textiles',
    phone: '+91-6655443322',
    source: 'india_mart',
    referrer: 'IndiaMart Lead'
  },
  {
    name: 'Agricultural Exports Ltd',
    phone: '+91-5544332211',
    alternatePhone: '+91-5544332212',
    source: 'referral',
    referrer: 'Trade Association'
  },
  {
    name: 'Automobile Parts Co.',
    phone: '+91-4433221100',
    source: 'unknown',
  },
  {
    name: 'Pharma Distributors',
    phone: '+91-3322110099',
    alternatePhone: '+91-3322110098',
    source: 'just_dial',
    referrer: 'JustDial Premium'
  },
  {
    name: 'Electronics Warehouse',
    phone: '+91-2211009988',
    source: 'india_mart',
    referrer: 'IndiaMart Premium'
  },
  {
    name: 'Food Processing Unit',
    phone: '+91-1100998877',
    alternatePhone: '+91-1100998876',
    source: 'referral',
    referrer: 'Industry Contact'
  },
  {
    name: 'Construction Materials Ltd',
    phone: '+91-9988007766',
    source: 'unknown',
  },
  {
    name: 'Chemical Industries',
    phone: '+91-8877006655',
    alternatePhone: '+91-8877006654',
    source: 'india_mart',
    referrer: 'IndiaMart Inquiry'
  },
  {
    name: 'Steel Trading Co.',
    phone: '+91-7766005544',
    source: 'just_dial',
    referrer: 'Online Directory'
  }
];

export default function AddDummyDataPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addDummyData = async () => {
    setLoading(true);
    setResults([]);
    const newResults: string[] = [];

    const token = localStorage.getItem('token');
    if (!token) {
      newResults.push('❌ No authentication token found. Please log in first.');
      setResults(newResults);
      setLoading(false);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Add brokers
    newResults.push('🚛 Adding dummy brokers...');
    setResults([...newResults]);

    for (const broker of dummyBrokers) {
      try {
        const response = await fetch('http://localhost:3001/api/brokers', {
          method: 'POST',
          headers,
          body: JSON.stringify(broker),
        });

        if (response.ok) {
          newResults.push(`✅ Added broker: ${broker.companyName}`);
        } else {
          const error = await response.text();
          newResults.push(`❌ Failed to add broker ${broker.companyName}: ${error}`);
        }
      } catch (error: any) {
        newResults.push(`❌ Error adding broker ${broker.companyName}: ${error.message}`);
      }
      setResults([...newResults]);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add leads
    newResults.push('');
    newResults.push('👥 Adding dummy leads...');
    setResults([...newResults]);

    for (const lead of dummyLeads) {
      try {
        const response = await fetch('http://localhost:3001/api/leads', {
          method: 'POST',
          headers,
          body: JSON.stringify(lead),
        });

        if (response.ok) {
          newResults.push(`✅ Added lead: ${lead.name}`);
        } else {
          const error = await response.text();
          newResults.push(`❌ Failed to add lead ${lead.name}: ${error}`);
        }
      } catch (error: any) {
        newResults.push(`❌ Error adding lead ${lead.name}: ${error.message}`);
      }
      setResults([...newResults]);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add enquiries
    newResults.push('');
    newResults.push('📋 Adding dummy enquiries...');
    setResults([...newResults]);

    for (const enquiry of dummyEnquiries) {
      try {
        const response = await fetch('http://localhost:3001/api/enquiries', {
          method: 'POST',
          headers,
          body: JSON.stringify(enquiry),
        });

        if (response.ok) {
          newResults.push(`✅ Added enquiry: ${enquiry.from} → ${enquiry.to} (${enquiry.cargoType})`);
        } else {
          const error = await response.text();
          newResults.push(`❌ Failed to add enquiry ${enquiry.from} → ${enquiry.to}: ${error}`);
        }
      } catch (error: any) {
        newResults.push(`❌ Error adding enquiry ${enquiry.from} → ${enquiry.to}: ${error.message}`);
      }
      setResults([...newResults]);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add transport routes
    newResults.push('');
    newResults.push('🚛 Adding transport routes...');
    setResults([...newResults]);

    const routeIdMap: {[key: number]: number} = {};
    for (let i = 0; i < dummyRoutes.length; i++) {
      const route = dummyRoutes[i];
      try {
        const response = await fetch('http://localhost:3001/api/transport-routes', {
          method: 'POST',
          headers,
          body: JSON.stringify(route),
        });

        if (response.ok) {
          const data = await response.json();
          routeIdMap[i + 1] = data.id;
          newResults.push(`✅ Added route: ${route.name}`);
        } else {
          const error = await response.text();
          newResults.push(`❌ Failed to add route ${route.name}: ${error}`);
        }
      } catch (error: any) {
        newResults.push(`❌ Error adding route ${route.name}: ${error.message}`);
      }
      setResults([...newResults]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add rate enquiries
    newResults.push('');
    newResults.push('📊 Adding transport broker rate enquiries...');
    setResults([...newResults]);

    for (const rateEnquiry of dummyRateEnquiries) {
      try {
        // Update route_id with actual route ID from the map
        const enquiryData = {
          ...rateEnquiry,
          route_id: routeIdMap[rateEnquiry.route_id] || rateEnquiry.route_id
        };

        const response = await fetch('http://localhost:3001/api/transport-broker-rate-enquiries', {
          method: 'POST',
          headers,
          body: JSON.stringify(enquiryData),
        });

        if (response.ok) {
          newResults.push(`✅ Added rate enquiry: ${rateEnquiry.cargoType} (${rateEnquiry.cargoWeight} MT)`);
        } else {
          const error = await response.text();
          newResults.push(`❌ Failed to add rate enquiry ${rateEnquiry.cargoType}: ${error}`);
        }
      } catch (error: any) {
        newResults.push(`❌ Error adding rate enquiry ${rateEnquiry.cargoType}: ${error.message}`);
      }
      setResults([...newResults]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Add transport enquiry links to customer enquiries
    newResults.push('');
    newResults.push('🔗 Linking transport enquiries to customer enquiries...');
    setResults([...newResults]);

    // Get the created enquiries and transport enquiries to link them
    try {
      const enquiriesResponse = await fetch('http://localhost:3001/api/enquiries', {
        headers,
      });
      const transportEnquiriesResponse = await fetch('http://localhost:3001/api/transport-broker-rate-enquiries', {
        headers,
      });

      if (enquiriesResponse.ok && transportEnquiriesResponse.ok) {
        const enquiriesData = await enquiriesResponse.json();
        const transportEnquiriesData = await transportEnquiriesResponse.json();
        
        const customerEnquiries = enquiriesData.enquiries || [];
        const transportEnquiries = transportEnquiriesData.enquiries || [];

        // Link some transport enquiries to customer enquiries
        const linksToCreate = [
          { enquiryId: customerEnquiries[0]?.id, transportEnquiryId: transportEnquiries[0]?.id, notes: 'Primary transport enquiry for electronics shipment' },
          { enquiryId: customerEnquiries[0]?.id, transportEnquiryId: transportEnquiries[4]?.id, notes: 'Alternative option for heavy machinery transport' },
          { enquiryId: customerEnquiries[1]?.id, transportEnquiryId: transportEnquiries[1]?.id, notes: 'Textile goods transport enquiry' },
          { enquiryId: customerEnquiries[2]?.id, transportEnquiryId: transportEnquiries[2]?.id, notes: 'Industrial machinery transport' },
          { enquiryId: customerEnquiries[2]?.id, transportEnquiryId: transportEnquiries[6]?.id, notes: 'Alternative construction materials route' },
          { enquiryId: customerEnquiries[3]?.id, transportEnquiryId: transportEnquiries[3]?.id, notes: 'Food products cold chain transport' },
          { enquiryId: customerEnquiries[3]?.id, transportEnquiryId: transportEnquiries[7]?.id, notes: 'Pharmaceutical grade transport option' },
          { enquiryId: customerEnquiries[4]?.id, transportEnquiryId: transportEnquiries[8]?.id, notes: 'Automobile parts shipment' },
          { enquiryId: customerEnquiries[5]?.id, transportEnquiryId: transportEnquiries[5]?.id, notes: 'Chemical products transport' },
          { enquiryId: customerEnquiries[6]?.id, transportEnquiryId: transportEnquiries[9]?.id, notes: 'Agricultural produce quick delivery' }
        ];

        for (const link of linksToCreate) {
          if (link.enquiryId && link.transportEnquiryId) {
            try {
              const response = await fetch('http://localhost:3001/api/enquiry-transport-links', {
                method: 'POST',
                headers,
                body: JSON.stringify(link),
              });

              if (response.ok) {
                newResults.push(`✅ Linked customer enquiry ${link.enquiryId} to transport enquiry ${link.transportEnquiryId}`);
              } else {
                const error = await response.text();
                newResults.push(`❌ Failed to link enquiries: ${error}`);
              }
            } catch (error: any) {
              newResults.push(`❌ Error linking enquiries: ${error.message}`);
            }
            setResults([...newResults]);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
      } else {
        newResults.push('❌ Failed to fetch enquiries for linking');
      }
    } catch (error: any) {
      newResults.push(`❌ Error fetching enquiries for linking: ${error.message}`);
    }

    newResults.push('');
    newResults.push('🎉 Done! Check your brokers, leads, enquiries, routes, rate enquiries, and enquiry links pages to see the new data.');
    setResults([...newResults]);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-black">Add Dummy Data</h1>
        <p className="text-sm text-black mt-1">
          This will add sample brokers and leads to populate your application with test data.
        </p>
      </div>

      <div className="bg-white rounded border border-black p-4">
        <h2 className="text-base font-bold text-black mb-2">What will be added:</h2>
        <div className="text-xs text-black space-y-1">
          <div>• <strong>{dummyBrokers.length} Brokers</strong> with regions and vehicle types</div>
          <div>• <strong>{dummyLeads.length} Leads</strong> from various sources</div>
          <div>• <strong>{dummyEnquiries.length} Enquiries</strong> for transport requirements</div>
          <div>• <strong>{dummyRoutes.length} Transport Routes</strong> with multiple locations</div>
          <div>• <strong>{dummyRateEnquiries.length} Rate Enquiries</strong> for broker bidding</div>
          <div>• <strong>~10 Transport Enquiry Links</strong> connecting customer enquiries to transport enquiries</div>
        </div>
      </div>

      <button
        onClick={addDummyData}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded text-sm font-medium hover:bg-black/80 disabled:opacity-50"
      >
        {loading ? 'Adding Data...' : 'Add Dummy Data'}
      </button>

      {results.length > 0 && (
        <div className="bg-white rounded border border-black p-4">
          <h3 className="text-sm font-bold text-black mb-2">Results:</h3>
          <div className="space-y-1 text-xs text-black font-mono max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index}>{result}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}