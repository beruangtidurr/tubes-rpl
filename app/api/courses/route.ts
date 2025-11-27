// app/api/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import sql from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const studentId = payload.id;

    const courses = await sql`
      SELECT c.id, c.title, c.description
      FROM courses c
      JOIN course_enrollments ce ON ce.course_id = c.id
      WHERE ce.user_id = ${studentId}
      ORDER BY c.id
    `;

    return NextResponse.json(courses);
  } catch (err) {
    console.error("GET /api/courses error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
