import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { TestQuestion } from "@/components/TestQuestion";

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const { q: questionIndexParam } = await searchParams;

  const testId = parseInt(id);

  if (isNaN(testId)) {
    notFound();
  }

  // Get test
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test || test.userId !== user.id) {
    notFound();
  }

  // If test is complete, redirect to results
  if (test.complete) {
    redirect(`/tests/${testId}/results`);
  }

  // Get question IDs
  const questionIds = test.questions?.split(",").map((id) => parseInt(id)) || [];

  if (questionIds.length === 0) {
    notFound();
  }

  // Determine current question index
  let currentIndex = test.currentQuestion;
  if (questionIndexParam) {
    const requestedIndex = parseInt(questionIndexParam);
    if (!isNaN(requestedIndex) && requestedIndex >= 0 && requestedIndex < questionIds.length) {
      currentIndex = requestedIndex;
    }
  }

  // Get current question
  const currentQuestionId = questionIds[currentIndex];
  const question = await prisma.question.findUnique({
    where: { id: currentQuestionId },
    include: {
      ddiOptions: true,
      extract: true,
      studyArea: true,
    },
  });

  if (!question) {
    notFound();
  }

  // Check if already answered
  const existingAnswer = await prisma.userQuestion.findFirst({
    where: {
      userId: user.id,
      testId: test.id,
      questionId: question.id,
    },
  });

  // Calculate time remaining
  let timeRemaining: number | null = null;
  if (test.timeLimitRequested && test.timeLimit && test.startTime) {
    const elapsedSeconds = Math.floor(
      (Date.now() - test.startTime.getTime()) / 1000
    );
    timeRemaining = Math.max(0, test.timeLimit - elapsedSeconds);

    // If time is up, complete the test
    if (timeRemaining === 0 && !test.complete) {
      await prisma.test.update({
        where: { id: testId },
        data: {
          complete: true,
          endTime: new Date(),
        },
      });
      redirect(`/tests/${testId}/results`);
    }
  }

  return (
    <main className="container">
      <article>
        <header>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <h1>Test in Progress</h1>
              <p>
                Question {currentIndex + 1} of {questionIds.length}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              {timeRemaining !== null && (
                <div>
                  <strong>Time Remaining:</strong>
                  <div style={{ fontSize: "1.5rem", color: timeRemaining < 300 ? "var(--del-color)" : "inherit" }}>
                    {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
                  </div>
                </div>
              )}
              <div style={{ marginTop: "0.5rem" }}>
                <strong>Progress:</strong> {test.progress}%
              </div>
            </div>
          </div>

          <progress value={test.progress} max="100" />
        </header>

        {existingAnswer ? (
          <div>
            <div role="alert">
              <p>You've already answered this question.</p>
            </div>
            <Link
              href={`/tests/${testId}?q=${currentIndex + 1}`}
              role="button"
            >
              Continue to Next Question
            </Link>
          </div>
        ) : (
          <TestQuestion
            question={question}
            testId={testId}
            questionIndex={currentIndex}
            totalQuestions={questionIds.length}
          />
        )}

        <footer style={{ marginTop: "2rem" }}>
          <details>
            <summary>Test Information</summary>
            <dl>
              <dt>Topics</dt>
              <dd>{question.studyArea.name}</dd>

              <dt>Difficulty</dt>
              <dd>{test.difficulty || "All levels"}</dd>

              <dt>Questions Answered</dt>
              <dd>
                {currentIndex} / {questionIds.length}
              </dd>

              <dt>Current Score</dt>
              <dd>
                {test.marks} / {test.marksAvailable}
              </dd>
            </dl>
          </details>
        </footer>
      </article>
    </main>
  );
}
