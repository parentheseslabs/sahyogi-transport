const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');

// Database connection
const connectionString = 'postgresql://postgres:password@localhost:5432/sahyogi_transport';
const sql = postgres(connectionString);
const db = drizzle(sql);

async function createLinks() {
  try {
    console.log('🔗 Creating transport enquiry links directly in database...');
    
    // Insert links directly
    const links = [
      {
        user_id: 1,
        enquiry_id: 3,
        transport_enquiry_id: 22,
        notes: 'Electronics transport option for industrial machinery enquiry',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 1,
        enquiry_id: 3,
        transport_enquiry_id: 23,
        notes: 'Heavy machinery transport with crane support',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 1,
        enquiry_id: 4,
        transport_enquiry_id: 24,
        notes: 'Food products cold chain transport',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        user_id: 1,
        enquiry_id: 5,
        transport_enquiry_id: 25,
        notes: 'Automobile parts consolidation and transport',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    for (const link of links) {
      try {
        await sql`
          INSERT INTO enquiry_transport_links (user_id, enquiry_id, transport_enquiry_id, notes, created_at, updated_at)
          VALUES (${link.user_id}, ${link.enquiry_id}, ${link.transport_enquiry_id}, ${link.notes}, ${link.created_at}, ${link.updated_at})
        `;
        console.log(`✅ Created link: Enquiry ${link.enquiry_id} → Transport ${link.transport_enquiry_id}`);
      } catch (err) {
        console.log(`❌ Failed to create link for enquiry ${link.enquiry_id}: ${err.message}`);
      }
    }
    
    console.log('');
    console.log('🎉 Done! Links created successfully.');
    console.log('📝 Now go to http://localhost:3000/enquiries/3 to see the transport enquiries!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

createLinks();