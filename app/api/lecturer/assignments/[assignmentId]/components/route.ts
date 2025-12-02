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

    // Verify lecturer owns this assignment
    const assignmentCheck = await sql`
      SELECT a.id 
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

    const components = await sql`
      SELECT *
      FROM grade_components
      WHERE assignment_id = ${assignmentId}
      ORDER BY component_order, id
    `;

    return NextResponse.json({ components });
  } catch (error) {
    console.error("Error fetching grade components:", error);
    return NextResponse.json(
      { error: "Failed to fetch grade components" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { assignmentId } = await params;
    const { name, description, maxScore, weight, rubric, componentOrder } = await req.json();

    // Verify lecturer owns this assignment
    const assignmentCheck = await sql`
      SELECT a.id 
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

    // Validate inputs
    if (!name || maxScore <= 0 || weight < 0 || weight > 100) {
      return NextResponse.json(
        { error: "Invalid component data" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO grade_components (
        assignment_id, name, description, max_score, weight, rubric, component_order
      )
      VALUES (
        ${assignmentId}, ${name}, ${description || null}, ${maxScore}, 
        ${weight}, ${rubric || null}, ${componentOrder || 1}
      )
      RETURNING *
    `;

    return NextResponse.json({ 
      success: true, 
      component: result[0] 
    });
  } catch (error) {
    console.error("Error creating grade component:", error);
    return NextResponse.json(
      { error: "Failed to create grade component" },
      { status: 500 }
    );
  }
}
