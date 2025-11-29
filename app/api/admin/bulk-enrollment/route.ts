// app/api/admin/bulk-enrollment/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function checkAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  
  if (!tokenCookie) {
    return { authorized: false, error: "Not authenticated" };
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as {
      id: string;
      role: string;
    };

    if (decoded.role !== "ADMIN") {
      return { authorized: false, error: "Access denied. Admin only." };
    }

    return { authorized: true };
  } catch (err) {
    return { authorized: false, error: "Invalid token" };
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { courseId, emails } = body;

    if (!courseId || !emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: "Course ID and emails array are required" },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { email: string; reason: string }[],
      skipped: [] as { email: string; reason: string }[],
    };

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase();
      
      if (!trimmedEmail) {
        results.skipped.push({ email, reason: "Empty email" });
        continue;
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        results.failed.push({ email, reason: "Invalid email format" });
        continue;
      }

      try {
        // Find user by email
        const users = await sql`
          SELECT id, role FROM users WHERE email = ${trimmedEmail}
        `;

        if (users.length === 0) {
          results.failed.push({ email: trimmedEmail, reason: "User not found" });
          continue;
        }

        const user = users[0];

        // Check if user is a student
        if (user.role !== 'STUDENT') {
          results.failed.push({ 
            email: trimmedEmail, 
            reason: `User is not a student (role: ${user.role})` 
          });
          continue;
        }

        // Check if already enrolled
        const existing = await sql`
          SELECT id FROM course_enrollments
          WHERE user_id = ${user.id} AND course_id = ${courseId}
        `;

        if (existing.length > 0) {
          results.skipped.push({ 
            email: trimmedEmail, 
            reason: "Already enrolled" 
          });
          continue;
        }

        // Enroll the student
        await sql`
          INSERT INTO course_enrollments (user_id, course_id)
          VALUES (${user.id}, ${courseId})
        `;

        results.success.push(trimmedEmail);
      } catch (error) {
        console.error(`Error enrolling ${trimmedEmail}:`, error);
        results.failed.push({ 
          email: trimmedEmail, 
          reason: "Database error" 
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: emails.length,
        enrolled: results.success.length,
        failed: results.failed.length,
        skipped: results.skipped.length,
      },
    });
  } catch (error) {
    console.error("Error in bulk enrollment:", error);
    return NextResponse.json(
      { error: "Failed to process bulk enrollment" },
      { status: 500 }
    );
  }
}
