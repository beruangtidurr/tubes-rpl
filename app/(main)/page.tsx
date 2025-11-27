// app/(main)/page.tsx
"use client";

import { useEffect, useState } from "react";
import CardContainer from "@/app/ui/cardContainer";
import CourseDetail from "@/app/ui/courseDetail";
import { useChat } from "@/app/context/ChatContext";
import { useCourse } from "@/app/context/CourseContext";

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: string;
} | null;

export default function Home() {
  const [user, setUser] = useState<CurrentUser>(null);
  const { selectedChat, setSelectedChat } = useChat();
  const { selectedCourse } = useCourse();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // Kalau ada chat yang dipilih, tampilkan chat box
  if (selectedChat) {
    return (
      <div className="flex flex-col grow justify-center font-sans p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Chat: {selectedChat.title}
            </h2>
            <p className="text-sm text-gray-600">Kelompok {selectedChat.team}</p>
          </div>
          <button
            onClick={() => setSelectedChat(null)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ← Kembali ke My Course
          </button>
        </div>

        {/* Chat Box Area */}
        <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-sm text-gray-800">Pesan dari anggota kelompok...</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg ml-auto max-w-xs">
              <p className="text-sm text-gray-800">Pesan kamu...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 border px-3 py-2 rounded"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Kirim
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Kalau ada course yang dipilih, tampilkan detail course
  if (selectedCourse) {
    return <CourseDetail />;
  }

  // Default: tampilkan My Course
  return (
    <div className="flex flex-col grow justify-center font-sans p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Course</h2>
          {user && (
            <p className="text-sm text-gray-600">
              Selamat datang, {user.name} ({user.email})
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <CardContainer />
    </div>
  );
}