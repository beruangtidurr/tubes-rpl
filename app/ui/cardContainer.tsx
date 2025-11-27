"use client";

import { useEffect, useState } from "react";
import CourseCard from "./courseCard";

export default function CardContainer() {
  const [courses, setCourses] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/courses", {
          credentials: "include", // <<< THE FIX
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load courses");
          setCourses([]);
        } else {
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        setError("Network error");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading courses...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!courses || courses.length === 0) return <p>No courses found.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {courses.map((course: any) => (
        <CourseCard key={course.id} title={course.title} desc={course.description || "-"} />
      ))}
    </div>
  );
}
