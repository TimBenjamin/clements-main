import { requireAuth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;

  // Only org users can access this page
  if (user.type !== "org" && user.type !== "admin") {
    redirect("/dashboard");
  }

  const studentId = parseInt(id);

  if (isNaN(studentId)) {
    notFound();
  }

  // Verify this student belongs to the org
  const orgStudent = await prisma.orgStudentUser.findFirst({
    where: {
      orgUserId: user.id,
      stuUserId: studentId,
    },
    include: {
      student: true,
    },
  });

  if (!orgStudent) {
    notFound();
  }

  const student = orgStudent.student;

  // Get student's tests
  const tests = await prisma.test.findMany({
    where: {
      userId: studentId,
      complete: true,
    },
    orderBy: {
      endTime: "desc",
    },
    take: 10,
  });

  // Get student's recent activity
  const recentQuestions = await prisma.userQuestion.findMany({
    where: {
      userId: studentId,
    },
    include: {
      question: {
        include: {
          studyArea: true,
        },
      },
    },
    orderBy: {
      dateCreated: "desc",
    },
    take: 20,
  });

  // Calculate accuracy
  const accuracy =
    student.questionsTotal > 0
      ? Math.round((student.questionsCorrect / student.questionsTotal) * 100)
      : 0;

  return (
    <main className="container">
      <article>
        <header>
          <h1>{student.name}</h1>
          <p>
            <code>{student.displayname}</code> • {student.email}
          </p>
        </header>

        {/* Overall Stats */}
        <section>
          <h2>Performance Overview</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>
                {student.questionsTotal}
              </h3>
              <small>Questions</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>{student.testsCount}</h3>
              <small>Tests</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--ins-color)",
                }}
              >
                {student.questionsCorrect}
              </h3>
              <small>Correct</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>{accuracy}%</h3>
              <small>Accuracy</small>
            </div>
          </div>
        </section>

        {/* Recent Tests */}
        {tests.length > 0 && (
          <section>
            <h2>Recent Tests</h2>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((test) => {
                    const percentage = test.marksAvailable
                      ? Math.round(
                          ((test.marks || 0) / test.marksAvailable) * 100
                        )
                      : 0;

                    return (
                      <tr key={test.id}>
                        <td>
                          <small>
                            {test.endTime?.toLocaleDateString("en-GB")}
                          </small>
                        </td>
                        <td>{test.numQuestions}</td>
                        <td>
                          {test.marks} / {test.marksAvailable}
                        </td>
                        <td>
                          <strong
                            style={{
                              color:
                                percentage >= 80
                                  ? "var(--ins-color)"
                                  : percentage >= 60
                                    ? "inherit"
                                    : "var(--del-color)",
                            }}
                          >
                            {percentage}%
                          </strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Recent Activity */}
        {recentQuestions.length > 0 && (
          <section>
            <h2>Recent Activity</h2>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Type</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuestions.map((uq) => (
                    <tr key={uq.id}>
                      <td>
                        <small>
                          {new Date(uq.dateCreated).toLocaleDateString("en-GB")}
                        </small>
                      </td>
                      <td>{uq.question.studyArea.name}</td>
                      <td>
                        <small>{uq.type}</small>
                      </td>
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
        )}

        {tests.length === 0 && recentQuestions.length === 0 && (
          <section>
            <div role="alert">
              <p>This student hasn't started any activities yet.</p>
            </div>
          </section>
        )}

        {/* Account Info */}
        <section>
          <h2>Account Information</h2>
          <dl>
            <dt>Member Since</dt>
            <dd>{new Date(student.dateCreated).toLocaleDateString("en-GB")}</dd>

            <dt>Successful Logins</dt>
            <dd>{student.successfulLogins}</dd>

            <dt>Subscription Expiry</dt>
            <dd>
              {student.expiry
                ? new Date(student.expiry).toLocaleDateString("en-GB")
                : "N/A"}
            </dd>
          </dl>
        </section>

        <footer>
          <Link href="/students" role="button" className="secondary">
            Back to Students
          </Link>
        </footer>
      </article>
    </main>
  );
}
