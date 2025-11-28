// app/api/teams/[teamId]/join/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { userId, userName } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { error: "User ID and name are required" },
        { status: 400 }
      );
    }

    // Check if team exists and get current member count
    const teamCheck = await sql`
      SELECT 
        t.id,
        t.max_members,
        COUNT(tm.id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = ${teamId}
      GROUP BY t.id, t.max_members
    `;

    if (teamCheck.length === 0) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const team = teamCheck[0];
    const currentCount = parseInt(team.member_count);

    // Check if team is full
    if (currentCount >= team.max_members) {
      return NextResponse.json(
        { error: "Team is full" },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingMember = await sql`
      SELECT id FROM team_members
      WHERE team_id = ${teamId} AND user_id = ${userId}
    `;

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // Add user to team
    const result = await sql`
      INSERT INTO team_members (team_id, user_id, user_name)
      VALUES (${teamId}, ${userId}, ${userName})
      RETURNING *
    `;

    return NextResponse.json(
      { 
        success: true, 
        member: result[0],
        message: "Successfully joined team"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error joining team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
