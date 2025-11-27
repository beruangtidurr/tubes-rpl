// lib/auth.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-please-change";
const JWT_EXPIRES_IN = "1d";

export type User = {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: "STUDENT" | "LECTURER" | "ADMIN";
  };

// Sementara: "database" di memory
export const users: User[] = [
  {
    id: 1,
    name: "Mahasiswa Contoh",
    email: "mahasiswa@example.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "STUDENT",
  },
  {
    id: 2,
    name: "Dosen Contoh",
    email: "dosen@example.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "LECTURER",
  },
  {
    id: 3,
    name: "Admin Contoh",
    email: "admin@example.com",
    passwordHash: bcrypt.hashSync("password123", 10),
    role: "ADMIN",
  },
];

export function createToken(payload: { id: number; email: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
      iat: number;
      exp: number;
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}