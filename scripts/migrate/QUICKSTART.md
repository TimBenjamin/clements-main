# Migration Quick Start Guide

## Prerequisites

1. **Environment variables configured** in `.env`:
   ```bash
   # Old MySQL Database
   OLD_DB_HOST=your-rds-endpoint.amazonaws.com
   OLD_DB_PORT=3306
   OLD_DB_NAME=clements_music
   OLD_DB_USER=readonly_user
   OLD_DB_PASSWORD=your_password

   # New PostgreSQL Database
   DATABASE_URL=postgresql://...
   ```

2. **Dependencies installed**:
   ```bash
   npm install
   ```

## Migration Workflow

### Initial Migration (One-time)

Run the full migration to import all static content and users:

```bash
npm run migrate:all
```

This will migrate:
- Study areas
- Extracts (audio files - S3 URLs need separate upload)
- Inline images (S3 URLs need separate upload)
- Questions
- DDI options
- Products
- Users (with random passwords - reset emails needed)

### Incremental Sync (Repeated until cutover)

While the old site remains live, run this periodically to sync user activity:

```bash
npm run migrate:sync
```

This syncs:
- New users
- New/updated tests
- New/updated assignments
- User progress

Can be run daily, hourly, or as needed. Safe to run multiple times.

### Verification

Check migration status:

```bash
npm run migrate:status   # Show migration log and current counts
npm run migrate:verify   # Compare old vs new database row counts
```

### Individual Table Migration

If you need to re-migrate a specific table:

```bash
npm run migrate:study-areas
npm run migrate:extracts
npm run migrate:inline-images
npm run migrate:questions
npm run migrate:ddi-options
npm run migrate:products
npm run migrate:users
```

### Rollback (DESTRUCTIVE)

If migration fails and you need to start over:

```bash
npm run migrate:rollback               # Clear all migrated data
npm run migrate:rollback -- --table=users  # Clear specific table
```

⚠️ **Warning**: Waits 5 seconds before proceeding. Press Ctrl+C to cancel.

## Cutover Process

1. **Put old site in read-only mode**
2. **Run final sync**:
   ```bash
   npm run migrate:sync
   ```
3. **Verify data integrity**:
   ```bash
   npm run migrate:verify
   ```
4. **Send password reset emails** to all users
5. **Point DNS to new site**
6. **Monitor for issues**
7. **Decommission old site** after confirmation period

## Post-Migration Tasks

- [ ] Upload audio extracts to S3 (convert Flash SWF to MP3)
- [ ] Upload custom question images to S3
- [ ] Upload inline images to S3
- [ ] Update S3 URLs in database
- [ ] Send password reset emails to all users
- [ ] Test user login flow
- [ ] Verify test taking functionality
- [ ] Verify assignment functionality
- [ ] Test org-student relationships

## Important Notes

### Password Migration

⚠️ **CRITICAL**: Old database stores passwords in **plaintext**

Migration strategy:
- Generates random password for each user
- Hashes with bcrypt
- Users MUST reset password on first login
- Send password reset emails after migration

### Media Files

Migration scripts populate legacy filenames but leave S3 URLs as `null`:
- Extract audio files (Flash SWF → MP3 conversion needed)
- Custom question images
- Inline images

Separate S3 migration required after initial data migration.

### Incremental Sync

The sync script uses timestamps to only import new/updated records:
- Checks `last_modified` and `date_created` fields
- Tracks last sync time in `migration_log` table
- Uses upsert to avoid duplicates
- Safe to run multiple times

### Data Integrity

Foreign key constraints are enforced in PostgreSQL:
- Tables must be migrated in dependency order
- Orphaned records will cause errors
- Check logs for foreign key violations
- Verify with `npm run migrate:verify`

## Troubleshooting

### Connection Errors

```
Error: connect ECONNREFUSED
```

**Solution**: Check OLD_DB_* environment variables in `.env`

### Foreign Key Violations

```
Error: Foreign key constraint fails
```

**Solution**: Run migrations in correct order (handled by `migrate:all`)

### Duplicate Key Errors

```
Error: duplicate key value violates unique constraint
```

**Solution**: Run `npm run migrate:rollback -- --table=TABLE_NAME` and retry

### Zero Dates

MySQL allows `0000-00-00 00:00:00`, PostgreSQL doesn't:

**Solution**: Scripts automatically convert zero dates to `null`

## Getting Help

- See full documentation: `scripts/migrate/README.md`
- View migration scripts: `scripts/migrate/`
- Check migration log: `npm run migrate:status`
