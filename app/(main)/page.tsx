// app/(main)/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardContainer from "@/app/ui/cardContainer";
import { useChat } from "@/app/context/ChatContext";

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: string;
} | null;

export default function Home() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);
  const { selectedChat, setSelectedChat } = useChat();
  const router = useRouter();

  useEffect(() => {
    // Check authentication status
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          // User is authenticated
          setUser(data.user);
          setLoading(false);
        } else {
          // Not authenticated - redirect to login
          console.log("User not authenticated, redirecting to login...");
          router.push("/login");
        }
      })
      .catch((error) => {
        // Error fetching user - redirect to login
        console.error("Authentication check failed:", error);
        router.push("/login");
      });
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is null and loading is false, we're redirecting
  // This prevents flash of content before redirect
  if (!user) {
    return null;
  }

  // If chat selected → show chat view
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
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ← Kembali ke My Course
          </button>
        </div>

        {/* Chat Box Area */}
        <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-sm text-gray-800">Pesan dari anggota...</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-lg ml-auto max-w-xs">
              <p className="text-sm text-gray-800">Pesan kamu...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik pesan..."
              className="flex-1 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Kirim
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default: My Course
  return (
    <div className="flex flex-col grow justify-center font-sans p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Course</h2>
          <p className="text-sm text-gray-600">
            Selamat datang, {user.name} ({user.email})
          </p>
        </div>
      </div>

      <CardContainer />
    </div>
  );
}
