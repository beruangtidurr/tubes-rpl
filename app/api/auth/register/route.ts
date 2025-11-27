// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { users, hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
  }

  const existing = users.find((u) => u.email === email);
  if (existing) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id: users.length + 1,
    name,
    email,
    passwordHash,
    role: "STUDENT" as const,
  };
  users.push(newUser);

  return NextResponse.json({ message: "Registrasi berhasil" }, { status: 201 });
}