// app/api/assignments/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie) {
      console.log("No token found - returning empty assignments");
      return NextResponse.json([], { status: 200 });
    }

    let decoded;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };
      console.log("✓ Token decoded - User ID:", decoded.id, "Email:", decoded.email);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return NextResponse.json([], { status: 200 });
    }

    // Fetch assignments only for courses the student is enrolled in
    // Note: Table is called 'course_enrollments' not 'enrollments'
    const assignments = await sql`
      SELECT 
        a.id,
        a.title,
        a.assignment_due_date as "dueDate",
        c.title as "courseName"
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      INNER JOIN course_enrollments e ON c.id = e.course_id
      WHERE e.user_id = ${decoded.id}
        AND a.assignment_due_date >= CURRENT_DATE
      ORDER BY a.assignment_due_date ASC
      LIMIT 5
    `;

    console.log(`✓ Fetched ${assignments.length} assignments for user:`, decoded.email);

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('❌ Error fetching assignments:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json([], { status: 200 });
  }
}
