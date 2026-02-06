import { requireAuth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { startAssignment } from "@/app/actions/assignments";

export default async function StartAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const userAssignmentId = parseInt(id);

  if (isNaN(userAssignmentId)) {
    notFound();
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
    notFound();
  }

  // If test already exists and incomplete, set it in session and redirect
  if (userAssignment.test && !userAssignment.test.complete) {
    const { getPracticeSession } = await import("@/lib/practice-session");
    const session = await getPracticeSession();
    session.testId = userAssignment.test.id;
    await session.save();
    redirect("/practice");
  }

  // If test is complete, show results
  if (userAssignment.test && userAssignment.test.complete) {
    redirect(`/practice/results?tid=${userAssignment.test.id}`);
  }

  // Create test and redirect
  try {
    const testId = await startAssignment(userAssignmentId);
    const { getPracticeSession } = await import("@/lib/practice-session");
    const session = await getPracticeSession();
    session.testId = testId;
    await session.save();
    redirect("/practice");
  } catch (error) {
    console.error("Error starting assignment:", error);
    redirect("/assignments?error=start_failed");
  }
}
