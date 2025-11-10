const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { quotes, orders, enquiries } = require('./src/db/schema/index.js');
const dotenv = require('dotenv');
const { eq } = require('drizzle-orm');

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function addDummyData() {
  try {
    console.log('Fetching existing enquiries...');
    
    // Get all enquiries
    const allEnquiries = await db.select().from(enquiries).limit(10);
    
    if (allEnquiries.length === 0) {
      console.log('No enquiries found. Please create some enquiries first.');
      process.exit(0);
    }
    
    console.log(`Found ${allEnquiries.length} enquiries. Adding dummy quotes and orders...`);
    
    for (const enquiry of allEnquiries) {
      // Add 2-3 quotes per enquiry
      const numQuotes = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numQuotes; i++) {
        const baseAmount = Math.floor(Math.random() * 50000) + 10000;
        const quotationAmount = baseAmount + (i * 5000); // Each subsequent quote is slightly higher
        
        const statuses = ['pending', 'accepted', 'rejected'];
        const status = i === 0 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
        
        await db.insert(quotes).values({
          userId: enquiry.userId,
          enquiryId: enquiry.id,
          quotationAmount: quotationAmount,
          costing: `Base rate: ₹${baseAmount}, GST: 18%, Service charge: ₹${i * 1000}`,
          status: status,
        });
        
        console.log(`Added quote for enquiry #${enquiry.id}: ₹${quotationAmount} (${status})`);
      }
      
      // Add 1-2 orders per enquiry (50% chance)
      if (Math.random() > 0.5) {
        const numOrders = Math.floor(Math.random() * 2) + 1;
        
        const brokerNames = [
          'Sharma Transport Co.',
          'Gupta Logistics',
          'Patel Carriers',
          'Kumar Freight Services',
          'Singh Trucking',
          'Verma Transport Solutions',
          'Reddy Logistics Hub',
          'Yadav Carriers'
        ];
        
        for (let i = 0; i < numOrders; i++) {
          const brokerName = brokerNames[Math.floor(Math.random() * brokerNames.length)];
          const route = `${enquiry.from} to ${enquiry.to}`;
          const amount = Math.floor(Math.random() * 40000) + 8000;
          
          await db.insert(orders).values({
            userId: enquiry.userId,
            enquiryId: enquiry.id,
            brokerName: brokerName,
            route: route,
            amount: amount,
          });
          
          console.log(`Added order for enquiry #${enquiry.id}: ${brokerName} - ₹${amount}`);
        }
      }
    }
    
    console.log('\nDummy data added successfully!');
    
  } catch (error) {
    console.error('Error adding dummy data:', error);
  } finally {
    process.exit(0);
  }
}

addDummyData();