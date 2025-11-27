import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseIdNum = Number(params.courseId);

    const body = await req.json();
    const groupIdNum = Number(body.groupId);

    if (isNaN(courseIdNum) || isNaN(groupIdNum)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const userId = user.id;

    // Check group exists
    const group = await sql`
      SELECT * FROM groups 
      WHERE id = ${groupIdNum} AND course_id = ${courseIdNum}
    `;

    if (group.length === 0) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Ensure user is enrolled
    const enrolled = await sql`
      SELECT id FROM course_enrollments
      WHERE user_id = ${userId} AND course_id = ${courseIdNum}
    `;

    if (enrolled.length === 0) {
      return NextResponse.json(
        { error: "You are not enrolled in this course" },
        { status: 403 }
      );
    }

    // Check room capacity
    const count = await sql`
      SELECT COUNT(*)::int AS total
      FROM group_members
      WHERE group_id = ${groupIdNum}
    `;

    if (count[0].total >= group[0].max_members) {
      return NextResponse.json(
        { error: "Group is full" },
        { status: 400 }
      );
    }

    // Check if already in a group for this course
    const existing = await sql`
      SELECT gm.id
      FROM group_members gm
      JOIN groups g ON gm.group_id = g.id
      WHERE gm.user_id = ${userId} AND g.course_id = ${courseIdNum}
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You are already in a group for this course" },
        { status: 400 }
      );
    }

    // Insert new member
    await sql`
      INSERT INTO group_members (group_id, user_id)
      VALUES (${groupIdNum}, ${userId})
    `;

    const username = await sql`
      SELECT username FROM users WHERE id = ${userId}
    `;

    return NextResponse.json({
      message: "Joined successfully",
      newMemberName: username[0].username,
    });
  } catch (err) {
    console.error("JOIN GROUP ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = Number(params.courseId);

    if (isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }

    const rows = await sql`
      SELECT * FROM courses WHERE id = ${courseId}
    `;

    if (rows.length === 0) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("🔥 ERROR /api/courses/[id]:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
