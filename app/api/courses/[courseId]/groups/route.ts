import { NextResponse } from "next/server";
import sql from "@/lib/db";

interface RouteParams {
  params: { courseId: string };
}

export async function GET(_: Request, { params }: RouteParams) {
  const { courseId } = params;
  const courseIdNum = Number(courseId);

  if (isNaN(courseIdNum)) {
    return NextResponse.json(
      { error: "Invalid course ID" },
      { status: 400 }
    );
  }

  try {
    const groups = await sql`
      SELECT
        g.id,
        g.name,
        g.max_members,
        COUNT(m.id)::int AS members,
        ARRAY_REMOVE(ARRAY_AGG(u.username), NULL) AS member_list
      FROM groups g
      LEFT JOIN group_members m ON g.id = m.group_id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE g.course_id = ${courseIdNum}
      GROUP BY g.id
      ORDER BY g.id;
    `;

    return NextResponse.json(groups);
  } catch (err) {
    console.error("GROUP FETCH ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
