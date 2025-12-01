//app/api/lecturer/assignments/[assignmentId]/route.ts

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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { assignmentId } = await params;
    const { 
      title, 
      description, 
      numTeams, 
      maxMembersPerTeam,
      assignmentDueDate,
      gradingDueDate
    } = await req.json();

    // Verify lecturer owns this assignment
    const assignmentCheck = await sql`
      SELECT a.id, a.num_teams
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

    const currentNumTeams = assignmentCheck[0].num_teams;

    // Validate dates if provided
    if (assignmentDueDate && gradingDueDate) {
      const assignmentDate = new Date(assignmentDueDate);
      const gradingDate = new Date(gradingDueDate);
      
      if (gradingDate < assignmentDate) {
        return NextResponse.json(
          { error: "Grading due date must be after assignment due date" },
          { status: 400 }
        );
      }
    }

    // Format dates
    const formattedAssignmentDueDate = assignmentDueDate ? new Date(assignmentDueDate).toISOString() : null;
    const formattedGradingDueDate = gradingDueDate ? new Date(gradingDueDate).toISOString() : null;

    // Update assignment
    await sql`
      UPDATE assignments
      SET 
        title = ${title},
        description = ${description || null},
        num_teams = ${numTeams},
        max_members_per_team = ${maxMembersPerTeam},
        assignment_due_date = ${formattedAssignmentDueDate},
        grading_due_date = ${formattedGradingDueDate},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${assignmentId}
    `;

    // If number of teams increased, create new teams
    if (numTeams > currentNumTeams) {
      for (let i = currentNumTeams + 1; i <= numTeams; i++) {
        await sql`
          INSERT INTO teams (assignment_id, name, max_members)
          VALUES (${assignmentId}, ${`Team ${i}`}, ${maxMembersPerTeam})
        `;
      }
    }

    // If number of teams decreased, delete extra teams (only if they have no members)
    if (numTeams < currentNumTeams) {
      // Get teams with no members that can be deleted
      const teamsToDelete = await sql`
        SELECT t.id
        FROM teams t
        LEFT JOIN team_members tm ON tm.team_id = t.id
        WHERE t.assignment_id = ${assignmentId}
        GROUP BY t.id
        HAVING COUNT(tm.id) = 0
        ORDER BY t.id DESC
        LIMIT ${currentNumTeams - numTeams}
      `;

      for (const team of teamsToDelete) {
        await sql`
          DELETE FROM teams WHERE id = ${team.id}
        `;
      }
    }

    // Update max_members for all teams
    await sql`
      UPDATE teams
      SET max_members = ${maxMembersPerTeam}
      WHERE assignment_id = ${assignmentId}
    `;

    return NextResponse.json({
      success: true,
      message: "Assignment updated successfully",
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Delete assignment (teams and team_members will be cascade deleted)
    await sql`
      DELETE FROM assignments WHERE id = ${assignmentId}
    `;

    return NextResponse.json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
