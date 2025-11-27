"use client";
import { useState, useEffect } from "react";
import ChatCard from "./chatCard";

export default function ChatContainer() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me/courses");
      const data = await res.json();

      if (!res.ok) setCourses([]);
      else setCourses(data);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <p>Loading chats...</p>;
  if (courses.length === 0) return <p>No chats available.</p>;

  return (
    <div className="flex flex-col gap-4">
      {courses.map((course) => (
        <ChatCard
          key={course.id}
          title={course.title}
          team={course.id}
        />
      ))}
    </div>
  );
}
