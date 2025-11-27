"use client";

import { useEffect, useState } from "react";
import CourseCard from "./courseCard";

interface Course {
  id: number;
  title: string;
  description?: string | null;
}

export default function CardContainer() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/courses", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load courses");
          return;
        }

        setCourses(Array.isArray(data) ? data : []);
      } catch {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <p className="animate-pulse text-gray-500">Loading courses...</p>;
  }

  if (error) {
    return <p className="text-red-500 font-medium">{error}</p>;
  }

  if (courses.length === 0) {
    return <p className="text-gray-600">No courses found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          id={course.id}
          title={course.title}           // used for slug
          desc={course.description || "-"}
        />

      ))}
    </div>
  );
}
