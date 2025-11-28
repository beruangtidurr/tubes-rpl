// app/api/admin/course-assignments/route.ts
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

// GET all course assignments
export async function GET(req: NextRequest) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const assignments = await sql`
      SELECT 
        ca.id,
        ca.lecturer_id,
        ca.course_id,
        u.name as lecturer_name,
        c.title as course_title
      FROM course_assignments ca
      JOIN users u ON ca.lecturer_id = u.id
      JOIN courses c ON ca.course_id = c.id
      ORDER BY c.title, u.name
    `;

    return NextResponse.json({
      assignments: assignments,
    });
  } catch (error) {
    console.error("Error fetching course assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch course assignments" },
      { status: 500 }
    );
  }
}

// POST - Create new course assignment
export async function POST(req: NextRequest) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { courseId, lecturerId } = await req.json();

    if (!courseId || !lecturerId) {
      return NextResponse.json(
        { error: "Course ID and Lecturer ID are required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO course_assignments (course_id, lecturer_id)
      VALUES (${courseId}, ${lecturerId})
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      assignmentId: result[0].id,
    });
  } catch (error) {
    console.error("Error creating course assignment:", error);
    return NextResponse.json(
      { error: "Failed to create course assignment" },
      { status: 500 }
    );
  }
}
