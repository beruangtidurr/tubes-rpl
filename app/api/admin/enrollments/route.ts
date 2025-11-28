// app/api/admin/enrollments/route.ts
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

// GET all enrollments
export async function GET(req: NextRequest) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const enrollments = await sql`
      SELECT ce.id, ce.user_id, ce.course_id, u.name as user_name, c.title as course_title
      FROM course_enrollments ce
      JOIN users u ON ce.user_id = u.id
      JOIN courses c ON ce.course_id = c.id
      ORDER BY ce.id DESC
    `;

    return NextResponse.json({
      enrollments: enrollments,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

// POST - Create new enrollment
export async function POST(req: NextRequest) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { courseId, userId } = body;

    if (!courseId || !userId) {
      return NextResponse.json(
        { error: "Course ID and User ID are required" },
        { status: 400 }
      );
    }

    // Check if enrollment already exists
    const existing = await sql`
      SELECT id FROM course_enrollments
      WHERE user_id = ${userId} AND course_id = ${courseId}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Student is already enrolled in this course" },
        { status: 400 }
      );
    }

    // Create enrollment
    const result = await sql`
      INSERT INTO course_enrollments (user_id, course_id)
      VALUES (${userId}, ${courseId})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      enrollmentId: result[0].id,
      message: "Student enrolled successfully",
    });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}
