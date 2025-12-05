import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { userId, userName, assignmentId } = body;

    if (!userId || !userName || !assignmentId) {
      return NextResponse.json(
        { error: "User ID, name, and assignment ID are required" },
        { status: 400 }
      );
    }

    // FIRST: Check if user is already in ANY team for this assignment
    const existingMembership = await sql`
      SELECT 
        tm.id,
        tm.team_id,
        t.name as team_name
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE t.assignment_id = ${assignmentId} 
        AND tm.user_id = ${userId}
      LIMIT 1
    `;

    if (existingMembership.length > 0) {
      const existingTeamId = existingMembership[0].team_id.toString();
      const existingTeamName = existingMembership[0].team_name;
      
      // Check if they're trying to join the same team they're already in
      if (existingTeamId === teamId.toString()) {
        return NextResponse.json(
          { error: "You are already a member of this team" },
          { status: 400 }
        );
      }
      
      // They're trying to join a different team - not allowed!
      return NextResponse.json(
        { error: `You are already in team "${existingTeamName}" for this assignment. You must leave that team before joining another.` },
        { status: 400 }
      );
    }

    // SECOND: Check if team exists and get assignment_id to verify it matches
    const teamCheck = await sql`
      SELECT 
        t.id,
        t.max_members,
        t.assignment_id,
        COUNT(tm.id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id
      WHERE t.id = ${teamId}
      GROUP BY t.id, t.max_members, t.assignment_id
    `;

    if (teamCheck.length === 0) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const team = teamCheck[0];
    
    // Verify the assignment_id matches
    if (team.assignment_id.toString() !== assignmentId.toString()) {
      return NextResponse.json(
        { error: "Team does not belong to this assignment" },
        { status: 400 }
      );
    }

    const currentCount = parseInt(team.member_count);

    // THIRD: Check if team is full
    if (currentCount >= team.max_members) {
      return NextResponse.json(
        { error: "Team is full" },
        { status: 400 }
      );
    }

    // FOURTH: Add user to team (we've already verified they're not in any team for this assignment)
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
