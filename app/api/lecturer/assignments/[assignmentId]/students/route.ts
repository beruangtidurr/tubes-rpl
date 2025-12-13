// app/api/lecturer/assignments/[assignmentId]/students/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function checkLecturer(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  
  if (!tokenCookie) {
    return { authorized: false, error: "Not authenticated", userId: null };
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as {
      id: string;
      role: string;
    };

    if (decoded.role !== "LECTURER") {
      return { authorized: false, error: "Access denied. Lecturer only.", userId: null };
    }

    return { authorized: true, userId: decoded.id };
  } catch (err) {
    return { authorized: false, error: "Invalid token", userId: null };
  }
}

// GET: Get all students enrolled in the course for this assignment
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { assignmentId } = await params;

    // Verify lecturer has access to this assignment
    const assignmentCheck = await sql`
      SELECT a.id, a.course_id
      FROM assignments a
      JOIN course_assignments ca ON ca.course_id = a.course_id
      WHERE a.id = ${assignmentId} AND ca.lecturer_id = ${authCheck.userId}
    `;

    if (assignmentCheck.length === 0) {
      return NextResponse.json(
        { error: "Assignment not found or unauthorized" },
        { status: 403 }
      );
    }

    const courseId = assignmentCheck[0].course_id;

    // Get all students enrolled in this course
    const students = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(
          (SELECT t.id 
           FROM teams t
           INNER JOIN team_members tm ON tm.team_id = t.id
           WHERE t.assignment_id = ${assignmentId} AND tm.user_id = u.id
           LIMIT 1),
          NULL
        ) as current_team_id,
        COALESCE(
          (SELECT t.name 
           FROM teams t
           INNER JOIN team_members tm ON tm.team_id = t.id
           WHERE t.assignment_id = ${assignmentId} AND tm.user_id = u.id
           LIMIT 1),
          NULL
        ) as current_team_name
      FROM users u
      INNER JOIN course_enrollments ce ON ce.user_id = u.id
      WHERE ce.course_id = ${courseId} AND u.role = 'STUDENT'
      ORDER BY u.name
    `;

    return NextResponse.json({
      students: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

