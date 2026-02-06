import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { inviteStudent } from "../actions/students";
import { StudentTableRow } from "@/components/StudentTableRow";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireAuth();

  // Only org users can access this page
  if (user.type !== "org" && user.type !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  // Get organization's students
  const orgStudents = await prisma.orgStudentUser.findMany({
    where: {
      orgUserId: user.id,
    },
    include: {
      student: {
        include: {
          _count: {
            select: {
              tests: true,
              userQuestions: true,
            },
          },
        },
      },
    },
    orderBy: {
      student: {
        name: "asc",
      },
    },
  });

  return (
    <main className="container">
      <article>
        <header>
          <h1>Manage Students</h1>
          <p>
            {orgStudents.length} / {user.licenses || 0} student licenses used
          </p>
        </header>

        {params.success === "invited" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Student invitation sent successfully!
          </div>
        )}

        {params.success === "removed" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Student removed successfully
          </div>
        )}

        {params.error === "no_licenses" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            You have no available student licenses. Please contact us to add
            more.
          </div>
        )}

        {params.error === "already_exists" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            This student is already linked to your organization
          </div>
        )}

        {params.error === "email_taken" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            A user with this email already exists
          </div>
        )}

        {/* Add Student Form */}
        <section>
          <h2>Add New Student</h2>
          <form action={inviteStudent}>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label>
                  Student Name
                  <input
                    type="text"
                    name="name"
                    placeholder="John Smith"
                    required
                    minLength={2}
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    name="email"
                    placeholder="student@school.com"
                    required
                  />
                </label>
              </div>

              <label>
                Display Name / Username
                <input
                  type="text"
                  name="displayname"
                  placeholder="jsmith"
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9-]+"
                />
                <small>Letters, numbers, and hyphens only</small>
              </label>

              <button
                type="submit"
                disabled={orgStudents.length >= (user.licenses || 0)}
              >
                {orgStudents.length >= (user.licenses || 0)
                  ? "No Licenses Available"
                  : "Add Student"}
              </button>
            </div>
          </form>
        </section>

        {/* Students List */}
        {orgStudents.length > 0 ? (
          <section>
            <h2>Your Students</h2>
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Display Name</th>
                    <th>Email</th>
                    <th>Tests Taken</th>
                    <th>Questions Answered</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgStudents.map((orgStudent) => (
                    <StudentTableRow
                      key={orgStudent.id}
                      student={orgStudent.student}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section>
            <div role="alert">
              <p>No students yet. Add your first student above.</p>
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
