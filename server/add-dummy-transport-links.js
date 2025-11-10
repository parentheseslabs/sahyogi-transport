const fetch = require('node-fetch');

const addDummyData = async () => {
  try {
    console.log('🔐 Getting auth token...');
    
    // Try to login (you might need to adjust email/password)
    let token = null;
    
    // Try common test credentials
    const credentials = [
      { email: 'admin@example.com', password: 'password123' },
      { email: 'user@example.com', password: 'password123' },
      { email: 'test@test.com', password: 'password' },
      { email: 'admin@test.com', password: 'admin123' }
    ];
    
    for (const cred of credentials) {
      try {
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cred)
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          token = loginData.token;
          console.log(`✅ Logged in with ${cred.email}`);
          break;
        }
      } catch (err) {
        // Continue to next credential
      }
    }
    
    if (!token) {
      console.log('❌ Could not login with test credentials. Please check your auth setup.');
      return;
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Get existing enquiries
    console.log('📋 Fetching existing enquiries...');
    const enquiriesResponse = await fetch('http://localhost:3001/api/enquiries', { headers });
    const enquiriesData = await enquiriesResponse.json();
    const enquiries = enquiriesData.enquiries || [];
    
    console.log(`Found ${enquiries.length} existing enquiries`);
    
    if (enquiries.length === 0) {
      console.log('❌ No enquiries found. Please create some enquiries first or run the main dummy data script.');
      return;
    }
    
    // Get existing routes
    console.log('🚛 Fetching existing routes...');
    const routesResponse = await fetch('http://localhost:3001/api/transport-routes', { headers });
    const routesData = await routesResponse.json();
    const routes = routesData.routes || [];
    
    console.log(`Found ${routes.length} existing routes`);
    
    if (routes.length === 0) {
      console.log('⚠️ No routes found, creating a basic route...');
      
      const routeResponse = await fetch('http://localhost:3001/api/transport-routes', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'Mumbai to Delhi Route',
          locations: [
            { stopType: 'load', remarks: 'Mumbai, Maharashtra' },
            { stopType: 'unload', remarks: 'Delhi, NCR' }
          ]
        })
      });
      
      if (routeResponse.ok) {
        const newRoute = await routeResponse.json();
        routes.push(newRoute);
        console.log('✅ Created basic route');
      }
    }
    
    // Create transport enquiries for the first few customer enquiries
    const transportEnquiries = [
      {
        routeId: routes[0]?.id || 1,
        cargoType: 'Electronics Equipment',
        cargoWeight: 8.5,
        transportDate: new Date('2024-12-15').toISOString(),
        remarks: 'Fragile electronics, GPS tracking required'
      },
      {
        routeId: routes[0]?.id || 1,
        cargoType: 'Industrial Machinery',
        cargoWeight: 25.0,
        transportDate: new Date('2024-12-18').toISOString(),
        remarks: 'Heavy machinery, crane required for loading'
      },
      {
        routeId: routes[0]?.id || 1,
        cargoType: 'Textile Goods',
        cargoWeight: 12.0,
        transportDate: new Date('2024-12-20').toISOString(),
        remarks: 'Bulk textile shipment, weather protection needed'
      },
      {
        routeId: routes[0]?.id || 1,
        cargoType: 'Food Products',
        cargoWeight: 6.5,
        transportDate: new Date('2024-12-22').toISOString(),
        remarks: 'Temperature controlled transport, cold chain required'
      }
    ];
    
    console.log('📊 Creating transport enquiries...');
    const createdTransportEnquiries = [];
    
    for (const enquiry of transportEnquiries) {
      const response = await fetch('http://localhost:3001/api/transport-broker-rate-enquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify(enquiry)
      });
      
      if (response.ok) {
        const created = await response.json();
        createdTransportEnquiries.push(created);
        console.log(`✅ Created transport enquiry: ${enquiry.cargoType} (${enquiry.cargoWeight} MT)`);
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to create transport enquiry: ${enquiry.cargoType} - ${errorText}`);
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Link transport enquiries to customer enquiries
    console.log('🔗 Linking transport enquiries to customer enquiries...');
    
    const links = [
      {
        enquiryId: enquiries[0]?.id,
        transportEnquiryId: createdTransportEnquiries[0]?.id,
        notes: 'Primary transport option for electronics shipment'
      },
      {
        enquiryId: enquiries[0]?.id,
        transportEnquiryId: createdTransportEnquiries[1]?.id,
        notes: 'Alternative heavy-duty transport option'
      }
    ];
    
    // Add more links if we have more enquiries
    if (enquiries.length > 1 && createdTransportEnquiries.length > 2) {
      links.push({
        enquiryId: enquiries[1]?.id,
        transportEnquiryId: createdTransportEnquiries[2]?.id,
        notes: 'Textile goods bulk transport'
      });
    }
    
    if (enquiries.length > 2 && createdTransportEnquiries.length > 1) {
      links.push({
        enquiryId: enquiries[2]?.id,
        transportEnquiryId: createdTransportEnquiries[1]?.id,
        notes: 'Industrial machinery transport solution'
      });
    }
    
    if (enquiries.length > 3 && createdTransportEnquiries.length > 3) {
      links.push({
        enquiryId: enquiries[3]?.id,
        transportEnquiryId: createdTransportEnquiries[3]?.id,
        notes: 'Food products cold chain transport'
      });
    }
    
    for (const link of links) {
      if (link.enquiryId && link.transportEnquiryId) {
        const response = await fetch('http://localhost:3001/api/enquiry-transport-links', {
          method: 'POST',
          headers,
          body: JSON.stringify(link)
        });
        
        if (response.ok) {
          console.log(`✅ Linked customer enquiry ${link.enquiryId} to transport enquiry ${link.transportEnquiryId}`);
        } else {
          const error = await response.text();
          console.log(`❌ Failed to link enquiries: ${error}`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('');
    console.log('🎉 Done! Summary:');
    console.log(`   - Created ${createdTransportEnquiries.length} transport enquiries`);
    console.log(`   - Created ${links.filter(l => l.enquiryId && l.transportEnquiryId).length} transport enquiry links`);
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Go to http://localhost:3000/enquiries');
    console.log('   2. Click on any enquiry to view details');
    console.log('   3. Look for the "Transport Enquiries" section');
    console.log('   4. Test the "Create Transport Enquiry" button');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

addDummyData();