"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

/**
 * Invite/add a new student to the organization
 */
export async function inviteStudent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user || (user.type !== "org" && user.type !== "admin")) {
    redirect("/login");
  }

  const name = formData.get("name") as string;
  const displayname = formData.get("displayname") as string;
  const email = formData.get("email") as string;

  // Validation
  if (!name || name.length < 2) {
    redirect("/students?error=name");
  }

  if (!displayname || displayname.length < 3) {
    redirect("/students?error=displayname");
  }

  if (!/^[a-zA-Z0-9-]+$/.test(displayname)) {
    redirect("/students?error=displayname_invalid");
  }

  if (!email || !email.includes("@")) {
    redirect("/students?error=email");
  }

  // Check if org has available licenses
  const currentStudents = await prisma.orgStudentUser.count({
    where: { orgUserId: user.id },
  });

  if (currentStudents >= (user.licenses || 0)) {
    redirect("/students?error=no_licenses");
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findFirst({
    where: { email },
  });

  if (existingEmail) {
    redirect("/students?error=email_taken");
  }

  // Check if displayname already exists
  const existingDisplayname = await prisma.user.findUnique({
    where: { displayname },
  });

  if (existingDisplayname) {
    redirect("/students?error=displayname_taken");
  }

  try {
    // Generate a temporary password (student will be prompted to change it)
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashedPassword = await hashPassword(tempPassword);

    // Create student user
    const student = await prisma.user.create({
      data: {
        type: "stu",
        name,
        displayname,
        email,
        username: email,
        password: hashedPassword,
        expiry: user.expiry, // Inherit org's expiry
      },
    });

    // Link student to organization
    await prisma.orgStudentUser.create({
      data: {
        orgUserId: user.id,
        stuUserId: student.id,
      },
    });

    // Send welcome email with temporary password
    await sendWelcomeEmail(email, name);

    redirect("/students?success=invited");
  } catch (error) {
    console.error("Student invitation error:", error);
    redirect("/students?error=server");
  }
}

/**
 * Remove a student from the organization
 */
export async function removeStudent(formData: FormData): Promise<void> {
  const user = await getCurrentUser();

  if (!user || (user.type !== "org" && user.type !== "admin")) {
    redirect("/login");
  }

  const studentId = parseInt(formData.get("studentId") as string);

  if (isNaN(studentId)) {
    redirect("/students?error=invalid");
  }

  try {
    // Remove the link (student account remains but loses org access)
    await prisma.orgStudentUser.deleteMany({
      where: {
        orgUserId: user.id,
        stuUserId: studentId,
      },
    });

    redirect("/students?success=removed");
  } catch (error) {
    console.error("Student removal error:", error);
    redirect("/students?error=server");
  }
}
