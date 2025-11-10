import { Router } from 'express';
import { eq, and, or, like, gte, lte, count, desc, asc, sum } from 'drizzle-orm';
import { db } from '../db/connection';
import { quotes, enquiries, leads, orders } from '../db/schema';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/quotes/base-amount/:enquiryId - Get base amount for quote calculation
router.get('/base-amount/:enquiryId', async (req, res) => {
  try {
    const enquiryId = parseInt(req.params.enquiryId);
    
    const ordersResult = await db
      .select({ totalAmount: sum(orders.amount) })
      .from(orders)
      .where(and(eq(orders.enquiryId, enquiryId), eq(orders.userId, req.user!.userId)));

    const baseAmount = parseFloat(ordersResult[0]?.totalAmount || '0');
    
    res.json({ baseAmount });
  } catch (error) {
    console.error('Error calculating base amount:', error);
    res.status(500).json({ error: 'Failed to calculate base amount' });
  }
});

// GET /api/quotes - Get quotes with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      status,
      enquiryId,
      fromDate,
      toDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where conditions
    const conditions = [];

    // Filter by userId from authenticated user
    conditions.push(eq(quotes.userId, req.user!.userId));

    if (status) {
      conditions.push(eq(quotes.status, status as string));
    }

    if (enquiryId) {
      conditions.push(eq(quotes.enquiryId, parseInt(enquiryId as string)));
    }

    if (fromDate) {
      conditions.push(gte(quotes.createdAt, new Date(fromDate as string)));
    }

    if (toDate) {
      conditions.push(lte(quotes.createdAt, new Date(toDate as string)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(quotes)
      .where(whereClause);

    const total = totalResult.count;

    // Get quotes with pagination
    const sortColumn = sortBy === 'status' ? quotes.status :
                       sortBy === 'quotationAmount' ? quotes.quotationAmount :
                       quotes.createdAt;

    const orderFn = sortOrder === 'asc' ? asc : desc;

    const quotesResult = await db
      .select({
        quote: quotes,
        enquiry: enquiries,
        lead: leads
      })
      .from(quotes)
      .leftJoin(enquiries, eq(quotes.enquiryId, enquiries.id))
      .leftJoin(leads, eq(enquiries.leadId, leads.id))
      .where(whereClause)
      .orderBy(orderFn(sortColumn))
      .limit(limitNum)
      .offset(offset);

    // Transform to flat structure
    const formattedQuotes = quotesResult.map(row => ({
      ...row.quote,
      enquiryFrom: row.enquiry?.from || null,
      enquiryTo: row.enquiry?.to || null,
      leadName: row.lead?.name || null
    }));

    res.json({
      quotes: formattedQuotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// GET /api/quotes/:id - Get single quote
router.get('/:id', async (req, res) => {
  try {
    const quoteId = parseInt(req.params.id);
    const quote = await db.select().from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, req.user!.userId)))
      .limit(1);

    if (quote.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(quote[0]);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

// POST /api/quotes - Create new quote
router.post('/', async (req, res) => {
  try {
    const {
      enquiryId,
      costing,
      marginPercentage,
      customAmount,
      isCustomAmount,
      status
    } = req.body;

    // Basic validation
    if (!enquiryId) {
      return res.status(400).json({ error: 'Enquiry ID is required' });
    }

    let quotationAmount: number;
    let baseAmount: number;
    let margin: number | null = null;

    if (isCustomAmount) {
      // Custom amount provided
      if (!customAmount) {
        return res.status(400).json({ error: 'Custom amount is required when using custom pricing' });
      }
      quotationAmount = parseFloat(customAmount);
      baseAmount = 0; // Set to 0 for custom amounts
    } else {
      // Calculate from transport orders and margin
      if (marginPercentage === undefined) {
        return res.status(400).json({ error: 'Margin percentage is required for calculated quotes' });
      }

      // Calculate base amount from all transport orders for this enquiry
      const ordersResult = await db
        .select({ totalAmount: sum(orders.amount) })
        .from(orders)
        .where(and(eq(orders.enquiryId, parseInt(enquiryId)), eq(orders.userId, req.user!.userId)));

      baseAmount = parseFloat(ordersResult[0]?.totalAmount || '0');
      
      if (baseAmount === 0) {
        return res.status(400).json({ 
          error: 'Cannot create quote: No transport orders found for this enquiry. Please add transport orders first.' 
        });
      }

      // Calculate quotation amount with margin
      margin = parseFloat(marginPercentage);
      quotationAmount = baseAmount + (baseAmount * margin / 100);
    }

    const newQuote = await db.insert(quotes).values({
      userId: req.user!.userId,
      enquiryId: parseInt(enquiryId),
      costing,
      quotationAmount: quotationAmount,
      marginPercentage: margin,
      baseAmount: baseAmount,
      isCustomAmount: !!isCustomAmount,
      status: status || 'pending'
    }).returning();

    res.status(201).json(newQuote[0]);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ error: 'Failed to create quote' });
  }
});

// PUT /api/quotes/:id - Update quote
router.put('/:id', async (req, res) => {
  try {
    const quoteId = parseInt(req.params.id);
    const {
      enquiryId,
      costing,
      marginPercentage,
      customAmount,
      isCustomAmount,
      status
    } = req.body;

    // Basic validation
    if (!enquiryId) {
      return res.status(400).json({ error: 'Enquiry ID is required' });
    }

    let quotationAmount: number;
    let baseAmount: number;
    let margin: number | null = null;

    if (isCustomAmount) {
      // Custom amount provided
      if (!customAmount) {
        return res.status(400).json({ error: 'Custom amount is required when using custom pricing' });
      }
      quotationAmount = parseFloat(customAmount);
      baseAmount = 0; // Set to 0 for custom amounts
    } else {
      // Calculate from transport orders and margin
      if (marginPercentage === undefined) {
        return res.status(400).json({ error: 'Margin percentage is required for calculated quotes' });
      }

      // Calculate base amount from all transport orders for this enquiry
      const ordersResult = await db
        .select({ totalAmount: sum(orders.amount) })
        .from(orders)
        .where(and(eq(orders.enquiryId, parseInt(enquiryId)), eq(orders.userId, req.user!.userId)));

      baseAmount = parseFloat(ordersResult[0]?.totalAmount || '0');
      
      if (baseAmount === 0) {
        return res.status(400).json({ 
          error: 'Cannot update quote: No transport orders found for this enquiry. Please add transport orders first.' 
        });
      }

      // Calculate quotation amount with margin
      margin = parseFloat(marginPercentage);
      quotationAmount = baseAmount + (baseAmount * margin / 100);
    }

    const updatedQuote = await db.update(quotes)
      .set({
        enquiryId: parseInt(enquiryId),
        costing,
        quotationAmount: quotationAmount,
        marginPercentage: margin,
        baseAmount: baseAmount,
        isCustomAmount: !!isCustomAmount,
        status,
        updatedAt: new Date()
      })
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, req.user!.userId)))
      .returning();

    if (updatedQuote.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(updatedQuote[0]);
  } catch (error) {
    console.error('Error updating quote:', error);
    res.status(500).json({ error: 'Failed to update quote' });
  }
});

// DELETE /api/quotes/:id - Delete quote
router.delete('/:id', async (req, res) => {
  try {
    const quoteId = parseInt(req.params.id);
    const deletedQuote = await db.delete(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, req.user!.userId)))
      .returning();

    if (deletedQuote.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ error: 'Failed to delete quote' });
  }
});

export default router;
