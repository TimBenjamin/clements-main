import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="container">
      <section>
        <header>
          <h1>Clements Music Theory</h1>
          <p>Master music theory with our comprehensive e-learning platform</p>
        </header>

        {user ? (
          <div>
            <p>Welcome back, <strong>{user.displayname}</strong>!</p>
            <Link href="/dashboard" role="button">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div>
            <p>
              Join thousands of students improving their music theory skills
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link href="/login" role="button">
                Log In
              </Link>
              <Link href="/register" role="button" className="secondary">
                Create Account
              </Link>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2>Features</h2>
        <div className="grid">
          <article>
            <h3>Practice Questions</h3>
            <p>
              Access thousands of questions across all theory topics, from Grade
              1 to Grade 8
            </p>
          </article>
          <article>
            <h3>Progress Tracking</h3>
            <p>
              Monitor your improvement with detailed statistics and progress
              reports
            </p>
          </article>
          <article>
            <h3>Custom Assignments</h3>
            <p>
              Teachers can create and assign custom tests to their students
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
