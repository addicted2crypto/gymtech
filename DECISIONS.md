# GymSaaS - Architectural Decisions & Context

This file documents key decisions to maintain context across development sessions.

---

## Middleware / Routing

**Decision**: Use `proxy.ts` instead of `middleware.ts`

**Date**: January 2026

**Reason**: Previous middleware validation issues. Next.js configuration expects `proxy.ts` for routing logic. Do NOT create a `middleware.ts` file - it will conflict.

**Important**: The function inside `proxy.ts` must still be named `middleware` (not `proxy`) for Next.js to call it. Only the filename is different.

**Location**: `/proxy.ts` contains all:
- Custom domain routing (gym subdomains)
- Supabase session handling
- Role-based route protection (super_admin, owner, member)
- Auth redirect logic

---

## Type Synchronization

**Issue**: TypeScript types in `types/database.ts` can get out of sync with Supabase schema after migrations.

**Solution Options**:
1. Auto-generate types with `npx supabase gen types typescript`
2. Manually update `types/database.ts` after each migration
3. Pre-commit hook to validate types

**Current Approach**: Manual updates (user will decide on automation)

---

## Database Schema

### Multi-Gym Ownership (Migration 011)
- `gym_owners` junction table enables enterprise users to own multiple gyms
- `is_primary` flag determines default gym on login
- Falls back to `profiles.gym_id` for single-gym users
- Enterprise tier `multi_location` feature flag controls this

### Tier System (Migration 004)
- `starter`: 100 members, basic features
- `pro`: 500 members, landing pages, custom domains, SMS
- `enterprise`: Unlimited, multi-location, white-label, API access

---

## Git Workflow

**User handles all git operations manually** - Do not auto-commit or push.

---

## Demo/Test Data Policy

**User preference**: No hardcoded fake data in dashboards. All data should come from Supabase. Test data is created via the Testing page (`/super-admin/testing`) and can be deleted after testing.

---

## Key Files

| File | Purpose |
|------|---------|
| `proxy.ts` | Middleware/routing (NOT middleware.ts!) |
| `stores/authStore.ts` | Client-side auth state, impersonation, multi-gym |
| `types/database.ts` | TypeScript types for Supabase tables |
| `app/(dashboard)/layout.tsx` | Dashboard shell, gym selector, nav |
| `supabase/migrations/` | Database schema changes |

---

## Common Gotchas

1. **Don't create middleware.ts** - Use proxy.ts only
2. **Update types/database.ts** after new migrations
3. **Demo gym in layout.tsx** needs all Gym fields (tier, is_trial, etc.)
4. **RLS policies** - Super admin needs full access policies on new tables
5. **Impersonation mode** - Use `getEffectiveGymId()` from authStore, not `gym?.id` directly (gym object is null during impersonation)

---

## Database Migration Guidelines

**Before creating new migrations**:

1. **Check existing migrations first** - Search all files in `supabase/migrations/` for existing policies/tables before adding new ones
2. **Check live database** - Verify what policies actually exist in Supabase dashboard
3. **RLS INSERT policies** - Must use `WITH CHECK`, not `USING` (common mistake)
4. **RLS UPDATE/DELETE policies** - Use `USING` clause
5. **Test with impersonation** - Always test owner flows while impersonating to catch auth issues early

**Policy naming convention**: `"Role can action table"` (e.g., "Gym owners can insert classes")
