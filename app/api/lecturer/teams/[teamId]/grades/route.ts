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
  { params }: { params: Promise<{ teamId: string }> }
) {
  const authCheck = await checkLecturer(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { teamId } = await params;

    // Verify lecturer has access to this team
    const teamCheck = await sql`
      SELECT t.id, t.assignment_id
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

    // Get team grades
    const teamGrades = await sql`
      SELECT 
        tg.*,
        gc.name as component_name,
        gc.max_score,
        gc.weight
      FROM team_grades tg
      JOIN grade_components gc ON gc.id = tg.component_id
      WHERE tg.team_id = ${teamId}
      ORDER BY gc.component_order, gc.id
    `;

    // Get individual student grades
    const studentGrades = await sql`
      SELECT 
        sg.*,
        gc.name as component_name,
        gc.max_score,
        gc.weight,
        tm.user_name,
        tm.user_id
      FROM student_grades sg
      JOIN grade_components gc ON gc.id = sg.component_id
      JOIN team_members tm ON tm.id = sg.team_member_id
      WHERE tm.team_id = ${teamId}
      ORDER BY tm.user_name, gc.component_order, gc.id
    `;

    // Get team feedback
    const feedback = await sql`
      SELECT *
      FROM team_feedback
      WHERE team_id = ${teamId}
    `;

    return NextResponse.json({
      teamGrades,
      studentGrades,
      feedback: feedback[0] || null
    });
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json(
      { error: "Failed to fetch grades" },
      { status: 500 }
    );
  }
}

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
    const { 
      componentId, 
      score, 
      notes, 
      applyToAll, 
      individualGrades,
      overallFeedback 
    } = await req.json();

    // Verify lecturer has access to this team
    const teamCheck = await sql`
      SELECT t.id, t.assignment_id
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

    const assignmentId = teamCheck[0].assignment_id;

    // If applyToAll is true, save as team grade
    if (applyToAll && componentId && score !== undefined) {
      await sql`
        INSERT INTO team_grades (team_id, component_id, score, notes, graded_by)
        VALUES (${teamId}, ${componentId}, ${score}, ${notes || null}, ${authCheck.userId})
        ON CONFLICT (team_id, component_id) 
        DO UPDATE SET 
          score = ${score},
          notes = ${notes || null},
          graded_by = ${authCheck.userId},
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    // If individualGrades provided, save individual student grades
    if (individualGrades && Array.isArray(individualGrades)) {
      for (const grade of individualGrades) {
        const { teamMemberId, componentId, score, notes } = grade;
        
        await sql`
          INSERT INTO student_grades (team_member_id, component_id, score, notes, graded_by)
          VALUES (${teamMemberId}, ${componentId}, ${score}, ${notes || null}, ${authCheck.userId})
          ON CONFLICT (team_member_id, component_id)
          DO UPDATE SET 
            score = ${score},
            notes = ${notes || null},
            graded_by = ${authCheck.userId},
            updated_at = CURRENT_TIMESTAMP
        `;
      }
    }

    // Save overall feedback if provided
    if (overallFeedback !== undefined) {
      await sql`
        INSERT INTO team_feedback (team_id, assignment_id, overall_notes, created_by)
        VALUES (${teamId}, ${assignmentId}, ${overallFeedback}, ${authCheck.userId})
        ON CONFLICT (team_id, assignment_id)
        DO UPDATE SET 
          overall_notes = ${overallFeedback},
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Grades saved successfully"
    });
  } catch (error) {
    console.error("Error saving grades:", error);
    return NextResponse.json(
      { error: "Failed to save grades" },
      { status: 500 }
    );
  }
}
