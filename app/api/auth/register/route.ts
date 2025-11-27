// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail, createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role } = await req.json();

    // ---- VALIDATION ----
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields (name, email, password, role) are required" },
        { status: 400 }
      );
    }

    if (!["STUDENT", "LECTURER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // ---- CHECK IF USER EXISTS ----
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // ---- CREATE USER ----
    const user = await createUser({ name, email, password, role });

    // ---- CREATE JWT TOKEN ----
    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // ---- SEND COOKIE ----
    const response = NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
