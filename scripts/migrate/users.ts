/**
 * Migrate users table
 * No dependencies - but needs special password handling
 *
 * IMPORTANT: Passwords are plaintext in old DB
 * Strategy: Generate random passwords + send reset emails
 */

import { getOldDb, prisma, recordMigration, closeConnections } from "./db";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

// Generate a secure random password
function generateRandomPassword(): string {
  return randomBytes(16).toString("hex");
}

async function migrateUsers(incrementalSince?: Date) {
  console.log("Starting users migration...");

  if (incrementalSince) {
    console.log(`Incremental sync: migrating users modified since ${incrementalSince}`);
  }

  const oldDb = await getOldDb();

  try {
    // Fetch users from old database
    let query = "SELECT * FROM users";
    const params: any[] = [];

    if (incrementalSince) {
      query += " WHERE last_modified > ? OR date_created > ?";
      params.push(incrementalSince, incrementalSince);
    }

    query += " ORDER BY id";

    const [rows] = await oldDb.query(query, params);
    const users = rows as any[];

    console.log(`Found ${users.length} users to migrate`);

    let migrated = 0;
    let errors = 0;

    for (const u of users) {
      try {
        // Generate random password and hash it
        const randomPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Convert MySQL boolean (0/1) to PostgreSQL boolean
        const toBool = (val: any) => val === 1 || val === true;

        // Handle zero dates from MySQL
        const parseDate = (date: any) => {
          if (!date || date === "0000-00-00 00:00:00") return null;
          return date;
        };

        await prisma.user.upsert({
          where: { id: u.id },
          update: {
            type: u.type,
            name: u.name,
            displayname: u.displayname,
            phone: u.phone,
            mobile: u.mobile,
            email: u.email,
            address: u.address,
            postcode: u.postcode,
            country: u.country,

            username: u.username,
            password: hashedPassword, // Random password - user must reset
            resetToken: null,
            resetExpiry: null,
            examDate: parseDate(u.exam_date),

            lastAction: parseDate(u.last_action) || new Date(),
            sessionId: u.session_id,

            licenses: u.licenses,
            studentFundingCode: u.student_funding_code,

            expiry: parseDate(u.expiry),
            // stripeCustomerId will be null (no Stripe in old system)
            // stripeSubscriptionId will be null

            siteAdmin: toBool(u.site_admin),
            forumAdmin: toBool(u.forum_admin),
            questionAdmin: toBool(u.question_admin),
            blogAdmin: toBool(u.blog_admin),

            welcomeEmailSent: toBool(u.welcome_email_sent),
            initialCheckoutComplete: toBool(u.initial_checkout_complete),
            showWelcomeBox: toBool(u.show_welcome_box),
            showSubscriptionRenewalBox: toBool(u.show_subscription_renewal_box),

            whereDidYouHear: u.where_did_you_hear,
            whereDidYouHearOther: u.where_did_you_hear_other,

            progressTotal: u.progress_total,
            progress1: u.progress_1,
            progress2: u.progress_2,
            progress3: u.progress_3,
            progress4: u.progress_4,
            progress5: u.progress_5,
            progress6: u.progress_6,
            progress7: u.progress_7,

            questionsTotal: u.questions_total,
            questionsCorrect: u.questions_correct,
            questionsIncorrect: u.questions_incorrect,
            testsCount: u.tests_count,
            successfulLogins: u.successful_logins,

            allowOverdueAssignments: toBool(u.allow_overdue_assignments),
            allowOverdueAssignmentsPeriodDays: u.allow_overdue_assignments_period_days,
            suppressTeacherAssignmentEmails: toBool(u.suppress_teacher_assignment_emails),
            suppressStudentAssignmentEmails: toBool(u.suppress_student_assignment_emails),
            suppressStudentWelcomeEmails: toBool(u.suppress_student_welcome_emails),
            expiredAssignmentsStudentVisibilityDurationDays: u.expired_assignments_student_visibility_duration_days,
            completeAssignmentsStudentVisibilityDurationDays: u.complete_assignments_student_visibility_duration_days,

            dateCreated: u.date_created,
            lastModified: u.last_modified,
          },
          create: {
            id: u.id,
            type: u.type,
            name: u.name,
            displayname: u.displayname,
            phone: u.phone,
            mobile: u.mobile,
            email: u.email,
            address: u.address,
            postcode: u.postcode,
            country: u.country,

            username: u.username,
            password: hashedPassword,
            examDate: parseDate(u.exam_date),

            lastAction: parseDate(u.last_action) || new Date(),
            sessionId: u.session_id,

            licenses: u.licenses,
            studentFundingCode: u.student_funding_code,

            expiry: parseDate(u.expiry),

            siteAdmin: toBool(u.site_admin),
            forumAdmin: toBool(u.forum_admin),
            questionAdmin: toBool(u.question_admin),
            blogAdmin: toBool(u.blog_admin),

            welcomeEmailSent: toBool(u.welcome_email_sent),
            initialCheckoutComplete: toBool(u.initial_checkout_complete),
            showWelcomeBox: toBool(u.show_welcome_box),
            showSubscriptionRenewalBox: toBool(u.show_subscription_renewal_box),

            whereDidYouHear: u.where_did_you_hear,
            whereDidYouHearOther: u.where_did_you_hear_other,

            progressTotal: u.progress_total,
            progress1: u.progress_1,
            progress2: u.progress_2,
            progress3: u.progress_3,
            progress4: u.progress_4,
            progress5: u.progress_5,
            progress6: u.progress_6,
            progress7: u.progress_7,

            questionsTotal: u.questions_total,
            questionsCorrect: u.questions_correct,
            questionsIncorrect: u.questions_incorrect,
            testsCount: u.tests_count,
            successfulLogins: u.successful_logins,

            allowOverdueAssignments: toBool(u.allow_overdue_assignments),
            allowOverdueAssignmentsPeriodDays: u.allow_overdue_assignments_period_days,
            suppressTeacherAssignmentEmails: toBool(u.suppress_teacher_assignment_emails),
            suppressStudentAssignmentEmails: toBool(u.suppress_student_assignment_emails),
            suppressStudentWelcomeEmails: toBool(u.suppress_student_welcome_emails),
            expiredAssignmentsStudentVisibilityDurationDays: u.expired_assignments_student_visibility_duration_days,
            completeAssignmentsStudentVisibilityDurationDays: u.complete_assignments_student_visibility_duration_days,

            dateCreated: u.date_created,
            lastModified: u.last_modified,
          },
        });

        migrated++;

        if (migrated % 100 === 0) {
          console.log(`  Migrated ${migrated}/${users.length} users...`);
        }
      } catch (error) {
        console.error(`Error migrating user ${u.id} (${u.email}):`, error);
        errors++;
      }
    }

    console.log(`✓ Migrated ${migrated} users (${errors} errors)`);
    console.log("⚠️  All users have random passwords - send password reset emails");

    await recordMigration(
      "users",
      migrated,
      `${errors} errors, all users need password reset`
    );
  } catch (error) {
    console.error("Error migrating users:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  migrateUsers()
    .then(() => {
      console.log("Users migration complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateUsers };
