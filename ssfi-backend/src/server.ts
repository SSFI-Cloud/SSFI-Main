/**
 * Server Entry Point
 * Loads environment variables FIRST before any other module
 * This ensures DATABASE_URL and other env vars are available to Prisma
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// MUST be first - load env vars before any other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config(); // Fallback

// Now import and start the app
import './app';
