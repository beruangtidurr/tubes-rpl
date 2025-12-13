// app/api/student/grades/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import sql from '@/lib/db';
import { getCurrentAcademicYearSemester, getAcademicYearsList } from '@/lib/academicYear';

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

    // Query parameters for filtering academic year and semester
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');

    // If no filter provided, default to current semester
    const current = getCurrentAcademicYearSemester();
    const filterAcademicYear = academicYear || current.academicYear;
    const filterSemester = semester || current.semester;

    // Query to get all grades for the student
    // Only show courses that have assignments in the selected semester
    const result = await sql`
      WITH course_assignments AS (
        -- Get all assignments for enrolled courses in the selected semester
        SELECT 
          a.id,
          a.course_id,
          a.title,
          a.description,
          a.assignment_due_date,
          a.grading_due_date,
          a.academic_year,
          a.semester
        FROM assignments a
        INNER JOIN course_enrollments ce ON ce.course_id = a.course_id
        WHERE ce.user_id = ${userId}
          AND a.academic_year = ${filterAcademicYear}
          AND a.semester = ${filterSemester}
      ),
      student_courses AS (
        -- Get only courses that have assignments in the selected semester
        SELECT DISTINCT c.id, c.title, c.description
        FROM courses c
        INNER JOIN course_assignments ca ON ca.course_id = c.id
      ),
      student_team_info AS (
        -- Get team information ONLY for teams where student is a member
        SELECT 
          ca.id as assignment_id,
          ca.course_id,
          ca.title,
          ca.description,
          ca.assignment_due_date,
          ca.grading_due_date,
          ca.academic_year,
          ca.semester,
          COALESCE(
            (SELECT t.id FROM teams t 
             INNER JOIN team_members tm ON tm.team_id = t.id 
             WHERE t.assignment_id = ca.id AND tm.user_id = ${userId} 
             LIMIT 1),
            NULL
          ) as team_id,
          COALESCE(
            (SELECT t.name FROM teams t 
             INNER JOIN team_members tm ON tm.team_id = t.id 
             WHERE t.assignment_id = ca.id AND tm.user_id = ${userId} 
             LIMIT 1),
            NULL
          ) as team_name,
          (SELECT tm.id FROM teams t 
           INNER JOIN team_members tm ON tm.team_id = t.id 
           WHERE t.assignment_id = ca.id AND tm.user_id = ${userId} 
           LIMIT 1) as team_member_id
        FROM course_assignments ca
      )
      SELECT 
        sc.id as course_id,
        sc.title as course_title,
        sc.description as course_description,
        sti.assignment_id,
        sti.title as assignment_title,
        sti.description as assignment_description,
        sti.assignment_due_date,
        sti.grading_due_date,
        sti.academic_year,
        sti.semester,
        sti.team_id,
        sti.team_name,
        sti.team_member_id,
        
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
          WHERE tm2.team_id = sti.team_id
        ) as team_members
        
      FROM student_courses sc
      LEFT JOIN student_team_info sti ON sti.course_id = sc.id
      LEFT JOIN grade_components gc ON gc.assignment_id = sti.assignment_id
      LEFT JOIN team_grades tg ON tg.component_id = gc.id AND tg.team_id = sti.team_id
      LEFT JOIN student_grades sg ON sg.component_id = gc.id AND sg.team_member_id = sti.team_member_id
      LEFT JOIN team_feedback tf ON tf.assignment_id = sti.assignment_id AND tf.team_id = sti.team_id
      ORDER BY sc.id, sti.assignment_id, gc.component_order
    `;

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
      
      // Safety check
      if (!course) return;

      // Skip if no assignment (course will still be shown with empty assignments array)
      if (!row.assignment_id) return;

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
            id: row.team_id || 0,
            name: row.team_name || 'Not Assigned',
            members: row.team_members || []
          },
          gradeComponents: [],
          overallFeedback: row.overall_feedback,
          finalGrade: null
        };
        if (assignment) {
          course.assignments.push(assignment);
        }
      }

      // Add grade component
      if (row.component_id) {
        const existingComponent = assignment?.gradeComponents?.find(
          gc => gc.id === row.component_id
        );

        if (!existingComponent) {
          assignment?.gradeComponents?.push({
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

    // Get available academic years for filter
    const availableAcademicYears = getAcademicYearsList(2);

    return NextResponse.json({ 
      courses,
      currentAcademicYear: current.academicYear,
      currentSemester: current.semester,
      filterAcademicYear: filterAcademicYear,
      filterSemester: filterSemester,
      availableAcademicYears
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}
