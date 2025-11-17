import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requestLogger, fileLogger } from './middleware/logger';
import leadsRouter from './routes/leads';
import brokersRouter from './routes/brokers';
import authRouter from './routes/auth';
import enquiriesRouter from './routes/enquiries';
import quotesRouter from './routes/quotes';
import transportRoutesRouter from './routes/transportRoutes';
import transportBrokerRateEnquiriesRouter from './routes/transportBrokerRateEnquiries';
import transportRateBidsRouter from './routes/transportRateBids';
import transportOrdersRouter from './routes/transportOrders';
import customerOrdersRouter from './routes/customerOrders';
import enquiryTransportLinksRouter from './routes/enquiryTransportLinks';
import dashboardRouter from './routes/dashboard';
import biddingRouter from './routes/bidding';
import { setupGupshup } from './util/gupshup';
import { gupshup_v3_msg_webhook } from './webhooks/gupshup_incoming_msg_webhook';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply request logger middleware
app.use(requestLogger);

// Optional: Also enable file logging
if (process.env.ENABLE_FILE_LOGGING === 'true') {
  app.use(fileLogger('logs'));
}

// Routes
app.use('/api/auth', authRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/enquiries', enquiriesRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/transport-routes', transportRoutesRouter);
app.use('/api/transport-broker-rate-enquiries', transportBrokerRateEnquiriesRouter);
app.use('/api/transport-rate-bids', transportRateBidsRouter);
app.use('/api/transport-orders', transportOrdersRouter);
app.use('/api/customer-orders', customerOrdersRouter);
app.use('/api/enquiry-transport-links', enquiryTransportLinksRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/bidding', biddingRouter);

// Webhooks
app.post('/api/webhooks/gupshup_incoming_msg_webhook', gupshup_v3_msg_webhook);
// Flow responses are now handled in the main incoming message webhook

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  await setupGupshup();
});