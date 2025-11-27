import { findUserByEmail, comparePassword, createToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await findUserByEmail(email);
  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = createToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  // MUST USE await cookies()
  const cookieStore = await cookies();

  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    success: true,
  });
}
