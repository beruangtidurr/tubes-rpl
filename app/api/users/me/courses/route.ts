import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = Number(params.courseId);
    if (isNaN(courseId))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    // Fetch course
    const course = await sql`
      SELECT id, name FROM courses WHERE id = ${courseId}
    `;
    if (course.length === 0)
      return NextResponse.json(null, { status: 404 });

    // Fetch groups + members
    const groups = await sql`
      SELECT g.id AS group_id, g.name AS group_name, g.max_members,
             gm.id AS member_id, u.name AS member_name
      FROM groups g
      LEFT JOIN group_members gm ON gm.group_id = g.id
      LEFT JOIN users u ON u.id = gm.user_id
      WHERE g.course_id = ${courseId}
      ORDER BY g.id
    `;

    // Build nested structure
    const groupMap: any = {};
    for (const row of groups) {
      if (!groupMap[row.group_id]) {
        groupMap[row.group_id] = {
          id: row.group_id,
          name: row.group_name,
          max_members: row.max_members,
          group_members: [],
        };
      }
      if (row.member_id) {
        groupMap[row.group_id].group_members.push({
          id: row.member_id,
          name: row.member_name,
        });
      }
    }

    return NextResponse.json({
      ...course[0],
      groups: Object.values(groupMap),
    });
  } catch (err) {
    console.error("COURSE DETAIL ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
