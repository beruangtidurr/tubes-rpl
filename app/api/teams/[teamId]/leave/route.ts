import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a member of this team
    const existingMember = await sql`
      SELECT id FROM team_members
      WHERE team_id = ${teamId} AND user_id = ${userId}
    `;

    if (existingMember.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this team" },
        { status: 400 }
      );
    }

    // Remove user from team
    await sql`
      DELETE FROM team_members 
      WHERE team_id = ${teamId} AND user_id = ${userId}
    `;

    return NextResponse.json(
      { 
        success: true,
        message: "Successfully left team"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error leaving team:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
