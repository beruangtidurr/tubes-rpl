// app/courses/[slug]/TeamSection.tsx

"use client";

import { useState, useEffect } from "react";

interface Member {
  id: number;
  user_id: string;
  user_name: string;
  joined_at: string;
}

interface TeamSectionProps {
  team: {
    id: number;
    name: string;
    maxMembers: number;
    memberCount: number;
    members: Member[];
  };
  assignmentId: number;
}

export default function TeamSection({ team, assignmentId }: TeamSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  // Fetch current logged-in user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        
        if (data.user) {
          setCurrentUser({
            id: data.user.id.toString(),
            name: data.user.name,
            email: data.user.email
          });
        } else {
          setError("Please log in to join a team");
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError("Failed to load user session");
      }
    };

    fetchCurrentUser();
  }, []);

  // Convert both to strings for comparison to handle type mismatches
  const isMember = currentUser ? team.members.some((m) => m.user_id.toString() === currentUser.id.toString()) : false;
  const isFull = team.memberCount >= team.maxMembers;

  const handleJoin = async () => {
    if (!currentUser || isMember || isFull) return;

    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${team.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          assignmentId: assignmentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to join team");
        return;
      }

      // Refresh the page to show updated team
      window.location.reload();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUser || !isMember) return;

    if (!confirm("Are you sure you want to leave this team?")) {
      return;
    }

    setIsLeaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/teams/${team.id}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to leave team");
        return;
      }

      // Refresh the page to show updated team
      window.location.reload();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <div className="border-b border-gray-200 pb-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-3 hover:bg-gray-50 transition rounded px-2"
      >
        <span className="font-medium">{team.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {team.memberCount}/{team.maxMembers}
          </span>
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 ml-4 space-y-2">
          {team.members.length > 0 ? (
            team.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  👤
                </div>
                <span>{member.user_name}</span>
                {currentUser && member.user_id.toString() === currentUser.id.toString() && (
                  <span className="text-xs text-blue-500">(You)</span>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No members yet</p>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {!currentUser && (
            <p className="text-sm text-orange-500">⚠️ Loading user...</p>
          )}

          {currentUser && !isMember && (
            <button
              onClick={handleJoin}
              disabled={isJoining || isFull}
              className={`mt-3 px-6 py-1.5 text-sm rounded-full transition ${
                isFull
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {isJoining ? "Joining..." : isFull ? "Team Full" : "Join"}
            </button>
          )}

          {currentUser && isMember && (
            <div className="mt-3">
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm text-green-700 font-medium flex-1">
                  ✓ You are a member of this team
                </div>
                <button
                  onClick={handleLeave}
                  disabled={isLeaving}
                  className="px-5 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 active:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLeaving ? "Leaving..." : "Leave Team"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
