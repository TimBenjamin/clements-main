import { redirect } from "next/navigation";
import { login } from "../actions/auth";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  // If already logged in, redirect to dashboard
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const success = params.success;
  const error = params.error;

  return (
    <main className="container">
      <article style={{ maxWidth: "500px", margin: "2rem auto" }}>
        <header>
          <h1>Log In</h1>
          <p>Welcome back to Clements Theory</p>
        </header>

        {success === "password_reset" && (
          <div role="alert" style={{ backgroundColor: "var(--ins-color)" }}>
            Password reset successfully! You can now log in.
          </div>
        )}

        {error === "invalid" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Invalid email or password
          </div>
        )}

        {error === "expired" && (
          <div role="alert" style={{ backgroundColor: "var(--del-color)" }}>
            Your subscription has expired. Please renew to continue.
          </div>
        )}

        <form action={login}>
          <label>
            Email
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="Your password"
              required
              autoComplete="current-password"
              minLength={6}
            />
          </label>

          <button type="submit">Log In</button>
        </form>

        <footer>
          <p>
            Don't have an account? <Link href="/register">Register here</Link>
          </p>
          <p>
            <Link href="/forgot-password">Forgot password?</Link>
          </p>
        </footer>
      </article>
    </main>
  );
}
