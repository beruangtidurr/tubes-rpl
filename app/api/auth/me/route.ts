// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    // Get the JWT token from cookies
    const tokenCookie = cookieStore.get('token');
    
    if (!tokenCookie) {
      console.log("No token cookie found");
      return NextResponse.json(
        { user: null, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Decode the JWT token
    let decoded;
    try {
      decoded = jwt.verify(tokenCookie.value, JWT_SECRET) as {
        id: string;
        email: string;
        role: string;
      };
      console.log("✓ Token decoded successfully:", decoded.email);
    } catch (err) {
      console.error("JWT verification failed:", err);
      return NextResponse.json(
        { user: null, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Fetch user from database using the ID from token
    const users = await sql`
      SELECT id, name, email, role
      FROM users
      WHERE id = ${decoded.id}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { user: null, error: "User not found" },
        { status: 404 }
      );
    }

    const user = users[0];
    console.log("✓ User authenticated:", user.name, user.email);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { user: null, error: "Failed to get user" },
      { status: 500 }
    );
  }
}
