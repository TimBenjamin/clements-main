import { requireAuth } from "@/lib/auth";
import { logout } from "../actions/auth";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <main className="container">
      <h1>Dashboard</h1>
      <p>Welcome back, {user.name}!</p>

      <section>
        <h2>Your Account</h2>
        <ul>
          <li>
            <strong>Display Name:</strong> {user.displayname}
          </li>
          <li>
            <strong>Email:</strong> {user.email}
          </li>
          <li>
            <strong>Account Type:</strong>{" "}
            {user.type === "ind"
              ? "Individual"
              : user.type === "org"
                ? "Organization"
                : user.type === "stu"
                  ? "Student"
                  : "Administrator"}
          </li>
          {user.expiry && (
            <li>
              <strong>Subscription Expires:</strong>{" "}
              {new Date(user.expiry).toLocaleDateString()}
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2>Quick Links</h2>
        <nav>
          <ul>
            <li>
              <Link href="/practice">Practice Questions</Link>
            </li>
            <li>
              <Link href="/assignments">My Assignments</Link>
            </li>
            <li>
              <Link href="/study">Study Guides</Link>
            </li>
            <li>
              <Link href="/progress">My Progress</Link>
            </li>
            <li>
              <Link href="/account">Account Settings</Link>
            </li>
            {user.type === "org" && (
              <li>
                <Link href="/students">Manage Students</Link>
              </li>
            )}
            {(user.type === "org" || user.type === "admin") && (
              <li>
                <Link href="/assignments/create">Create Assignment</Link>
              </li>
            )}
            {user.type === "admin" && (
              <li>
                <Link href="/admin">Admin Panel</Link>
              </li>
            )}
          </ul>
        </nav>
      </section>

      <section>
        <form action={logout}>
          <button type="submit" className="secondary">
            Log Out
          </button>
        </form>
      </section>
    </main>
  );
}
