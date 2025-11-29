// app/login/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("dosen@example.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login gagal");
      } else {
        const role = data.user?.role as string | undefined;

        if (role === "STUDENT") {
          router.push("/");         // homepage mahasiswa
        } else if (role === "LECTURER") {
          router.push("/lecturer"); // homepage dosen
        } else if (role === "ADMIN") {
          router.push("/admin");    // homepage admin
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-8">
      <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">
        Login
      </h1>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Masuk sebagai Mahasiswa, Dosen, atau Admin
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>

      <div className="mt-6 text-xs text-gray-500">
        <p>Dummy akun untuk testing:</p>
        <ul className="list-disc list-inside">
          <li>Mahasiswa: mahasiswa@example.com / password123</li>
          <li>Dosen: dosen@example.com / password123</li>
          <li>Admin: admin@example.com / password123</li>
        </ul>
      </div>
    </div>
  );
}
