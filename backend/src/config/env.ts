// backend/src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Cascade-load environment files in priority order:
// 1. .env.local (local private overrides)
// 2. .env (standard package env)
// 3. ../.env & ../../.env (monorepo root unified env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_DEFAULT_MODEL: process.env.GEMINI_DEFAULT_MODEL || 'gemini-2.5-flash',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  HITL_DEFAULT_THRESHOLD: parseFloat(process.env.HITL_DEFAULT_THRESHOLD || '0.85'),
};
