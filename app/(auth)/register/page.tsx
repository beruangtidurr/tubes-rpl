// app/(auth)/register/page.tsx

"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
  });

  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to register");
      return;
    }

    setMessage("Registration successful! Redirecting...");

    setTimeout(() => {
      window.location.href = "/login";
    }, 800);
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <form onSubmit={handleSubmit} className="w-96 p-6 border shadow rounded bg-white">
        <h1 className="text-2xl font-bold mb-4">Register</h1>

        <input
          type="text"
          placeholder="Name"
          className="w-full mb-2 p-2 border rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-2 p-2 border rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-2 p-2 border rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <select
          className="w-full mb-2 p-2 border rounded"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="STUDENT">Student</option>
          <option value="LECTURER">Lecturer</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">
          Register
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-red-500">{message}</p>
        )}
      </form>
    </div>
  );
}
