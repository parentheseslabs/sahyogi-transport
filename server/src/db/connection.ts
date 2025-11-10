import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema';

// Ensure environment variables are loaded
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/sahyogi_transport';

console.log('Connecting to database:', connectionString.replace(/:[^:@]*@/, ':****@')); // Log connection string without password

const client = postgres(connectionString);
export const db = drizzle(client, { schema });