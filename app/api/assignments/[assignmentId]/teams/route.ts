import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { assignmentId } = await params;

    // Get teams for this assignment and their members
    const teams = await sql`
      SELECT 
        t.id,
        t.name,
        t.max_members,
        COUNT(tm.id) as member_count,
        json_agg(
          json_build_object(
            'id', tm.id,
            'user_id', tm.user_id,
            'user_name', tm.user_name,
            'joined_at', tm.joined_at
          )
          ORDER BY tm.joined_at
        ) FILTER (WHERE tm.id IS NOT NULL) as members
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.assignment_id = ${assignmentId}
      GROUP BY t.id, t.name, t.max_members
      ORDER BY t.name
    `;

    // Format the data
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      maxMembers: team.max_members,
      memberCount: parseInt(team.member_count),
      members: team.members || [],
    }));

    return NextResponse.json({ teams: formattedTeams });
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}
