/**
 * Incremental sync script
 * Syncs user activity from old database to new database
 * Can be run repeatedly - uses timestamps to sync only new/updated records
 */

import { getOldDb, prisma, getLastSyncTime, recordMigration, closeConnections } from "./db";
import { migrateUsers } from "./users";

async function syncTable(
  tableName: string,
  oldDb: any,
  lastSyncTime: Date | null
) {
  console.log(`\nSyncing ${tableName}...`);

  let query = `SELECT * FROM ${tableName}`;
  const params: any[] = [];

  if (lastSyncTime) {
    query += " WHERE last_modified > ? OR date_created > ?";
    params.push(lastSyncTime, lastSyncTime);
  }

  query += " ORDER BY id";

  const [rows] = await oldDb.query(query, params);
  const records = rows as any[];

  console.log(`Found ${records.length} ${tableName} to sync`);

  return records;
}

async function syncOrgStudentUsers(oldDb: any, lastSyncTime: Date | null) {
  const records = await syncTable("org_stu_users", oldDb, lastSyncTime);

  let synced = 0;
  for (const r of records) {
    try {
      await prisma.orgStudentUser.upsert({
        where: { id: r.id },
        update: {
          orgUserId: r.org_user_id,
          stuUserId: r.stu_user_id,
          orgGroupId: r.org_group_id,
          dateCreated: r.date_created,
          lastModified: r.last_modified,
        },
        create: {
          id: r.id,
          orgUserId: r.org_user_id,
          stuUserId: r.stu_user_id,
          orgGroupId: r.org_group_id,
          dateCreated: r.date_created,
          lastModified: r.last_modified,
        },
      });
      synced++;
    } catch (error) {
      console.error(`Error syncing org_stu_users ${r.id}:`, error);
    }
  }

  console.log(`✓ Synced ${synced} org_stu_users`);
  return synced;
}

async function syncTests(oldDb: any, lastSyncTime: Date | null) {
  const records = await syncTable("tests", oldDb, lastSyncTime);

  const toBool = (val: any) => val === 1 || val === true;
  const parseDate = (date: any) => {
    if (!date || date === "0000-00-00 00:00:00") return null;
    return date;
  };

  let synced = 0;
  for (const t of records) {
    try {
      await prisma.test.upsert({
        where: { id: t.id },
        update: {
          userId: t.user_id,
          assignmentId: t.assignment_id,
          type: t.type,
          includePreviousCorrect: toBool(t.include_previous_correct),
          includePreviousIncorrect: toBool(t.include_previous_incorrect),
          topics: t.topics,
          numQuestions: t.num_questions,
          difficulty: t.difficulty,
          minDifficulty: t.min_difficulty,
          maxDifficulty: t.max_difficulty,
          difficulties: t.difficulties,
          timeLimitRequested: toBool(t.time_limit_requested),
          timeLimit: t.time_limit,
          questions: t.questions,
          answers: t.answers,
          currentQuestion: t.current_question,
          startTime: parseDate(t.start_time),
          endTime: parseDate(t.end_time),
          complete: toBool(t.complete),
          marks: t.marks,
          marksAvailable: t.marks_available,
          progress: t.progress,
          dateCreated: t.date_created,
          lastModified: t.last_modified,
        },
        create: {
          id: t.id,
          userId: t.user_id,
          assignmentId: t.assignment_id,
          type: t.type,
          includePreviousCorrect: toBool(t.include_previous_correct),
          includePreviousIncorrect: toBool(t.include_previous_incorrect),
          topics: t.topics,
          numQuestions: t.num_questions,
          difficulty: t.difficulty,
          minDifficulty: t.min_difficulty,
          maxDifficulty: t.max_difficulty,
          difficulties: t.difficulties,
          timeLimitRequested: toBool(t.time_limit_requested),
          timeLimit: t.time_limit,
          questions: t.questions,
          answers: t.answers,
          currentQuestion: t.current_question,
          startTime: parseDate(t.start_time),
          endTime: parseDate(t.end_time),
          complete: toBool(t.complete),
          marks: t.marks,
          marksAvailable: t.marks_available,
          progress: t.progress,
          dateCreated: t.date_created,
          lastModified: t.last_modified,
        },
      });
      synced++;
    } catch (error) {
      console.error(`Error syncing test ${t.id}:`, error);
    }
  }

  console.log(`✓ Synced ${synced} tests`);
  return synced;
}

async function syncUserQuestions(oldDb: any, lastSyncTime: Date | null) {
  const records = await syncTable("users_questions", oldDb, lastSyncTime);

  const toBool = (val: any) => val === 1 || val === true;

  let synced = 0;
  for (const uq of records) {
    try {
      await prisma.userQuestion.upsert({
        where: { id: uq.id },
        update: {
          testId: uq.test_id,
          userId: uq.user_id,
          questionId: uq.question_id,
          selectedAnswer: uq.selected_answer,
          correct: toBool(uq.correct),
          grade: uq.grade,
          topic1: uq.topic1,
          topic2: uq.topic2,
          type: uq.type,
          dateCreated: uq.date_created,
          lastModified: uq.last_modified,
        },
        create: {
          id: uq.id,
          testId: uq.test_id,
          userId: uq.user_id,
          questionId: uq.question_id,
          selectedAnswer: uq.selected_answer,
          correct: toBool(uq.correct),
          grade: uq.grade,
          topic1: uq.topic1,
          topic2: uq.topic2,
          type: uq.type,
          dateCreated: uq.date_created,
          lastModified: uq.last_modified,
        },
      });
      synced++;
    } catch (error) {
      console.error(`Error syncing user_question ${uq.id}:`, error);
    }
  }

  console.log(`✓ Synced ${synced} user questions`);
  return synced;
}

async function syncAssignments(oldDb: any, lastSyncTime: Date | null) {
  const records = await syncTable("assignments", oldDb, lastSyncTime);

  const toBool = (val: any) => val === 1 || val === true;
  const parseDate = (date: any) => {
    if (!date || date === "0000-00-00 00:00:00") return null;
    return date;
  };

  let synced = 0;
  for (const a of records) {
    try {
      await prisma.assignment.upsert({
        where: { id: a.id },
        update: {
          savename: a.savename,
          questions: a.questions,
          topics: a.topics,
          minDifficulty: a.min_difficulty,
          maxDifficulty: a.max_difficulty,
          difficulties: a.difficulties,
          timeLimitRequested: toBool(a.time_limit_requested),
          reuseOldQuestions: toBool(a.reuse_old_questions),
          type: a.type,
          userId: a.user_id,
          studyGuide: a.study_guide,
          deadline: parseDate(a.deadline),
          archived: toBool(a.archived),
          archivedDate: parseDate(a.archived_date),
          dateCreated: a.date_created,
          lastModified: a.last_modified,
        },
        create: {
          id: a.id,
          savename: a.savename,
          questions: a.questions,
          topics: a.topics,
          minDifficulty: a.min_difficulty,
          maxDifficulty: a.max_difficulty,
          difficulties: a.difficulties,
          timeLimitRequested: toBool(a.time_limit_requested),
          reuseOldQuestions: toBool(a.reuse_old_questions),
          type: a.type,
          userId: a.user_id,
          studyGuide: a.study_guide,
          deadline: parseDate(a.deadline),
          archived: toBool(a.archived),
          archivedDate: parseDate(a.archived_date),
          dateCreated: a.date_created,
          lastModified: a.last_modified,
        },
      });
      synced++;
    } catch (error) {
      console.error(`Error syncing assignment ${a.id}:`, error);
    }
  }

  console.log(`✓ Synced ${synced} assignments`);
  return synced;
}

async function syncUserAssignments(oldDb: any, lastSyncTime: Date | null) {
  const records = await syncTable("users_assignments", oldDb, lastSyncTime);

  const toBool = (val: any) => val === 1 || val === true;
  const parseDate = (date: any) => {
    if (!date || date === "0000-00-00 00:00:00") return null;
    return date;
  };

  let synced = 0;
  for (const ua of records) {
    try {
      await prisma.userAssignment.upsert({
        where: { id: ua.id },
        update: {
          assignmentId: ua.assignment_id,
          userId: ua.user_id,
          complete: toBool(ua.complete),
          testId: ua.test_id,
          deadline: parseDate(ua.deadline),
          dateCompleted: parseDate(ua.date_completed),
          dateCreated: ua.date_created,
          lastModified: ua.last_modified,
        },
        create: {
          id: ua.id,
          assignmentId: ua.assignment_id,
          userId: ua.user_id,
          complete: toBool(ua.complete),
          testId: ua.test_id,
          deadline: parseDate(ua.deadline),
          dateCompleted: parseDate(ua.date_completed),
          dateCreated: ua.date_created,
          lastModified: ua.last_modified,
        },
      });
      synced++;
    } catch (error) {
      console.error(`Error syncing user_assignment ${ua.id}:`, error);
    }
  }

  console.log(`✓ Synced ${synced} user assignments`);
  return synced;
}

async function incrementalSync() {
  console.log("=== Starting Incremental Sync ===\n");

  const oldDb = await getOldDb();

  try {
    // Get last sync time for each table
    const lastSyncUsers = await getLastSyncTime("users");
    const lastSyncOrgStu = await getLastSyncTime("org_stu_users");
    const lastSyncTests = await getLastSyncTime("tests");
    const lastSyncUserQuestions = await getLastSyncTime("users_questions");
    const lastSyncAssignments = await getLastSyncTime("assignments");
    const lastSyncUserAssignments = await getLastSyncTime("users_assignments");

    // Sync in dependency order
    console.log("1. Syncing users...");
    await migrateUsers(lastSyncUsers || undefined);

    console.log("\n2. Syncing org-student relationships...");
    await syncOrgStudentUsers(oldDb, lastSyncOrgStu);

    console.log("\n3. Syncing assignments...");
    await syncAssignments(oldDb, lastSyncAssignments);

    console.log("\n4. Syncing tests...");
    await syncTests(oldDb, lastSyncTests);

    console.log("\n5. Syncing user questions...");
    await syncUserQuestions(oldDb, lastSyncUserQuestions);

    console.log("\n6. Syncing user assignments...");
    await syncUserAssignments(oldDb, lastSyncUserAssignments);

    console.log("\n=== Sync Complete ===");
  } catch (error) {
    console.error("Sync failed:", error);
    throw error;
  } finally {
    await closeConnections(oldDb);
  }
}

// Run if called directly
if (require.main === module) {
  incrementalSync()
    .then(() => {
      console.log("Incremental sync complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Sync failed:", error);
      process.exit(1);
    });
}

export { incrementalSync };
