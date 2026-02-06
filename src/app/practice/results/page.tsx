import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function PracticeResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ tid?: string }>;
}) {
  const user = await requireAuth();
  const { tid } = await searchParams;

  const testId = parseInt(tid || "0");

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

  // Get question IDs and answers
  const questionIds = test.questions?.split(",").map((id) => parseInt(id)) || [];

  const userAnswers = await prisma.userQuestion.findMany({
    where: {
      userId: user.id,
      testId: test.id,
    },
    include: {
      question: {
        include: {
          studyArea: true,
        },
      },
    },
    orderBy: {
      dateCreated: "asc",
    },
  });

  // Calculate statistics
  const totalQuestions = questionIds.length;
  const answeredCount = userAnswers.length;
  const correctCount = userAnswers.filter((a) => a.correct).length;
  const incorrectCount = userAnswers.filter((a) => !a.correct).length;
  const percentageScore = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100)
    : 0;

  // Calculate time taken
  let timeTaken: string | null = null;
  if (test.startTime && test.endTime) {
    const seconds = Math.floor(
      (test.endTime.getTime() - test.startTime.getTime()) / 1000
    );
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timeTaken = `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  // Get topics covered
  const topicIds = test.topics?.split(",") || [];
  const topics = await prisma.studyArea.findMany({
    where: {
      id: {
        in: topicIds.map((id) => parseInt(id)),
      },
    },
    select: {
      name: true,
    },
  });

  // Get difficulty levels
  const difficultyLevels = test.difficulties?.split("|").join(", ") || "All";

  return (
    <main className="container">
      <article>
        <header>
          <h1>Practice Test Results</h1>
          <p>
            You scored {correctCount} out of {totalQuestions} ({percentageScore}%)
          </p>
        </header>

        <section>
          <h2>Summary</h2>
          <dl>
            <dt>Questions Answered</dt>
            <dd>{answeredCount} / {totalQuestions}</dd>

            <dt>Correct Answers</dt>
            <dd style={{ color: "var(--ins-color)" }}>{correctCount}</dd>

            <dt>Incorrect Answers</dt>
            <dd style={{ color: "var(--del-color)" }}>{incorrectCount}</dd>

            <dt>Score</dt>
            <dd><strong>{percentageScore}%</strong></dd>

            {timeTaken && (
              <>
                <dt>Time Taken</dt>
                <dd>{timeTaken}</dd>
              </>
            )}

            {test.timeLimitRequested && test.timeLimit && (
              <>
                <dt>Time Limit</dt>
                <dd>
                  {Math.floor(test.timeLimit / 60)}:
                  {String(test.timeLimit % 60).padStart(2, "0")}
                </dd>
              </>
            )}

            <dt>Topics</dt>
            <dd>{topics.map((t) => t.name).join(", ")}</dd>

            <dt>Difficulty Levels</dt>
            <dd>{difficultyLevels}</dd>
          </dl>
        </section>

        {userAnswers.length > 0 && (
          <section>
            <h2>Question Review</h2>
            <details>
              <summary>View detailed results for each question</summary>
              {userAnswers.map((answer, index) => (
                <div
                  key={answer.id}
                  style={{
                    padding: "1rem",
                    marginBottom: "1rem",
                    backgroundColor: answer.correct
                      ? "var(--ins-color)"
                      : "var(--del-color)",
                    borderRadius: "var(--border-radius)",
                  }}
                >
                  <strong>
                    Question {index + 1}: {answer.question.studyArea.name}
                  </strong>
                  <div>
                    {answer.correct ? "✓ Correct" : "✗ Incorrect"}
                  </div>
                  <small>
                    Question ID: {answer.questionId} | Your answer: {answer.selectedAnswer}
                  </small>
                </div>
              ))}
            </details>
          </section>
        )}

        <footer style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
          <Link href="/practice" role="button">
            Start Another Practice Test
          </Link>
          <Link href="/dashboard" role="button" className="secondary">
            Back to Dashboard
          </Link>
        </footer>
      </article>
    </main>
  );
}
