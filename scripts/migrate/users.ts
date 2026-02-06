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

    // Track displaynames to ensure uniqueness
    const usedDisplaynames = new Set<string>();

    for (const u of users) {
      try {
        // Generate random password and hash it
        const randomPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        // Generate displayname if missing - must be unique
        let displayname = u.displayname;
        if (!displayname || displayname.trim() === '') {
          // Try using name first
          displayname = u.name || u.email || u.username || `user_${u.id}`;

          // If displayname is already used, try variations
          if (usedDisplaynames.has(displayname)) {
            // Try email
            displayname = u.email || u.username || `user_${u.id}`;

            // If still duplicate, use username
            if (usedDisplaynames.has(displayname)) {
              displayname = u.username || `user_${u.id}`;

              // Last resort: use user_ID
              if (usedDisplaynames.has(displayname)) {
                displayname = `user_${u.id}`;
              }
            }
          }
        }

        usedDisplaynames.add(displayname);

        // Convert MySQL boolean (0/1) to PostgreSQL boolean
        const toBool = (val: any) => val === 1 || val === true;

        // Convert NULL integers to 0
        const toInt = (val: any) => (val === null || val === undefined) ? 0 : val;

        // Handle zero dates and invalid dates from MySQL
        const parseDate = (date: any) => {
          if (!date || date === "0000-00-00 00:00:00" || date === "0000-00-00") return null;
          const parsed = new Date(date);
          // Return null if date is invalid
          if (isNaN(parsed.getTime())) return null;
          return parsed;
        };

        // Use raw SQL to insert with manual ID (Prisma doesn't allow this with autoincrement)
        await prisma.$executeRaw`
          INSERT INTO users (
            id, type, name, displayname, phone, mobile, email, address, postcode, country,
            username, password, reset_token, reset_expiry, exam_date,
            last_action, session_id, licenses, student_funding_code, expiry,
            stripe_customer_id, stripe_subscription_id,
            site_admin, forum_admin, question_admin, blog_admin,
            welcome_email_sent, initial_checkout_complete, show_welcome_box, show_subscription_renewal_box,
            where_did_you_hear, where_did_you_hear_other,
            progress_total, progress_1, progress_2, progress_3, progress_4, progress_5, progress_6, progress_7,
            questions_total, questions_correct, questions_incorrect, tests_count, successful_logins,
            allow_overdue_assignments, allow_overdue_assignments_period_days,
            suppress_teacher_assignment_emails, suppress_student_assignment_emails, suppress_student_welcome_emails,
            expired_assignments_student_visibility_duration_days, complete_assignments_student_visibility_duration_days,
            date_created, last_modified
          ) VALUES (
            ${u.id}, ${u.type}::user_type, ${u.name}, ${displayname}, ${u.phone}, ${u.mobile}, ${u.email}, ${u.address}, ${u.postcode}, ${u.country},
            ${u.username}, ${hashedPassword}, ${null}, ${null}, ${parseDate(u.exam_date)},
            ${parseDate(u.last_action) || new Date()}, ${u.session_id}, ${toInt(u.licenses)}, ${u.student_funding_code}, ${parseDate(u.expiry)},
            ${null}, ${null},
            ${toBool(u.site_admin)}, ${toBool(u.forum_admin)}, ${toBool(u.question_admin)}, ${toBool(u.blog_admin)},
            ${toBool(u.welcome_email_sent)}, ${toBool(u.initial_checkout_complete)}, ${toBool(u.show_welcome_box)}, ${toBool(u.show_subscription_renewal_box)},
            ${u.where_did_you_hear}, ${u.where_did_you_hear_other},
            ${toInt(u.progress_total)}, ${toInt(u.progress_1)}, ${toInt(u.progress_2)}, ${toInt(u.progress_3)}, ${toInt(u.progress_4)}, ${toInt(u.progress_5)}, ${toInt(u.progress_6)}, ${toInt(u.progress_7)},
            ${toInt(u.questions_total)}, ${toInt(u.questions_correct)}, ${toInt(u.questions_incorrect)}, ${toInt(u.tests_count)}, ${toInt(u.successful_logins)},
            ${toBool(u.allow_overdue_assignments)}, ${toInt(u.allow_overdue_assignments_period_days)},
            ${toBool(u.suppress_teacher_assignment_emails)}, ${toBool(u.suppress_student_assignment_emails)}, ${toBool(u.suppress_student_welcome_emails)},
            ${toInt(u.expired_assignments_student_visibility_duration_days)}, ${toInt(u.complete_assignments_student_visibility_duration_days)},
            ${u.date_created}, ${u.last_modified}
          )
        `;

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
