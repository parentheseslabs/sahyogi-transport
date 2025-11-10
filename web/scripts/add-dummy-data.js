// Script to add dummy brokers and leads to the database
// Run this with: node scripts/add-dummy-data.js

const API_URL = 'http://localhost:3001';

// You'll need to get a valid token first by logging in
const TOKEN = 'YOUR_TOKEN_HERE'; // Replace with actual token

const dummyBrokers = [
  {
    companyName: 'Express Logistics Pvt Ltd',
    personName: 'Rajesh Kumar',
    phone: '+91-9876543210',
    alternatePhone: '+91-9876543211',
    city: 'Mumbai',
    remarks: 'Specializes in heavy machinery transport',
    referrer: 'Trade Association',
    regions: ['Maharashtra', 'Gujarat', 'Rajasthan', 'Delhi NCR'],
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
    regions: ['Gujarat', 'Rajasthan', 'Madhya Pradesh'],
    vehicleTypes: ['Tata Ace', '14 Ft Truck', '19 Ft Truck', 'Eicher Truck']
  },
  {
    companyName: 'National Freight Carriers',
    personName: 'Amit Singh',
    phone: '+91-8765432109',
    city: 'Delhi',
    remarks: 'Pan-India operations, reliable service',
    referrer: 'Online Directory',
    regions: ['Delhi NCR', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Uttarakhand'],
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
    regions: ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Kerala', 'Telangana'],
    vehicleTypes: ['Tempo', '14 Ft Truck', '19 Ft Truck', 'Container Truck']
  },
  {
    companyName: 'Western Cargo Movers',
    personName: 'Deepak Sharma',
    phone: '+91-6543210987',
    city: 'Pune',
    remarks: 'Cost-effective solutions',
    regions: ['Maharashtra', 'Goa', 'Karnataka'],
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
    regions: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand', 'Assam'],
    vehicleTypes: ['Tata 407', '14 Ft Truck', '19 Ft Truck', 'Trailer']
  },
  {
    companyName: 'Himalayan Freight Services',
    personName: 'Manoj Thapa',
    phone: '+91-4321098765',
    city: 'Siliguri',
    remarks: 'Specialized in hill station deliveries',
    regions: ['West Bengal', 'Sikkim', 'Nepal Border'],
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
    regions: ['Madhya Pradesh', 'Chhattisgarh', 'Maharashtra'],
    vehicleTypes: ['14 Ft Truck', '17 Ft Truck', '19 Ft Truck', '24 Ft Truck', 'Trailer']
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

async function addDummyData() {
  if (TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('Please replace TOKEN with a valid authentication token');
    console.log('You can get this by:');
    console.log('1. Opening browser dev tools');
    console.log('2. Going to Application/Storage > Local Storage');
    console.log('3. Finding the "token" key');
    console.log('4. Copying its value');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  console.log('Adding dummy brokers...');
  for (const broker of dummyBrokers) {
    try {
      const response = await fetch(`${API_URL}/api/brokers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(broker)
      });
      
      if (response.ok) {
        console.log(`✓ Added broker: ${broker.companyName}`);
      } else {
        const error = await response.text();
        console.log(`✗ Failed to add broker ${broker.companyName}: ${error}`);
      }
    } catch (error) {
      console.log(`✗ Error adding broker ${broker.companyName}:`, error.message);
    }
  }

  console.log('\nAdding dummy leads...');
  for (const lead of dummyLeads) {
    try {
      const response = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify(lead)
      });
      
      if (response.ok) {
        console.log(`✓ Added lead: ${lead.name}`);
      } else {
        const error = await response.text();
        console.log(`✗ Failed to add lead ${lead.name}: ${error}`);
      }
    } catch (error) {
      console.log(`✗ Error adding lead ${lead.name}:`, error.message);
    }
  }

  console.log('\nDone! Check your application to see the new data.');
}

addDummyData();