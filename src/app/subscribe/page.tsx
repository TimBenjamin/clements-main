import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function SubscribePage() {
  const user = await getCurrentUser();

  return (
    <main className="container">
      <article style={{ maxWidth: "800px", margin: "2rem auto" }}>
        <header>
          <h1>Subscribe to Clements Music Theory</h1>
          <p>Get unlimited access to all features</p>
        </header>

        <section>
          <h2>Monthly Subscription - £10/month</h2>
          <ul>
            <li>Unlimited practice questions across all grades</li>
            <li>Progress tracking and detailed statistics</li>
            <li>Access to comprehensive study guides</li>
            <li>Cancel anytime</li>
          </ul>

          <p>
            <strong>Note:</strong> Stripe integration coming soon. For now, this
            is a placeholder page.
          </p>

          {user ? (
            <div>
              <p>Logged in as: {user.email}</p>
              <Link href="/dashboard" role="button" className="secondary">
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <Link href="/register" role="button">
              Create Account to Subscribe
            </Link>
          )}
        </section>
      </article>
    </main>
  );
}
