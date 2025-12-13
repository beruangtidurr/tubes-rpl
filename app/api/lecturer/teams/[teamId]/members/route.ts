// app/api/lecturer/teams/[teamId]/members/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { isPastSemester } from "@/lib/academicYear";

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

// POST: Add student to team
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { teamId } = await params;
    const { userId, userName } = await req.json();

    if (!userId || !userName) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }

    // Verify lecturer has access to this team
    const teamCheck = await sql`
      SELECT 
        t.id, 
        t.assignment_id, 
        t.max_members,
        a.academic_year,
        a.semester,
        COUNT(tm.id) as current_members
      FROM teams t
      JOIN assignments a ON a.id = t.assignment_id
      JOIN course_assignments ca ON ca.course_id = a.course_id
      LEFT JOIN team_members tm ON tm.team_id = t.id
      WHERE t.id = ${teamId} AND ca.lecturer_id = ${authCheck.userId}
      GROUP BY t.id, t.assignment_id, t.max_members, a.academic_year, a.semester
    `;

    if (teamCheck.length === 0) {
      return NextResponse.json(
        { error: "Team not found or unauthorized" },
        { status: 403 }
      );
    }

    const team = teamCheck[0];
    const assignmentId = team.assignment_id;
    const academicYear = team.academic_year;
    const semester = team.semester;

    // Check if this is a past semester - if so, prevent editing
    if (isPastSemester(academicYear, semester)) {
      return NextResponse.json(
        { error: "Cannot modify team members for past semesters." },
        { status: 403 }
      );
    }

    // Check if team is full
    if (parseInt(team.current_members) >= team.max_members) {
      return NextResponse.json(
        { error: "Team is full. Maximum members reached." },
        { status: 400 }
      );
    }

    // Check if user is already in a team for this assignment
    const existingTeamMember = await sql`
      SELECT tm.id, t.id as team_id, t.name as team_name
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.assignment_id = ${assignmentId} AND tm.user_id = ${userId}
    `;

    if (existingTeamMember.length > 0) {
      // If user is in a different team, remove them from that team first
      if (existingTeamMember[0].team_id.toString() !== teamId) {
        await sql`
          DELETE FROM team_members 
          WHERE id = ${existingTeamMember[0].id}
        `;
      } else {
        return NextResponse.json(
          { error: "Student is already in this team" },
          { status: 400 }
        );
      }
    }

    // Verify user is enrolled in the course
    const courseCheck = await sql`
      SELECT ce.id
      FROM course_enrollments ce
      JOIN assignments a ON a.course_id = ce.course_id
      WHERE a.id = ${assignmentId} AND ce.user_id = ${userId}
    `;

    if (courseCheck.length === 0) {
      return NextResponse.json(
        { error: "Student is not enrolled in this course" },
        { status: 400 }
      );
    }

    // Add user to team
    const result = await sql`
      INSERT INTO team_members (team_id, user_id, user_name)
      VALUES (${teamId}, ${userId}, ${userName})
      ON CONFLICT (team_id, user_id) DO NOTHING
      RETURNING *
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Failed to add student to team" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      member: result[0],
      message: "Student added to team successfully"
    });
  } catch (error) {
    console.error("Error adding student to team:", error);
    return NextResponse.json(
      { error: "Failed to add student to team" },
      { status: 500 }
    );
  }
}

// DELETE: Remove student from team
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { teamId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify lecturer has access to this team
    const teamCheck = await sql`
      SELECT 
        t.id, 
        t.assignment_id,
        a.academic_year,
        a.semester
      FROM teams t
      JOIN assignments a ON a.id = t.assignment_id
      JOIN course_assignments ca ON ca.course_id = a.course_id
      WHERE t.id = ${teamId} AND ca.lecturer_id = ${authCheck.userId}
    `;

    if (teamCheck.length === 0) {
      return NextResponse.json(
        { error: "Team not found or unauthorized" },
        { status: 403 }
      );
    }

    const academicYear = teamCheck[0].academic_year;
    const semester = teamCheck[0].semester;

    // Check if this is a past semester - if so, prevent editing
    if (isPastSemester(academicYear, semester)) {
      return NextResponse.json(
        { error: "Cannot modify team members for past semesters." },
        { status: 403 }
      );
    }

    // Check if user is a member of this team
    const memberCheck = await sql`
      SELECT id FROM team_members
      WHERE team_id = ${teamId} AND user_id = ${userId}
    `;

    if (memberCheck.length === 0) {
      return NextResponse.json(
        { error: "Student is not a member of this team" },
        { status: 400 }
      );
    }

    // Remove user from team
    await sql`
      DELETE FROM team_members 
      WHERE team_id = ${teamId} AND user_id = ${userId}
    `;

    return NextResponse.json({
      success: true,
      message: "Student removed from team successfully"
    });
  } catch (error) {
    console.error("Error removing student from team:", error);
    return NextResponse.json(
      { error: "Failed to remove student from team" },
      { status: 500 }
    );
  }
}

