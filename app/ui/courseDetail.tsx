// app/ui/courseDetail.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import dummyImage from "@/app/dummy-post-horisontal.jpg";
import { useCourse } from "@/app/context/CourseContext";

type Group = {
  id: number;
  name: string;
  members: number;
  maxMembers: number;
  memberList: string[];
};

export default function CourseDetail() {
  const { selectedCourse, setSelectedCourse, selectedAssignment, setSelectedAssignment } =
    useCourse();
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);

  if (!selectedCourse) return null;

  // Dummy data kelompok - nanti ganti dengan data real dari API
  const groups: Group[] = [
    {
      id: 1,
      name: "Kelompok 1",
      members: 3,
      maxMembers: 5,
      memberList: ["John Doe", "Jane Smith", "Bob Johnson"],
    },
    {
      id: 2,
      name: "Kelompok 2",
      members: 3,
      maxMembers: 5,
      memberList: ["John Doe", "Alice Brown", "Charlie Wilson"],
    },
    {
      id: 3,
      name: "Kelompok 3",
      members: 2,
      maxMembers: 5,
      memberList: ["David Lee", "Emma Davis"],
    },
  ];

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setSelectedCourse(null)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Kembali ke My Course
          </button>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {selectedCourse.title} {selectedAssignment && `> Assignment ${selectedAssignment}`}
        </h2>
        {selectedAssignment && (
          <a href="#" className="text-blue-600 hover:underline text-sm">
            Assignment
          </a>
        )}
      </div>

      {/* Image Placeholder */}
      <div className="w-full h-48 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
        <Image
          src={dummyImage}
          alt={selectedCourse.title}
          width={300}
          height={200}
          className="object-cover rounded-lg"
        />
      </div>

      {/* Kelompok Section */}
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-gray-800 mb-3">Kelompok</h3>
        {groups.map((group) => {
          const isExpanded = expandedGroups.includes(group.id);
          return (
            <div
              key={group.id}
              className="bg-white border border-gray-300 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex justify-between items-center p-4 hover:bg-gray-50 transition"
              >
                <span className="font-semibold text-gray-800">{group.name}</span>
                <span className="text-sm text-gray-600">
                  {group.members}/{group.maxMembers}
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-3 space-y-2">
                    {group.memberList.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span>{member}</span>
                        {idx === 0 && <span>😊</span>}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                      Join
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
