// app/api/admin/enrollments/[enrollmentId]/route.ts
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

// DELETE enrollment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ enrollmentId: string }> }
) {
  const authCheck = await checkAdmin(req);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: 403 });
  }

  try {
    const { enrollmentId } = await params;

    await sql`
      DELETE FROM course_enrollments
      WHERE id = ${enrollmentId}
    `;

    return NextResponse.json({
      success: true,
      message: "Enrollment removed",
    });
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}
