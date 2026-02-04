import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AssignmentsPage() {
  const user = await requireAuth();
  const isOrgUser = user.type === "org" || user.type === "admin";

  if (isOrgUser) {
    // Org view
    const assignments = await prisma.assignment.findMany({
      where: {
        userId: user.id,
      },
      include: {
        _count: {
          select: {
            usersAssignments: true,
          },
        },
      },
      orderBy: {
        dateCreated: "desc",
      },
    });

    return (
      <main className="container">
        <article>
          <header>
            <h1>Assignments</h1>
            <p>Create and manage assignments for your students</p>
          </header>

          <section>
            <Link href="/assignments/create" role="button">
              Create New Assignment
            </Link>
          </section>

          {assignments.length === 0 ? (
            <section>
              <div role="alert">
                <p>No assignments created yet.</p>
                <Link href="/assignments/create" role="button">
                  Create Your First Assignment
                </Link>
              </div>
            </section>
          ) : (
            <section>
              <h2>Your Assignments</h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Created</th>
                      <th>Deadline</th>
                      <th>Students</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td>
                          <strong>{assignment.savename || "Untitled"}</strong>
                        </td>
                        <td>
                          <small>
                            {new Date(assignment.dateCreated).toLocaleDateString(
                              "en-GB"
                            )}
                          </small>
                        </td>
                        <td>
                          {assignment.deadline ? (
                            <small>
                              {new Date(assignment.deadline).toLocaleDateString(
                                "en-GB"
                              )}
                            </small>
                          ) : (
                            <small>No deadline</small>
                          )}
                        </td>
                        <td>{assignment._count.usersAssignments}</td>
                        <td>
                          <Link
                            href={`/assignments/${assignment.id}`}
                            role="button"
                            className="outline"
                            style={{
                              padding: "0.25rem 0.5rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <footer>
            <Link href="/dashboard" role="button" className="secondary">
              Back to Dashboard
            </Link>
          </footer>
        </article>
      </main>
    );
  }

  // Student view
  const userAssignments = await prisma.userAssignment.findMany({
    where: {
      userId: user.id,
    },
    include: {
      assignment: {
        include: {
          creator: {
            select: {
              name: true,
            },
          },
        },
      },
      test: true,
    },
    orderBy: {
      assignment: {
        dateCreated: "desc",
      },
    },
  });

  return (
    <main className="container">
      <article>
        <header>
          <h1>Assignments</h1>
          <p>View and complete your assigned work</p>
        </header>

        {userAssignments.length === 0 ? (
          <section>
            <div role="alert">
              <p>No assignments have been set for you yet.</p>
            </div>
          </section>
        ) : (
          <section>
            <h2>My Assignments</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {userAssignments.map((userAssignment) => {
                const assignment = userAssignment.assignment;
                const test = userAssignment.test;
                const isComplete = test?.complete || false;
                const isOverdue =
                  assignment.deadline && new Date(assignment.deadline) < new Date();

                return (
                  <div
                    key={userAssignment.id}
                    style={{
                      padding: "1rem",
                      backgroundColor: "var(--card-background-color)",
                      borderRadius: "var(--border-radius)",
                      borderLeft: isComplete
                        ? "4px solid var(--ins-color)"
                        : isOverdue
                          ? "4px solid var(--del-color)"
                          : "4px solid var(--secondary)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "1rem",
                      }}
                    >
                      <div>
                        <h3 style={{ marginBottom: "0.5rem" }}>
                          {assignment.savename || "Untitled Assignment"}
                        </h3>
                        <p>
                          <small>Set by {assignment.creator.name}</small>
                        </p>
                        {assignment.deadline && (
                          <p>
                            <small>
                              Due:{" "}
                              {new Date(assignment.deadline).toLocaleDateString(
                                "en-GB"
                              )}
                              {isOverdue && !isComplete && (
                                <strong style={{ color: "var(--del-color)" }}>
                                  {" "}
                                  (Overdue)
                                </strong>
                              )}
                            </small>
                          </p>
                        )}
                      </div>
                      <div>
                        {isComplete ? (
                          <div>
                            <span
                              style={{
                                color: "var(--ins-color)",
                                fontWeight: "bold",
                              }}
                            >
                              ✓ Complete
                            </span>
                            {test && (
                              <div>
                                <small>
                                  Score: {test.marks} / {test.marksAvailable}
                                </small>
                              </div>
                            )}
                          </div>
                        ) : (
                          <Link
                            href={`/assignments/${userAssignment.id}/start`}
                            role="button"
                          >
                            Start Assignment
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer>
          <Link href="/dashboard" role="button" className="secondary">
            Back to Dashboard
          </Link>
        </footer>
      </article>
    </main>
  );
}
