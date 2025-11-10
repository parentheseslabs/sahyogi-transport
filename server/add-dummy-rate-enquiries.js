const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://parendev:abcd1234@localhost:5432/sahyogi_transport';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function addDummyData() {
  console.log('Adding dummy transport broker rate enquiries...');

  // First, check if transport_routes table exists and create some routes
  const routes = [
    { name: 'Mumbai - Delhi Express Route' },
    { name: 'Chennai - Kolkata Coastal Route' },
    { name: 'Bangalore - Pune Highway' },
    { name: 'Gujarat - Rajasthan Corridor' }
  ];

  const routeIds = [];
  for (const route of routes) {
    try {
      // First try to find existing route
      const existing = await sql`
        SELECT id FROM transport_routes WHERE name = ${route.name} LIMIT 1
      `;
      
      if (existing.length > 0) {
        routeIds.push(existing[0].id);
        console.log(`✅ Found existing route: ${route.name} (ID: ${existing[0].id})`);
      } else {
        // Create new route
        const result = await sql`
          INSERT INTO transport_routes (name, created_at, updated_at)
          VALUES (${route.name}, NOW(), NOW())
          RETURNING id
        `;
        routeIds.push(result[0].id);
        console.log(`✅ Created route: ${route.name} (ID: ${result[0].id})`);
      }
    } catch (error) {
      console.error(`❌ Error with route ${route.name}:`, error.message);
      // If routes table doesn't exist, just use dummy IDs
      routeIds.push(routes.indexOf(route) + 1);
    }
  }

  // Now add dummy rate enquiries
  const dummyRateEnquiries = [
    {
      route_id: routeIds[0] || 1,
      cargo_type: 'Electronics & IT Equipment',
      cargo_weight: 8.5,
      transport_date: '2024-01-15T00:00:00Z',
      remarks: 'Fragile items, need GPS tracking and insurance'
    },
    {
      route_id: routeIds[1] || 2,
      cargo_type: 'Textile & Garments',
      cargo_weight: 15.0,
      transport_date: '2024-01-18T00:00:00Z',
      remarks: 'Bulk shipment, weather protection required'
    },
    {
      route_id: routeIds[2] || 3,
      cargo_type: 'Automobile Spare Parts',
      cargo_weight: 12.5,
      transport_date: '2024-01-20T00:00:00Z',
      remarks: 'Multiple pickup points in Bangalore industrial area'
    },
    {
      route_id: routeIds[3] || 4,
      cargo_type: 'FMCG & Food Products',
      cargo_weight: 20.0,
      transport_date: '2024-01-22T00:00:00Z',
      remarks: 'Temperature controlled transport required, max 25°C'
    },
    {
      route_id: routeIds[0] || 1,
      cargo_type: 'Heavy Industrial Machinery',
      cargo_weight: 35.0,
      transport_date: '2024-01-25T00:00:00Z',
      remarks: 'ODC cargo, special permits required, crane loading needed'
    },
    {
      route_id: routeIds[1] || 2,
      cargo_type: 'Chemical Products (Non-Hazardous)',
      cargo_weight: 18.5,
      transport_date: '2024-01-28T00:00:00Z',
      remarks: 'Proper documentation and safety equipment mandatory'
    },
    {
      route_id: routeIds[2] || 3,
      cargo_type: 'Construction Materials',
      cargo_weight: 40.0,
      transport_date: '2024-02-01T00:00:00Z',
      remarks: 'Cement bags and steel rods, tarpaulin cover required'
    },
    {
      route_id: routeIds[3] || 4,
      cargo_type: 'Pharmaceutical Products',
      cargo_weight: 5.5,
      transport_date: '2024-02-05T00:00:00Z',
      remarks: 'Cold chain maintenance critical, 2-8°C temperature range'
    },
    {
      route_id: routeIds[0] || 1,
      cargo_type: 'Furniture & Home Decor',
      cargo_weight: 10.0,
      transport_date: '2024-02-08T00:00:00Z',
      remarks: 'Fragile wooden furniture, bubble wrap packing done'
    },
    {
      route_id: routeIds[1] || 2,
      cargo_type: 'Agricultural Produce',
      cargo_weight: 25.0,
      transport_date: '2024-02-10T00:00:00Z',
      remarks: 'Fresh vegetables, quick transit time essential'
    }
  ];

  for (const enquiry of dummyRateEnquiries) {
    try {
      const result = await sql`
        INSERT INTO transport_broker_rate_enquiries (route_id, cargo_type, cargo_weight, transport_date, remarks, created_at, updated_at)
        VALUES (${enquiry.route_id}, ${enquiry.cargo_type}, ${enquiry.cargo_weight}, ${enquiry.transport_date}, ${enquiry.remarks}, NOW(), NOW())
        RETURNING id
      `;
      console.log(`✅ Added rate enquiry: ${enquiry.cargo_type} (${enquiry.cargo_weight} MT) - ID: ${result[0].id}`);
    } catch (error) {
      console.error(`❌ Error adding rate enquiry ${enquiry.cargo_type}:`, error.message);
    }
  }

  console.log('\n🎉 Done! Check your transport broker rate enquiries page to see the new data.');
  await sql.end();
}

addDummyData().catch(console.error);