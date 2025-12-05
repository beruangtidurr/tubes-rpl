// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import sql from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 }
      );
    }

    const userId = payload.id;
    const userRole = payload.role;

    // Fetch user data from database
    // Adjust column names to match your actual database schema
    const result = await sql`
      SELECT id, name, email, role
      FROM users
      WHERE id = ${userId}
    `;
    
    const user = result[0];

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        userId: user.id.toString(), // Use ID as userId for now
        role: user.role
      }
    });

  } catch (err) {
    console.error("GET /api/profile error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
