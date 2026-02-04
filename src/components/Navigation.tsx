import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export async function Navigation() {
  const user = await getCurrentUser();

  return (
    <nav className="container-fluid">
      <ul>
        <li>
          <strong>
            <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
              Clements Music Theory
            </Link>
          </strong>
        </li>
      </ul>
      <ul>
        {user ? (
          <>
            <li>
              <Link href="/practice">Practice</Link>
            </li>
            <li>
              <Link href="/tests">Tests</Link>
            </li>
            <li>
              <Link href="/progress">Progress</Link>
            </li>
            {(user.type === "org" || user.type === "admin") && (
              <li>
                <Link href="/assignments">Assignments</Link>
              </li>
            )}
            {user.type === "org" && (
              <li>
                <Link href="/students">Students</Link>
              </li>
            )}
            {user.type === "admin" && (
              <li>
                <Link href="/admin">Admin</Link>
              </li>
            )}
            <li>
              <details role="list">
                <summary aria-haspopup="listbox">{user.displayname}</summary>
                <ul role="listbox">
                  <li>
                    <Link href="/dashboard">Dashboard</Link>
                  </li>
                  <li>
                    <Link href="/account">Account Settings</Link>
                  </li>
                  {(user.type === "ind" || user.type === "stu") &&
                    (!user.expiry || user.expiry < new Date()) && (
                      <li>
                        <Link href="/subscribe">
                          <strong>Subscribe</strong>
                        </Link>
                      </li>
                    )}
                  <li>
                    <form action={logout} style={{ margin: 0 }}>
                      <button
                        type="submit"
                        className="secondary"
                        style={{
                          width: "100%",
                          marginBottom: 0,
                          textAlign: "left",
                        }}
                      >
                        Log Out
                      </button>
                    </form>
                  </li>
                </ul>
              </details>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/subscribe" role="button" className="outline">
                Subscribe
              </Link>
            </li>
            <li>
              <Link href="/login" role="button">
                Log In
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
