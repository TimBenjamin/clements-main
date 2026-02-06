import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface PracticeSessionData {
  testId?: number;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long_for_security",
  cookieName: "clements_practice_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 60 * 4, // 4 hours
  },
};

export async function getPracticeSession(): Promise<IronSession<PracticeSessionData>> {
  return getIronSession<PracticeSessionData>(await cookies(), sessionOptions);
}
