import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function TestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  const testId = parseInt(id);

  if (isNaN(testId)) {
    notFound();
  }

  // Get test with user questions
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      userQuestions: {
        include: {
          question: {
            include: {
              studyArea: true,
            },
          },
        },
      },
    },
  });

  if (!test || test.userId !== user.id) {
    notFound();
  }

  if (!test.complete) {
    notFound();
  }

  const percentage = test.marksAvailable
    ? Math.round(((test.marks || 0) / test.marksAvailable) * 100)
    : 0;

  // Calculate time taken
  let timeTaken = "N/A";
  if (test.startTime && test.endTime) {
    const seconds = Math.floor(
      (test.endTime.getTime() - test.startTime.getTime()) / 1000
    );
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timeTaken = `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return (
    <main className="container">
      <article>
        <header>
          <h1>Test Results</h1>
          <p>
            Completed on {test.endTime?.toLocaleDateString("en-GB")} at{" "}
            {test.endTime?.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </header>

        {/* Score Summary */}
        <section>
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              backgroundColor: "var(--card-background-color)",
              borderRadius: "var(--border-radius)",
            }}
          >
            <h2 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
              {percentage}%
            </h2>
            <p style={{ fontSize: "1.2rem" }}>
              {test.marks} / {test.marksAvailable} correct
            </p>
          </div>
        </section>

        {/* Test Details */}
        <section>
          <h2>Test Details</h2>
          <dl>
            <dt>Questions</dt>
            <dd>{test.numQuestions}</dd>

            <dt>Time Taken</dt>
            <dd>{timeTaken}</dd>

            <dt>Topics</dt>
            <dd>{test.topics}</dd>

            <dt>Difficulty</dt>
            <dd style={{ textTransform: "capitalize" }}>
              {test.difficulty || "All levels"}
            </dd>
          </dl>
        </section>

        {/* Question Breakdown */}
        <section>
          <h2>Question Breakdown</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Topic</th>
                  <th>Type</th>
                  <th>Your Answer</th>
                  <th>Correct</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {test.userQuestions.map((uq, index) => (
                  <tr key={uq.id}>
                    <td>{index + 1}</td>
                    <td>{uq.question.studyArea.name}</td>
                    <td>
                      <small>{uq.type}</small>
                    </td>
                    <td>{uq.selectedAnswer || "N/A"}</td>
                    <td>{uq.question.mcqCorrectAnswer}</td>
                    <td>
                      {uq.correct ? (
                        <span style={{ color: "var(--ins-color)" }}>✓</span>
                      ) : (
                        <span style={{ color: "var(--del-color)" }}>✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Performance Feedback */}
        <section>
          <h2>Performance</h2>
          {percentage >= 80 && (
            <div
              role="alert"
              style={{ backgroundColor: "var(--ins-color)" }}
            >
              <strong>Excellent!</strong>
              <p>You have a strong understanding of this material.</p>
            </div>
          )}
          {percentage >= 60 && percentage < 80 && (
            <div
              role="alert"
              style={{ backgroundColor: "var(--secondary-focus)" }}
            >
              <strong>Good work!</strong>
              <p>You're making solid progress. Keep practicing to improve.</p>
            </div>
          )}
          {percentage < 60 && (
            <div
              role="alert"
              style={{ backgroundColor: "var(--del-color)" }}
            >
              <strong>Keep practicing!</strong>
              <p>
                Review the topics you struggled with and try more practice
                questions.
              </p>
            </div>
          )}
        </section>

        <footer>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/tests/new" role="button">
              Take Another Test
            </Link>
            <Link href="/practice" role="button" className="secondary">
              Practice Questions
            </Link>
            <Link href="/dashboard" role="button" className="outline">
              Back to Dashboard
            </Link>
          </div>
        </footer>
      </article>
    </main>
  );
}
