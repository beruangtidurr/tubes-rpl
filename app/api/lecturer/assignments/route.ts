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

export async function GET(req: NextRequest) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const assignments = await sql`
      SELECT 
        a.id,
        a.course_id,
        a.title,
        a.description,
        a.num_teams,
        a.max_members_per_team,
        a.created_at,
        c.title as course_title,
        COUNT(DISTINCT t.id) as teams_created
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN course_assignments ca ON ca.course_id = c.id
      LEFT JOIN teams t ON t.assignment_id = a.id
      WHERE ca.lecturer_id = ${authCheck.userId}
      GROUP BY a.id, c.title
      ORDER BY a.created_at DESC
    `;

    return NextResponse.json({
      assignments: assignments,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { courseId, title, description, numTeams, maxMembersPerTeam } = await req.json();

    if (!courseId || !title || !numTeams || !maxMembersPerTeam) {
      return NextResponse.json(
        { error: "Course ID, title, number of teams, and max members are required" },
        { status: 400 }
      );
    }

    const courseCheck = await sql`
      SELECT id FROM course_assignments
      WHERE lecturer_id = ${authCheck.userId} AND course_id = ${courseId}
    `;

    if (courseCheck.length === 0) {
      return NextResponse.json(
        { error: "You are not assigned to this course" },
        { status: 403 }
      );
    }

    const assignmentResult = await sql`
      INSERT INTO assignments (
        course_id, 
        title, 
        description, 
        num_teams, 
        max_members_per_team,
        created_by
      )
      VALUES (
        ${courseId}, 
        ${title}, 
        ${description || null}, 
        ${numTeams}, 
        ${maxMembersPerTeam},
        ${authCheck.userId}
      )
      RETURNING id
    `;

    const assignmentId = assignmentResult[0].id;

    for (let i = 1; i <= numTeams; i++) {
      await sql`
        INSERT INTO teams (assignment_id, name, max_members)
        VALUES (${assignmentId}, ${`Team ${i}`}, ${maxMembersPerTeam})
      `;
    }

    return NextResponse.json({
      success: true,
      assignmentId: assignmentId,
      message: "Assignment and teams created successfully",
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
