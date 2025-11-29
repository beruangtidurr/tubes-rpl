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

    const teams = await sql`
      SELECT 
        t.id,
        t.name,
        t.max_members,
        t.created_at,
        COUNT(tm.id) as current_members
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      WHERE t.assignment_id = ${assignmentId}
      GROUP BY t.id, t.name, t.max_members, t.created_at
      ORDER BY t.name
    `;

    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await sql`
          SELECT 
            tm.id,
            tm.user_id,
            tm.user_name,
            tm.joined_at
          FROM team_members tm
          WHERE tm.team_id = ${team.id}
          ORDER BY tm.joined_at
        `;

        return {
          ...team,
          members: members,
        };
      })
    );

    return NextResponse.json({
      teams: teamsWithMembers,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
