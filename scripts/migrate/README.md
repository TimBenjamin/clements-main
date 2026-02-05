# Data Migration Scripts

This directory contains scripts to migrate data from the legacy MySQL database to the new PostgreSQL database.

## Overview

The migration happens in two phases:

### Phase 1: Initial Bulk Migration (One-time)
Imports all historical data from the old system:
- Questions and question bank content
- Study areas and topics
- Historical user data
- Historical test/assignment data
- Transactions and subscriptions

### Phase 2: Incremental Sync (Repeated until cutover)
Keeps user activity synchronized while old site remains live:
- New user registrations
- Test attempts and progress
- New assignments
- Updated subscriptions
- Session data

## Prerequisites

1. Access to old MySQL database
2. Connection details in `.env`:
   ```
   # Old MySQL Database (read-only recommended)
   OLD_DB_HOST=your-rds-endpoint.amazonaws.com
   OLD_DB_PORT=3306
   OLD_DB_NAME=clements_music
   OLD_DB_USER=readonly_user
   OLD_DB_PASSWORD=your_password

   # New Postgres Database (already configured)
   DATABASE_URL=postgresql://...
   ```

3. Install dependencies:
   ```bash
   npm install mysql2
   ```

## Usage

### Initial Migration

Run once to import all static content and historical data:

```bash
# 1. Migrate static content (questions, study areas)
npm run migrate:static

# 2. Migrate historical user data
npm run migrate:users

# 3. Migrate historical activity (tests, progress)
npm run migrate:activity

# 4. Verify migration
npm run migrate:verify
```

### Incremental Sync

Run periodically (e.g., daily) until cutover:

```bash
# Sync all dynamic data since last sync
npm run migrate:sync

# Or sync specific tables
npm run migrate:sync -- --table=users
npm run migrate:sync -- --table=tests
```

The sync script:
- Only imports new/updated records (based on timestamps)
- Uses upserts to avoid duplicates
- Tracks last sync time in `migration_state` table
- Can be run multiple times safely

### Cutover Process

1. Put old site in read-only mode
2. Run final sync:
   ```bash
   npm run migrate:sync -- --final
   ```
3. Verify data integrity:
   ```bash
   npm run migrate:verify
   ```
4. Point DNS to new site
5. Decommission old site

## Migration Order

Critical: Tables must be migrated in dependency order to satisfy foreign keys.

**Phase 1 - Static Content:**
1. `study_areas` (no dependencies)
2. `extracts` (no dependencies)
3. `inline_images` (no dependencies)
4. `questions` (depends on study_areas, extracts)
5. `ddi_options` (depends on questions)
6. `products` (no dependencies)

**Phase 2 - User Data:**
1. `users` (no dependencies)
2. `user_sessions` (depends on users)
3. `org_stu_users` (depends on users)
4. `org_groups` (depends on users)

**Phase 3 - Activity:**
1. `assignments` (depends on users)
2. `tests` (depends on users, assignments)
3. `users_questions` (depends on users, questions, tests)
4. `users_assignments` (depends on users, assignments, tests)
5. `progress_data` (depends on users)

**Phase 4 - Commerce:**
1. `vouchers` (depends on users)
2. `transactions` (depends on users)
3. `transaction_items` (depends on transactions, products)
4. `cart_items` (depends on users, products)

## Data Transformations

### Password Migration
⚠️ **CRITICAL**: Passwords are stored in plaintext in old database.

Strategy:
- Cannot migrate plaintext passwords to bcrypt
- Options:
  1. Generate random passwords + force reset on first login
  2. Send "complete registration" emails with password setup links
  3. Hash plaintext passwords (insecure, but allows login)

Chosen: **Option 1** - Random passwords + force reset email

### Date Handling
- Old DB: MySQL datetime
- New DB: PostgreSQL timestamp
- Script handles timezone conversion

### User Types
- Old: `type` enum('ind','org','stu','admin')
- New: Same enum (no transformation needed)

### Study Areas
- Old: Numeric IDs
- New: Keep same IDs for compatibility
- Map old IDs to new IDs in migration

## Monitoring

The migration creates a `migration_log` table to track:
- Which tables have been migrated
- Row counts (old vs new)
- Last sync timestamp per table
- Any errors encountered

View migration status:
```bash
npm run migrate:status   # Show what has been migrated and current counts
npm run migrate:verify   # Compare old vs new database counts
```

## Rollback

If migration fails:
```bash
# Clear all migrated data (DESTRUCTIVE - waits 5 seconds before proceeding)
npm run migrate:rollback

# Clear specific table (DESTRUCTIVE - waits 5 seconds before proceeding)
npm run migrate:rollback -- --table=users
```

⚠️ **Warning**: Rollback is destructive and cannot be undone. The script will wait 5 seconds before proceeding to give you time to cancel with Ctrl+C.

## Testing

Test migrations on a copy of production data:
```bash
# Use test database
DATABASE_URL=postgresql://test npm run migrate:static
```
