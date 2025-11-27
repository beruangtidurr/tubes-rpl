"use client";

import { useEffect, useState } from "react";

type GroupMember = { id: number; name: string };
type Group = { id: number; name: string; max_members: number; group_members: GroupMember[] };

type Course = { id: number; name: string; groups: Group[] };

export default function CourseDetail({ courseId }: { courseId: number }) {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/courses/${courseId}`);
      const json = await res.json();
      setCourse(json);
    }

    load();
  }, [courseId]);

  if (!course) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{course.name}</h1>

      <h2 className="text-xl mt-4">Groups</h2>
      {course.groups.map((g) => (
        <div key={g.id} className="border p-3 my-2">
          <p className="font-semibold">{g.name}</p>
          <p>Max members: {g.max_members}</p>

          <ul className="ml-4">
            {g.group_members.map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
