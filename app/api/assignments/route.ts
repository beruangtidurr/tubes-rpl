// app/api/assignments/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Fetch assignments with due dates and join with courses table
    const assignments = await sql`
      SELECT 
        a.id,
        a.title,
        a.assignment_due_date as "dueDate",
        c.title as "courseName"
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      WHERE a.assignment_due_date >= CURRENT_DATE
      ORDER BY a.assignment_due_date ASC
      LIMIT 5
    `;

    console.log('Fetched assignments:', assignments); // Debug log

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
