// lib/auth.ts

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sql from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-please-change";
const JWT_EXPIRES_IN = "1d";

export type User = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: "STUDENT" | "LECTURER" | "ADMIN";
};

// ---- TOKEN HELPERS ----

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

// ---- PASSWORD HELPERS ----
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// ---- DATABASE OPERATIONS ----

// Get user by email
export async function findUserByEmail(email: string): Promise<User | null> {
  const rows = await sql<User[]>`
    SELECT id, name, email, password_hash, role
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `;

  return rows.length ? rows[0] : null;
}

// Create a new user
export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "LECTURER" | "ADMIN";
}): Promise<User> {

  const password_hash = await hashPassword(data.password);

  const rows = await sql<User[]>`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (${data.name}, ${data.email}, ${password_hash}, ${data.role})
    RETURNING id, name, email, password_hash, role
  `;

  return rows[0];
}
