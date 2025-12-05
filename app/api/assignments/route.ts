// app/api/assignments/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Fetch assignments with due dates from your database
    const assignments = await sql`
      SELECT 
        id,
        title,
        assignment_due_date as "dueDate",
        course_id as "courseId"
      FROM assignments
      WHERE assignment_due_date >= CURRENT_DATE
      ORDER BY assignment_due_date ASC
      LIMIT 5
    `;

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
