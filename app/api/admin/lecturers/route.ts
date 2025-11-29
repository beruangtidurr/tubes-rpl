// app/api/admin/lecturers/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function checkAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  
  if (!tokenCookie) {
    return { authorized: false, error: "Not authenticated" };
  }

  try {
    const decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as {
      id: string;
      role: string;
    };

    if (decoded.role !== "ADMIN") {
      return { authorized: false, error: "Access denied. Admin only." };
    }

    return { authorized: true };
  } catch (err) {
    return { authorized: false, error: "Invalid token" };
  }
}

// GET all lecturers
export async function GET(req: NextRequest) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const lecturers = await sql`
      SELECT id, name, email
      FROM users
      WHERE role = 'LECTURER'
      ORDER BY name
    `;

    return NextResponse.json({
      lecturers: lecturers,
    });
  } catch (error) {
    console.error("Error fetching lecturers:", error);
    return NextResponse.json(
      { error: "Failed to fetch lecturers" },
      { status: 500 }
    );
  }
}
