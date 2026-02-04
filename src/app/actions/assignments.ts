"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Create a new assignment
 */
export async function createAssignment(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user || (user.type !== "org" && user.type !== "admin")) {
    redirect("/login");
  }

  const savename = formData.get("savename") as string;
  const deadline = formData.get("dueDate") as string;
  const students = formData.getAll("students").map((s) => parseInt(s as string));
  const topics = formData.getAll("topics").map((t) => parseInt(t as string));
  const numQuestions = parseInt(formData.get("numQuestions") as string);
  const difficulty = formData.get("difficulty") as string;
  const timeLimitRequested = formData.get("timeLimitRequested") === "on";

  // Validation
  if (!savename || students.length === 0 || topics.length === 0) {
    redirect("/assignments/create?error=missing");
  }

  if (numQuestions < 5 || numQuestions > 50) {
    redirect("/assignments/create?error=invalid_questions");
  }

  try {
    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        savename,
        deadline: deadline ? new Date(deadline) : null,
        topics: topics.join(","),
        questions: String(numQuestions), // Store as string for compatibility
        minDifficulty:
          difficulty === "easy" ? 1 : difficulty === "intermediate" ? 3 : difficulty === "hard" ? 4 : null,
        maxDifficulty:
          difficulty === "easy" ? 2 : difficulty === "intermediate" ? 4 : difficulty === "hard" ? 5 : null,
        timeLimitRequested,
        userId: user.id,
      },
    });

    // Create UserAssignment records for each student
    await prisma.userAssignment.createMany({
      data: students.map((studentId) => ({
        userId: studentId,
        assignmentId: assignment.id,
      })),
    });

    redirect(`/assignments/${assignment.id}?success=created`);
  } catch (error) {
    console.error("Assignment creation error:", error);
    redirect("/assignments/create?error=server");
  }
}

/**
 * Start an assignment (create test from assignment)
 */
export async function startAssignment(
  userAssignmentId: number
): Promise<number> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Get user assignment
  const userAssignment = await prisma.userAssignment.findUnique({
    where: { id: userAssignmentId },
    include: {
      assignment: true,
      test: true,
    },
  });

  if (!userAssignment || userAssignment.userId !== user.id) {
    throw new Error("Assignment not found or access denied");
  }

  // Check if already started
  if (userAssignment.test) {
    return userAssignment.test.id;
  }

  const assignment = userAssignment.assignment;

  // Check if past deadline
  if (assignment.deadline && new Date(assignment.deadline) < new Date()) {
    // Allow to continue - teacher can decide whether to accept late submissions
  }

  // Get topics
  const topics = assignment.topics?.split(",").map((t) => parseInt(t)) || [];

  // Get num questions from assignment.questions field
  const numQuestions = parseInt(assignment.questions || "10");

  // Build query for questions
  interface WhereClause {
    studyAreaId: { in: number[] };
    difficulty?: { lte?: number; gte?: number };
  }

  const whereClause: WhereClause = {
    studyAreaId: {
      in: topics,
    },
  };

  // Add difficulty filter
  if (assignment.minDifficulty) {
    whereClause.difficulty = { gte: assignment.minDifficulty };
  }
  if (assignment.maxDifficulty) {
    if (!whereClause.difficulty) whereClause.difficulty = {};
    whereClause.difficulty.lte = assignment.maxDifficulty;
  }

  // Get random questions
  const allMatchingQuestions = await prisma.question.findMany({
    where: whereClause,
    select: {
      id: true,
    },
  });

  if (allMatchingQuestions.length === 0) {
    throw new Error("No questions available for this assignment");
  }

  // Shuffle and take requested number
  const shuffled = allMatchingQuestions.sort(() => Math.random() - 0.5);
  const selectedQuestions = shuffled.slice(
    0,
    Math.min(numQuestions, shuffled.length)
  );

  // Create test
  const test = await prisma.test.create({
    data: {
      userId: user.id,
      assignmentId: assignment.id,
      type: "assignment",
      topics: assignment.topics,
      numQuestions: selectedQuestions.length,
      timeLimitRequested: assignment.timeLimitRequested,
      questions: selectedQuestions.map((q) => q.id).join(","),
      answers: "",
      currentQuestion: 0,
      startTime: new Date(),
      complete: false,
      progress: 0,
      marks: 0,
      marksAvailable: selectedQuestions.length,
    },
  });

  // Link test to user assignment
  await prisma.userAssignment.update({
    where: { id: userAssignmentId },
    data: {
      testId: test.id,
    },
  });

  return test.id;
}
