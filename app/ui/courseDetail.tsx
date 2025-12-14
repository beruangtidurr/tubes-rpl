// app/ui/courseDetail.tsx
"use client";

import { useState, useEffect } from "react";
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selectedCourse) return null;

  // Fetch teams from API when assignment is selected
  useEffect(() => {
    if (!selectedAssignment) {
      setGroups([]);
      return;
    }

    const fetchTeams = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/assignments/${selectedAssignment}/teams`);
        if (!response.ok) throw new Error("Failed to fetch teams");
        const data = await response.json();
        
        // Transform API data to Group format
        const transformedGroups: Group[] = (data.teams || []).map((team: any) => ({
          id: team.id,
          name: team.name,
          members: team.memberCount || 0,
          maxMembers: team.maxMembers,
          memberList: (team.members || []).map((member: any) => member.user_name),
        }));
        
        setGroups(transformedGroups);
      } catch (err) {
        setError("Failed to load teams");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [selectedAssignment]);

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
        {loading ? (
          <p className="text-gray-500">Loading teams...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-500">No teams available yet.</p>
        ) : (
          groups.map((group) => {
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
        })
        )}
      </div>
    </div>
  );
}
