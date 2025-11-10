import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { quotes, orders, enquiries } from './src/db/schema/index';
import dotenv from 'dotenv';
import { eq, and, sum } from 'drizzle-orm';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function addDummyQuotes() {
  try {
    console.log('Fetching existing enquiries with orders...');
    
    // Get all enquiries that have orders
    const enquiriesWithOrders = await db
      .select({ 
        enquiryId: orders.enquiryId,
        userId: orders.userId,
        totalAmount: sum(orders.amount)
      })
      .from(orders)
      .groupBy(orders.enquiryId, orders.userId);

    if (enquiriesWithOrders.length === 0) {
      console.log('No enquiries with orders found. Please add some orders first.');
      process.exit(0);
    }
    
    console.log(`Found ${enquiriesWithOrders.length} enquiries with orders. Adding dummy quotes...`);
    
    for (const enquiryData of enquiriesWithOrders) {
      const baseAmount = parseFloat(enquiryData.totalAmount || '0');
      
      // Add 1-2 calculated quotes per enquiry
      const numCalculatedQuotes = Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < numCalculatedQuotes; i++) {
        // Random margin between 10% and 25%
        const marginPercentage = Math.floor(Math.random() * 15) + 10; // 10-24%
        const quotationAmount = baseAmount + (baseAmount * marginPercentage / 100);
        
        const statuses: Array<'pending' | 'accepted' | 'rejected'> = ['pending', 'accepted', 'rejected'];
        const status = i === 0 ? 'pending' : statuses[Math.floor(Math.random() * statuses.length)];
        
        await db.insert(quotes).values({
          userId: enquiryData.userId,
          enquiryId: enquiryData.enquiryId,
          quotationAmount: quotationAmount,
          marginPercentage: marginPercentage,
          baseAmount: baseAmount,
          isCustomAmount: false,
          costing: `Base transport cost: ₹${baseAmount.toLocaleString()}, Margin: ${marginPercentage}%, Service charges included`,
          status: status,
        });
        
        console.log(`Added calculated quote for enquiry #${enquiryData.enquiryId}: ₹${quotationAmount.toLocaleString()} (${marginPercentage}% margin, ${status})`);
      }
      
      // Add 0-1 custom quotes per enquiry (50% chance)
      if (Math.random() > 0.5) {
        // Random custom amount (could be higher or lower than calculated)
        const customAmount = Math.floor(Math.random() * 80000) + 20000; // ₹20,000 - ₹100,000
        
        const statuses: Array<'pending' | 'accepted' | 'rejected'> = ['pending', 'accepted', 'rejected'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        await db.insert(quotes).values({
          userId: enquiryData.userId,
          enquiryId: enquiryData.enquiryId,
          quotationAmount: customAmount,
          marginPercentage: null,
          baseAmount: 0,
          isCustomAmount: true,
          costing: `Custom pricing based on special requirements, market conditions, and client relationship`,
          status: status,
        });
        
        console.log(`Added custom quote for enquiry #${enquiryData.enquiryId}: ₹${customAmount.toLocaleString()} (custom, ${status})`);
      }
    }
    
    console.log('\nDummy quotes added successfully!');
    
  } catch (error) {
    console.error('Error adding dummy quotes:', error);
  } finally {
    process.exit(0);
  }
}

addDummyQuotes();