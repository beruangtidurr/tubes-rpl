// app/api/student/grades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import sql from '@/lib/db';

interface GradeComponent {
  id: number;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
  teamScore: number | null;
  individualScore: number | null;
  notes: string | null;
}

interface Team {
  id: number;
  name: string;
  members: Array<{ id: number; name: string }>;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  assignmentDueDate: string;
  gradingDueDate: string;
  team: Team;
  gradeComponents: GradeComponent[];
  overallFeedback: string | null;
  finalGrade: number | null;
}

interface Course {
  id: number;
  title: string;
  description: string;
  assignments: Assignment[];
}

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token and get user data
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.id;

    // Query to get all grades for the student
    const result = await sql`
      WITH student_courses AS (
        SELECT DISTINCT c.id, c.title, c.description
        FROM courses c
        INNER JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE ce.user_id = ${userId}
      ),
      student_assignments AS (
        SELECT 
          a.id,
          a.course_id,
          a.title,
          a.description,
          a.assignment_due_date,
          a.grading_due_date,
          t.id as team_id,
          t.name as team_name,
          tm.id as team_member_id
        FROM assignments a
        INNER JOIN teams t ON t.assignment_id = a.id
        INNER JOIN team_members tm ON tm.team_id = t.id
        WHERE tm.user_id = ${userId}
      )
      SELECT 
        sc.id as course_id,
        sc.title as course_title,
        sc.description as course_description,
        sa.id as assignment_id,
        sa.title as assignment_title,
        sa.description as assignment_description,
        sa.assignment_due_date,
        sa.grading_due_date,
        sa.team_id,
        sa.team_name,
        sa.team_member_id,
        
        gc.id as component_id,
        gc.name as component_name,
        gc.description as component_description,
        gc.max_score as component_max_score,
        gc.weight as component_weight,
        gc.component_order,
        
        tg.score as team_score,
        tg.notes as team_notes,
        tg.graded_at as team_graded_at,
        
        sg.score as individual_score,
        sg.notes as individual_notes,
        sg.graded_at as individual_graded_at,
        
        tf.overall_notes as overall_feedback,
        
        (
          SELECT json_agg(json_build_object('id', tm2.user_id, 'name', tm2.user_name))
          FROM team_members tm2
          WHERE tm2.team_id = sa.team_id
        ) as team_members
        
      FROM student_courses sc
      LEFT JOIN student_assignments sa ON sa.course_id = sc.id
      LEFT JOIN grade_components gc ON gc.assignment_id = sa.id
      LEFT JOIN team_grades tg ON tg.component_id = gc.id AND tg.team_id = sa.team_id
      LEFT JOIN student_grades sg ON sg.component_id = gc.id AND sg.team_member_id = sa.team_member_id
      LEFT JOIN team_feedback tf ON tf.assignment_id = sa.id AND tf.team_id = sa.team_id
      ORDER BY sc.id, sa.id, gc.component_order
    `;

    // Transform flat query results into nested structure
    const coursesMap = new Map<number, Course>();

    result.forEach((row: any) => {
      // Create or get course
      if (!coursesMap.has(row.course_id)) {
        coursesMap.set(row.course_id, {
          id: row.course_id,
          title: row.course_title,
          description: row.course_description,
          assignments: []
        });
      }

      const course = coursesMap.get(row.course_id);
      
      // Skip if no course or no assignment
      if (!course || !row.assignment_id) return;

      // Find or create assignment
      let assignment = course.assignments.find((a: Assignment) => a.id === row.assignment_id);
      if (!assignment) {
        assignment = {
          id: row.assignment_id,
          title: row.assignment_title,
          description: row.assignment_description,
          assignmentDueDate: row.assignment_due_date,
          gradingDueDate: row.grading_due_date,
          team: {
            id: row.team_id,
            name: row.team_name,
            members: row.team_members || []
          },
          gradeComponents: [],
          overallFeedback: row.overall_feedback,
          finalGrade: null
        };
        course.assignments.push(assignment);
      }

      // Add grade component if exists
      if (row.component_id) {
        const existingComponent = assignment.gradeComponents.find(
          gc => gc.id === row.component_id
        );

        if (!existingComponent) {
          assignment.gradeComponents.push({
            id: row.component_id,
            name: row.component_name,
            description: row.component_description,
            maxScore: parseFloat(row.component_max_score),
            weight: parseFloat(row.component_weight),
            teamScore: row.team_score ? parseFloat(row.team_score) : null,
            individualScore: row.individual_score ? parseFloat(row.individual_score) : null,
            notes: row.individual_notes || row.team_notes || null
          });
        }
      }
    });

    // Calculate final grades for each assignment
    coursesMap.forEach((course: Course) => {
      course.assignments.forEach((assignment: Assignment) => {
        if (assignment.gradeComponents.length > 0) {
          let totalWeightedScore = 0;
          let totalWeight = 0;

          assignment.gradeComponents.forEach((comp: GradeComponent) => {
            const score = comp.individualScore !== null 
              ? comp.individualScore 
              : comp.teamScore;
            
            if (score !== null) {
              totalWeightedScore += (score * comp.weight);
              totalWeight += comp.weight;
            }
          });

          if (totalWeight > 0) {
            assignment.finalGrade = parseFloat(
              (totalWeightedScore / totalWeight).toFixed(2)
            );
          }
        }
      });
    });

    // Convert map to array
    const courses = Array.from(coursesMap.values());

    return NextResponse.json({ courses }, { status: 200 });

  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
