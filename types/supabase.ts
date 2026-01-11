/**
 * Supabase Type Re-exports
 *
 * This file re-exports the Database types for use with Supabase clients.
 * The actual type definitions are in database.ts
 *
 * NOTE: After running migrations, regenerate types with:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
 */

export type { Database } from './database';
export * from './database';
