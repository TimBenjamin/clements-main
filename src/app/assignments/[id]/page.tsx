import { requireAuth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AssignmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const user = await requireAuth();
  const { id } = await params;
  const params2 = await searchParams;

  // Only org users can view assignment details
  if (user.type !== "org" && user.type !== "admin") {
    redirect("/dashboard");
  }

  const assignmentId = parseInt(id);

  if (isNaN(assignmentId)) {
    notFound();
  }

  // Get assignment with student submissions
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      creator: {
        select: {
          name: true,
        },
      },
      usersAssignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              displayname: true,
            },
          },
          test: true,
        },
      },
    },
  });

  if (!assignment || assignment.userId !== user.id) {
    notFound();
  }

  const totalStudents = assignment.usersAssignments.length;
  const completedCount = assignment.usersAssignments.filter(
    (ua) => ua.test?.complete
  ).length;
  const averageScore =
    completedCount > 0
      ? Math.round(
          assignment.usersAssignments
            .filter((ua) => ua.test?.complete)
            .reduce((sum, ua) => {
              const percentage = ua.test?.marksAvailable
                ? ((ua.test.marks || 0) / ua.test.marksAvailable) * 100
                : 0;
              return sum + percentage;
            }, 0) / completedCount
        )
      : 0;

  return (
    <main className="container">
      <article>
        <header>
          <h1>{assignment.savename || "Untitled Assignment"}</h1>
          <p>Created by {assignment.creator.name}</p>
        </header>

        {params2.success === "created" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Assignment created and sent to students successfully!
          </div>
        )}

        {/* Assignment Summary */}
        <section>
          <h2>Summary</h2>
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
              <h3 style={{ marginBottom: "0.5rem" }}>{totalStudents}</h3>
              <small>Students</small>
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
                {completedCount}
              </h3>
              <small>Completed</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>
                {totalStudents - completedCount}
              </h3>
              <small>Pending</small>
            </div>

            <div
              style={{
                padding: "1rem",
                backgroundColor: "var(--card-background-color)",
                borderRadius: "var(--border-radius)",
                textAlign: "center",
              }}
            >
              <h3 style={{ marginBottom: "0.5rem" }}>
                {completedCount > 0 ? `${averageScore}%` : "N/A"}
              </h3>
              <small>Average Score</small>
            </div>
          </div>
        </section>

        {/* Assignment Details */}
        <section>
          <h2>Details</h2>
          <dl>
            <dt>Created</dt>
            <dd>{new Date(assignment.dateCreated).toLocaleDateString("en-GB")}</dd>

            {assignment.deadline && (
              <>
                <dt>Deadline</dt>
                <dd>
                  {new Date(assignment.deadline).toLocaleDateString("en-GB")} at{" "}
                  {new Date(assignment.deadline).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </>
            )}

            <dt>Questions</dt>
            <dd>{assignment.questions}</dd>

            <dt>Difficulty</dt>
            <dd style={{ textTransform: "capitalize" }}>
              {assignment.minDifficulty && assignment.maxDifficulty
                ? `${assignment.minDifficulty}-${assignment.maxDifficulty}`
                : "All levels"}
            </dd>

            {assignment.timeLimitRequested && (
              <>
                <dt>Time Limit</dt>
                <dd>Set by teacher</dd>
              </>
            )}
          </dl>
        </section>

        {/* Student Progress */}
        <section>
          <h2>Student Progress</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {assignment.usersAssignments.map((ua) => {
                  const isComplete = ua.test?.complete || false;
                  const score = ua.test?.marksAvailable
                    ? `${ua.test.marks}/${ua.test.marksAvailable}`
                    : "N/A";
                  const percentage = ua.test?.marksAvailable
                    ? Math.round(
                        ((ua.test.marks || 0) / ua.test.marksAvailable) * 100
                      )
                    : 0;

                  return (
                    <tr key={ua.id}>
                      <td>
                        <Link href={`/students/${ua.user.id}`}>
                          {ua.user.name}
                        </Link>
                        <br />
                        <small>@{ua.user.displayname}</small>
                      </td>
                      <td>
                        {isComplete ? (
                          <span style={{ color: "var(--ins-color)" }}>
                            ✓ Completed
                          </span>
                        ) : ua.test ? (
                          <span style={{ color: "var(--secondary)" }}>
                            In Progress
                          </span>
                        ) : (
                          <span>Not Started</span>
                        )}
                      </td>
                      <td>
                        {isComplete ? (
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
                            {score} ({percentage}%)
                          </strong>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {ua.test?.endTime ? (
                          <small>
                            {new Date(ua.test.endTime).toLocaleDateString(
                              "en-GB"
                            )}
                          </small>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer>
          <Link href="/assignments" role="button" className="secondary">
            Back to Assignments
          </Link>
        </footer>
      </article>
    </main>
  );
}
