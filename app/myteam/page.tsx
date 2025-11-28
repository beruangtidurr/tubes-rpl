"use client";

import { useState, useEffect } from "react";

type TeamMember = {
  id: number;
  name: string;
  email: string;
};

type CourseTeam = {
  course_id: number;
  course_title: string;
  team_id: number;
  team_name: string;
  members: TeamMember[];
};

export default function MyTeamPage() {
  const [courseTeams, setCourseTeams] = useState<CourseTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/my-teams");
      const data = await res.json();

      if (res.ok) {
        setCourseTeams(data.teams || []);
      } else {
        setError(data.error || "Failed to fetch teams");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading your teams...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col grow justify-start font-sans">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">My Team</h2>
            <p className="text-gray-600 mt-1">View your team members across all courses</p>
          </div>
        </div>

        {courseTeams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">You are not assigned to any team yet.</p>
            <p className="text-gray-400 text-sm mt-2">Please contact your instructor for team assignment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {courseTeams.map((courseTeam) => (
              <div key={`${courseTeam.course_id}-${courseTeam.team_id}`} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Course Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">{courseTeam.course_title}</h3>
                  <p className="text-blue-100 text-sm mt-1">Team: {courseTeam.team_name}</p>
                </div>

                {/* Team Members */}
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      Team Members ({courseTeam.members.length})
                    </h4>
                  </div>

                  {courseTeam.members.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No team members yet</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {courseTeam.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                        >
                          {/* Avatar */}
                          <div className="bg-blue-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mr-4">
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          {/* Member Info */}
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-800">{member.name}</h5>
                            <p className="text-sm text-gray-600">{member.email}</p>
                          </div>

                          {/* Action Button */}
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Contact
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
