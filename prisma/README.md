# Prisma Database Schema

This directory contains the Prisma schema for the music theory e-learning platform.

## Installation

```bash
npm install prisma @prisma/client
npm install -D prisma
```

## Environment Setup

Create a `.env` file in the project root:

```env
# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"

# AWS S3 Configuration
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="eu-west-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Contentful Configuration
CONTENTFUL_SPACE_ID="your-space-id"
CONTENTFUL_ACCESS_TOKEN="your-access-token"
CONTENTFUL_PREVIEW_TOKEN="your-preview-token"
CONTENTFUL_MANAGEMENT_TOKEN="your-management-token"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Prisma Commands

### Generate Prisma Client

```bash
npx prisma generate
```

### Create Migration

```bash
npx prisma migrate dev --name init
```

### Apply Migrations (Production)

```bash
npx prisma migrate deploy
```

### Open Prisma Studio (Database GUI)

```bash
npx prisma studio
```

### Reset Database (DEV ONLY)

```bash
npx prisma migrate reset
```

## Schema Highlights

### Architecture

This schema is designed for a **PostgreSQL** database (Neon serverless) with a three-tier content architecture:

1. **Database (This Schema)**: Core application data, user management, questions, tests, billing
2. **Contentful CMS**: Study guides rich text content (~90 pages)
3. **AWS S3**: Static media assets (images, audio)

### Key Models

#### Users & Access Control
- **User**: 4 types (ind/org/stu/admin) with role-based access
- **UserSession**: Database-backed sessions
- **OrgStudentUser**: Links organizations to their students
- **OrgGroup**: Student grouping within organizations

#### Content & Questions
- **Question**: 9,843+ questions with 3 types (TMCQ, GMCQ, DDI)
- **DdiOption**: Drag-drop question options
- **StudyArea**: 7 topic categories
- **Extract**: Audio files for listening questions (Flash → MP3 migration)
- **InlineImage**: Image library with S3 URLs

#### Tests & Assignments
- **Test**: Practice sessions and assignment attempts
- **UserQuestion**: Individual question attempt tracking
- **Assignment**: Teacher-created assignments
- **UserAssignment**: Assignment distribution to students
- **ProgressData**: Daily progress snapshots

#### Commerce
- **Product**: Subscription tiers
- **Transaction**: Purchase records (PayPal → Stripe migration)
- **Voucher**: Discount codes and referrals
- **CartItem**: Shopping cart

### Migration from Legacy MySQL

#### Key Changes

1. **Password Hashing**:
   - Legacy: Plaintext passwords ❌
   - New: bcrypt hashed passwords ✅
   - **Migration**: Force password reset for all users

2. **Foreign Keys**:
   - Legacy: No FK constraints ❌
   - New: All relationships enforced ✅

3. **S3 Media URLs**:
   - Legacy columns marked with `// LEGACY` comments
   - New S3 URL columns added
   - Keep legacy columns temporarily for rollback safety

4. **Stripe Integration**:
   - Added `stripeCustomerId`, `stripeSubscriptionId` to User
   - Added `stripePaymentIntentId`, `stripeInvoiceId` to Transaction
   - Legacy PayPal fields preserved for historical data

5. **Enums**:
   - MySQL ENUMs converted to Prisma enums
   - Properly typed in TypeScript

#### Data Types

| MySQL | PostgreSQL (Prisma) |
|-------|---------------------|
| `int` | `Int` |
| `varchar(255)` | `String @db.VarChar(255)` |
| `text` | `String @db.Text` |
| `datetime` | `DateTime` |
| `timestamp` | `DateTime @updatedAt` |
| `float(10,2)` | `Float @db.DoublePrecision` |
| `enum(...)` | Custom `enum` type |

### Indexes

Indexes added for:
- Foreign key columns
- Frequently queried fields (email, type, expiry, sessionId)
- Filter columns (difficulty, complete, status)

### Deprecated/Legacy Fields

Fields marked as LEGACY in comments:
- `questions.customImgFilename` → Use `customImgS3Url`
- `questions.mcqOption*Img` → Use `mcqOption*S3Url`
- `questions.mcqOption*ImgId` → Use `mcqOption*S3Url`
- `inlineImages.filename` → Use `s3Url`
- `extracts.filename` → Use `audioS3Url`
- `transactions.paypalTransactionId` → Use `stripePaymentIntentId`

These will be removed in a future version after migration is complete.

### Omitted Tables

The following tables from the legacy schema are **not included**:
- `study_guides` - Content moved to Contentful CMS
- `blog_posts`, `blog_comments` - May be migrated to Contentful
- `tf_blog_*` - Teacher blog system (TBD)
- `mailshots`, `tips_mailing_list` - Email marketing (may use external service)
- `marketing_*`, `sales_*` - CRM data (archive or migrate to dedicated CRM)
- `messages` - Contact form (can use simple table or external service)

These can be added back if needed.

## Usage Examples

### Creating a User

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const user = await prisma.user.create({
  data: {
    type: 'ind',
    name: 'John Smith',
    displayname: 'johnsmith',
    email: 'john@example.com',
    username: 'john@example.com',
    password: await bcrypt.hash('password123', 10), // Hash password!
    country: 'UK'
  }
})
```

### Querying Questions with Relations

```typescript
const questions = await prisma.question.findMany({
  where: {
    studyAreaId: { in: [1, 3, 5] },
    difficulty: { gte: 2, lte: 4 }
  },
  include: {
    studyArea: true,
    extract: true,
    ddiOptions: true
  },
  take: 20
})
```

### Creating a Test

```typescript
const test = await prisma.test.create({
  data: {
    userId: user.id,
    type: 'custom',
    topics: '1,3,5',
    numQuestions: 20,
    minDifficulty: 2,
    maxDifficulty: 4,
    timeLimitRequested: true,
    timeLimit: 1800, // 30 minutes
    questions: selectedQuestionIds.join(','),
    startTime: new Date()
  }
})
```

### Recording Question Attempts

```typescript
await prisma.userQuestion.create({
  data: {
    testId: test.id,
    userId: user.id,
    questionId: question.id,
    correct: userAnswer === question.mcqCorrectAnswer
  }
})

// Update user stats
await prisma.user.update({
  where: { id: user.id },
  data: {
    questionsTotal: { increment: 1 },
    questionsCorrect: { increment: isCorrect ? 1 : 0 },
    questionsIncorrect: { increment: isCorrect ? 0 : 1 }
  }
})
```

### Creating Organization with Students

```typescript
// Create organization
const school = await prisma.user.create({
  data: {
    type: 'org',
    name: 'Example School',
    displayname: 'exampleschool',
    email: 'admin@exampleschool.com',
    username: 'admin@exampleschool.com',
    password: hashedPassword,
    licenses: 100
  }
})

// Create student
const student = await prisma.user.create({
  data: {
    type: 'stu',
    name: 'Student Name',
    displayname: 'student123',
    email: 'student@example.com',
    username: 'student@example.com',
    password: hashedPassword
  }
})

// Link student to organization
await prisma.orgStudentUser.create({
  data: {
    orgUserId: school.id,
    stuUserId: student.id
  }
})

// Create a group
const group = await prisma.orgGroup.create({
  data: {
    orgUserId: school.id,
    name: 'Year 7 Music Theory',
    colour: '#3b82f6',
    sortOrder: 1
  }
})

// Add student to group
await prisma.orgStudentGroup.create({
  data: {
    orgGroupId: group.id,
    stuUserId: student.id
  }
})
```

## Next Steps

1. ✅ **Complete**: Prisma schema created
2. **Set up Neon database**: Create PostgreSQL instance
3. **Configure environment**: Add DATABASE_URL to .env
4. **Run first migration**: `npx prisma migrate dev --name init`
5. **Generate client**: `npx prisma generate`
6. **Seed development data**: Create seed script
7. **Implement authentication**: Password hashing, sessions
8. **Build data migration scripts**: MySQL → PostgreSQL (Phase 5)

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
