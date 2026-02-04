# Migration Notes: MySQL to PostgreSQL

## Schema Improvements Over Legacy System

### 1. **Foreign Key Constraints** ✅

**Legacy**: No FK constraints, relationships enforced only in application code

**New**: All relationships have proper foreign keys with cascade rules

```prisma
model User {
  tests Test[]
}

model Test {
  userId Int
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Benefits:
- Referential integrity enforced at database level
- Cascading deletes prevent orphaned records
- Better query optimization
- Clear relationship documentation

### 2. **Password Security** ✅

**Legacy**: Plaintext passwords stored in `varchar(255)`

**New**: bcrypt hashed passwords (60 characters)

```typescript
import bcrypt from 'bcrypt'

// Hash on registration
const hashedPassword = await bcrypt.hash(password, 10)

// Verify on login
const isValid = await bcrypt.compare(password, user.password)
```

**Migration Strategy**:
- Cannot migrate plaintext passwords
- Options:
  1. Force password reset for all users (recommended)
  2. Send temporary passwords via email
  3. Implement magic link authentication for first login

### 3. **Modern Data Types** ✅

| Legacy MySQL | New PostgreSQL | Reason |
|--------------|----------------|--------|
| `enum('1','0')` | `Boolean` | Type safety |
| `float(10,2)` | `Float @db.DoublePrecision` | Precision |
| `timestamp` | `DateTime @updatedAt` | Auto-update |
| `int` default value strings | Proper integers | Type consistency |

### 4. **S3 Media URLs** ✅

**Legacy**: Filenames stored, files on local disk

**New**: S3 URLs stored in database

```prisma
model Question {
  // LEGACY (keep for migration)
  mcqOption1Img   String? @db.VarChar(255)
  mcqOption1ImgId Int     @default(-1)

  // NEW
  mcqOption1S3Url String? @db.VarChar(500)
}
```

Migration script:
```typescript
// Upload to S3 and update URLs
for (const question of questions) {
  if (question.mcqOption1Img) {
    const s3Url = await uploadToS3(
      `old/docroot/img/questions/mcq/${question.mcqOption1Img}`,
      `questions/mcq/${question.id}_1.png`
    )

    await prisma.question.update({
      where: { id: question.id },
      data: { mcqOption1S3Url: s3Url }
    })
  }
}
```

### 5. **Stripe Integration** ✅

**Legacy**: PayPal only (incomplete webhook handling)

**New**: Stripe-first with PayPal fields preserved for history

```prisma
model User {
  // NEW: Stripe
  stripeCustomerId      String?
  stripeSubscriptionId  String?

  // LEGACY: Preserve for historical data
  // (removed from model, kept in notes)
}

model Transaction {
  // NEW: Stripe
  stripePaymentIntentId String?
  stripeInvoiceId       String?

  // LEGACY: PayPal (historical)
  paypalTransactionId   String?
  paypalPaymentStatus   String?
}
```

### 6. **Indexes** ✅

**Legacy**: Minimal indexing

**New**: Comprehensive indexes on:
- Foreign keys
- Frequently filtered columns
- Search columns

```prisma
model User {
  email String

  @@index([email])
  @@index([type])
  @@index([expiry])
  @@index([sessionId])
}
```

### 7. **Consistent Naming** ✅

**Legacy**: Inconsistent (snake_case, camelCase mix)

**New**:
- Database columns: `snake_case` (via `@map`)
- Prisma fields: `camelCase`
- Best of both worlds

```prisma
model User {
  firstName String @map("first_name") // DB: first_name, Code: firstName
}
```

### 8. **Auto-Timestamps** ✅

**Legacy**: Manual `last_modified` timestamp updates

**New**: Automatic via `@updatedAt`

```prisma
model User {
  dateCreated  DateTime @default(now())
  lastModified DateTime @updatedAt // Auto-updates on every save
}
```

## Migration Challenges

### Critical Issues

#### 1. **Password Reset Required** 🔴

**Problem**: Cannot migrate plaintext passwords to hashed

**Solution**:
```typescript
// 1. Create password reset tokens for all users
const users = await prisma.user.findMany()

for (const user of users) {
  const token = generateSecureToken()

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  })

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Required - System Upgrade',
    body: `We've upgraded our security. Please reset your password:
           ${APP_URL}/reset-password?token=${token}`
  })
}
```

#### 2. **Flash Audio Conversion** 🟡

**Problem**: 46 SWF files need conversion to MP3

**Solution**:
```bash
# Using ffmpeg
for file in old/docroot/swf/*.swf; do
  basename=$(basename "$file" .swf)
  ffmpeg -i "$file" -vn -acodec libmp3lame -q:a 2 "converted/${basename}.mp3"
done

# Upload to S3
aws s3 sync ./converted/ s3://your-bucket/audio/extracts/ --acl private

# Update database
UPDATE extracts
SET audio_s3_url = CONCAT('https://bucket.s3.region.amazonaws.com/audio/extracts/', id, '.mp3'),
    audio_s3_key = CONCAT('audio/extracts/', id, '.mp3')
```

Alternative: Check if source audio files exist before conversion

#### 3. **Image Migration** 🟡

**Problem**: ~3,795 images to upload to S3

**Solution**:
```typescript
// scripts/migrate-images.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs/promises'
import path from 'path'

const s3 = new S3Client({ region: process.env.AWS_REGION })

async function migrateImages() {
  const images = await prisma.inlineImage.findMany()

  for (const image of images) {
    const localPath = path.join('old/docroot/img/questions/inline', image.filename)

    try {
      const fileBuffer = await fs.readFile(localPath)
      const s3Key = `questions/inline/${image.id}_${image.filename}`

      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: getContentType(image.filename),
        CacheControl: 'public, max-age=31536000, immutable'
      }))

      const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

      await prisma.inlineImage.update({
        where: { id: image.id },
        data: { s3Url, s3Key }
      })

      console.log(`✓ Migrated ${image.filename}`)
    } catch (error) {
      console.error(`✗ Failed to migrate ${image.filename}:`, error)
    }
  }
}
```

#### 4. **Study Guides to Contentful** 🟡

**Problem**: 90 XSL files to convert to Contentful rich text

**Solution**:
```typescript
// scripts/migrate-study-guides.ts
import { createClient } from 'contentful-management'
import { parseXSL } from './xsl-parser' // Custom parser

const client = createClient({ accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN })
const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID)
const environment = await space.getEnvironment('master')

async function migrateStudyGuides() {
  const xslFiles = await fs.readdir('old/xsl/study-guides')

  for (const filename of xslFiles) {
    const xslContent = await fs.readFile(`old/xsl/study-guides/${filename}`, 'utf-8')
    const parsed = parseXSL(xslContent) // Convert XSL to rich text

    const entry = await environment.createEntry('studyGuide', {
      fields: {
        slug: { 'en-US': parsed.slug },
        title: { 'en-US': parsed.title },
        content: { 'en-US': parsed.richTextContent },
        studyAreaId: { 'en-US': parsed.studyAreaId },
        grade: { 'en-US': parsed.grade },
        metaDescription: { 'en-US': parsed.metaDescription }
      }
    })

    await entry.publish()
    console.log(`✓ Migrated ${filename}`)
  }
}
```

### Data Integrity Checks

Before migration, verify:

```sql
-- Check for orphaned records (without FKs in old system)
SELECT * FROM tests WHERE user_id NOT IN (SELECT id FROM users);
SELECT * FROM questions WHERE study_area_id NOT IN (SELECT id FROM study_areas);
SELECT * FROM org_stu_users WHERE org_user_id NOT IN (SELECT id FROM users);

-- Check for invalid data
SELECT * FROM users WHERE email NOT LIKE '%@%';
SELECT * FROM users WHERE displayname IS NULL OR displayname = '';
SELECT * FROM questions WHERE difficulty < 1 OR difficulty > 5;
```

### Migration Order

1. **Setup**:
   - Create Neon database
   - Run Prisma migrations
   - Set up S3 bucket

2. **Static Data** (no dependencies):
   - study_areas
   - products
   - musical_terms

3. **Users**:
   - Migrate users (with placeholder passwords)
   - Generate password reset tokens
   - Send reset emails

4. **Media**:
   - Upload images to S3
   - Convert and upload audio
   - Update database with S3 URLs

5. **Content**:
   - Migrate study guides to Contentful
   - Migrate questions (after images uploaded)
   - Migrate inline_images, extracts

6. **Organizations**:
   - org_groups
   - org_stu_users
   - org_stu_groups

7. **Tests & Progress**:
   - tests
   - users_questions
   - assignments
   - users_assignments
   - progress_data

8. **Commerce**:
   - transactions
   - transaction_items
   - vouchers
   - voucher_usage

9. **Verification**:
   - Run integrity checks
   - Spot-check user accounts
   - Test login flow
   - Test question loading

## Rollback Strategy

1. **Keep old database running** until migration verified
2. **Maintain parallel systems** for 1-2 weeks
3. **Export pre-migration backups**:
   ```bash
   pg_dump $DATABASE_URL > pre-migration-backup.sql
   ```
4. **Keep legacy file systems** until S3 migration verified

## Post-Migration Cleanup

After successful migration (30+ days):

1. **Remove legacy columns**:
   ```prisma
   // Remove from schema.prisma:
   // - questions.mcqOption*Img
   // - questions.mcqOption*ImgId
   // - inlineImages.filename
   // - extracts.filename
   ```

2. **Create migration**:
   ```bash
   npx prisma migrate dev --name remove_legacy_columns
   ```

3. **Archive old files**:
   - Compress old/docroot/img/
   - Store in S3 Glacier or delete

4. **Decommission old database**

## Testing Checklist

Before go-live:

- [ ] User registration with password hashing
- [ ] User login with bcrypt verification
- [ ] Password reset flow
- [ ] Question loading with S3 images
- [ ] Audio player with S3 MP3s
- [ ] Test generation (random question selection)
- [ ] Test completion and scoring
- [ ] Assignment creation and distribution
- [ ] Progress tracking updates
- [ ] Organization student management
- [ ] Student group creation
- [ ] Stripe subscription creation
- [ ] Stripe webhook handling
- [ ] Voucher code application
- [ ] Study guide rendering from Contentful

## Estimated Migration Timeline

- **Setup & Testing**: 1 week
- **User Data Migration**: 2 days
- **Media Migration**: 3-5 days (parallelizable)
- **Content Migration**: 2-3 days
- **Testing & Verification**: 1 week
- **Parallel Running**: 1-2 weeks
- **Total**: 4-6 weeks

## Resources

- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Data Migration Guide](https://www.prisma.io/docs/guides/migrate/seed-database)
- [PostgreSQL vs MySQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
