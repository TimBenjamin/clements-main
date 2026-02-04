import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { User, UserType } from "@prisma/client";

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Hash a plaintext password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a plaintext password against a bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(): string {
  return (
    Math.random().toString(36).substring(2) +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSecureToken();

  // Create session in database
  await prisma.userSession.create({
    data: {
      userId,
      sessionId,
      lastAction: new Date(),
    },
  });

  // Update user's session_id field (for compatibility)
  await prisma.user.update({
    where: { id: userId },
    data: { sessionId },
  });

  return sessionId;
}

/**
 * Get the current user from session cookie
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const session = await prisma.userSession.findFirst({
    where: { sessionId },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Update last action timestamp
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastAction: new Date() },
  });

  return session.user;
}

/**
 * Get user from session ID (for middleware)
 */
export async function getUserFromSession(
  sessionId: string
): Promise<User | null> {
  const session = await prisma.userSession.findFirst({
    where: { sessionId },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Update last action
  await prisma.userSession.update({
    where: { id: session.id },
    data: { lastAction: new Date() },
  });

  return session.user;
}

/**
 * Set session cookie
 */
export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Delete session cookie and database record
 */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    // Delete from database
    await prisma.userSession.deleteMany({
      where: { sessionId },
    });

    // Clear user's session_id field
    await prisma.user.updateMany({
      where: { sessionId },
      data: { sessionId: null },
    });
  }

  // Delete cookie
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(user: User): boolean {
  // org and admin users always have access
  if (user.type === "org" || user.type === "admin") {
    return true;
  }

  // ind and stu users need valid expiry
  if (!user.expiry) {
    return false;
  }

  return user.expiry > new Date();
}

/**
 * Check if user can access a resource based on their type
 */
export function canAccess(user: User, requiredTypes: UserType[]): boolean {
  return requiredTypes.includes(user.type);
}

/**
 * Require user to be logged in (for use in Server Components)
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Require user to have specific type (for use in Server Components)
 */
export async function requireUserType(
  allowedTypes: UserType[]
): Promise<User> {
  const user = await requireAuth();

  if (!canAccess(user, allowedTypes)) {
    throw new Error("Forbidden");
  }

  return user;
}
