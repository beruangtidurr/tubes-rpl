// app/api/profile/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import sql from "@/lib/db";
import { cookies } from "next/headers";

export async function PUT(req: NextRequest) {
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

    // Get request body
    const body = await req.json();
    const { name } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: "Name is too long" },
        { status: 400 }
      );
    }

    // Update user name in database
    const result = await sql`
      UPDATE users
      SET name = ${name.trim()}
      WHERE id = ${userId}
      RETURNING *
    `;

    const updatedUser = result[0];

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: updatedUser.name,
        email: updatedUser.email,
        userId: updatedUser.id.toString(),
        role: updatedUser.role
      },
      message: "Profile updated successfully"
    });

  } catch (err) {
    console.error("PUT /api/profile/update error", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
