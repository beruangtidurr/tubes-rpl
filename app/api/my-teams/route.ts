// app/api/my-teams/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function getUserFromToken(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  
  if (!tokenCookie) {
    return null;
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as {
      id: string;
      role: string;
    };

    return decoded;
  } catch (err) {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromToken(req);
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    console.log("Fetching teams for user ID:", user.id);

    // Get all teams the current user is part of
    // Now joining through assignments table since teams.assignment_id -> assignments.course_id
    const myTeams = await sql`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        c.id as course_id,
        c.title as course_title,
        a.id as assignment_id,
        a.title as assignment_title
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      JOIN assignments a ON t.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE tm.user_id = ${user.id}
      ORDER BY c.title, a.title, t.name
    `;

    console.log("Found teams:", myTeams.length);

    // For each team, get all members
    const teamsWithMembers = await Promise.all(
      myTeams.map(async (team) => {
        const members = await sql`
          SELECT 
            u.id,
            u.name,
            u.email
          FROM team_members tm
          JOIN users u ON tm.user_id = u.id
          WHERE tm.team_id = ${team.team_id}
          ORDER BY u.name
        `;

        return {
          course_id: team.course_id,
          course_title: team.course_title,
          assignment_id: team.assignment_id,
          assignment_title: team.assignment_title,
          team_id: team.team_id,
          team_name: team.team_name,
          members: members,
        };
      })
    );

    return NextResponse.json({
      teams: teamsWithMembers,
    });
  } catch (error) {
    console.error("Error fetching teams:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch teams";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
