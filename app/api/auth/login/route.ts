// app/api/login/route.ts

import { findUserByEmail, comparePassword, createToken } from "@/lib/auth";

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

  return Response.json({ token, user });
}
