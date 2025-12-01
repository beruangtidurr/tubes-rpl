"use client";

import { useState, useEffect } from "react";

// Hook to get current user from your auth API
function useCurrentUser() {
  const [user, setUser] = useState<{ id: number; fullName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser({
              id: data.user.id,
              fullName: data.user.name,
            });
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, isLoading };
}

interface TeamMember {
  id: number;
  user_id: string; // backend sends string, keep it
  user_name: string;
  joined_at: string;
}

interface Team {
  id: number;
  name: string;
  maxMembers: number;
  memberCount: number;
  members: TeamMember[];
}

interface Props {
  assignment: {
    id: number;
    title: string;
    description?: string;
    created_at: string;
    num_teams?: number;
    max_members_per_team?: number;
  };
}

export default function ExpandableAssignmentCard({ assignment }: Props) {
  const { user, isLoading: userLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch teams when card is opened
  useEffect(() => {
    if (open && teams.length === 0) {
      fetchTeams();
    }
  }, [open]);

  const fetchTeams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/assignments/${assignment.id}/teams`);
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      setError("Failed to load teams");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: number) => {
    if (!user) {
      alert("Please log in to join a team");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.fullName || "Unknown User",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to join team");
      }

      await fetchTeams();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to join team");
    }
  };

  const handleLeaveTeam = async (teamId: number) => {
    if (!user) {
      alert("Please log in to leave a team");
      return;
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave team");
      }

      await fetchTeams();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to leave team");
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-4 bg-gray-100 hover:bg-gray-200 transition"
      >
        <span className="font-semibold text-left text-gray-800">
          {assignment.title}
        </span>
        <span className="text-gray-600 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="p-6 bg-white">
          {assignment.description && (
            <p className="text-gray-700 text-sm mb-4">
              {assignment.description}
            </p>
          )}

          <div className="flex gap-4 text-xs text-gray-600 mb-6">
            <span>
              📅 Created:{" "}
              {new Date(assignment.created_at).toLocaleDateString()}
            </span>
            {assignment.num_teams && (
              <>
                <span>👥 Teams: {assignment.num_teams}</span>
                <span>🔢 Max per team: {assignment.max_members_per_team}</span>
              </>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold mb-3 text-gray-800">
              Available Teams
            </h4>

            {!user ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
                Please log in to view and join teams.
              </div>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-blue-500 border-r-transparent"></div>
                <p className="text-sm text-gray-500 mt-3">Loading teams...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                {error}
              </div>
            ) : teams.length === 0 ? (
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200">
                <p className="text-gray-500">No teams available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    onJoin={handleJoinTeam}
                    onLeave={handleLeaveTeam}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamCard({
  team,
  onJoin,
  onLeave,
  currentUserId,
}: {
  team: Team;
  onJoin: (teamId: number) => void;
  onLeave: (teamId: number) => void;
  currentUserId: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const isFull = team.memberCount >= team.maxMembers;
  const isUserInTeam = team.members?.some(
    (m) => Number(m.user_id) === currentUserId // FIXED
  );

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between p-4 bg-gray-50">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-600 hover:text-gray-800 transition font-bold text-sm"
          >
            {expanded ? "▼" : "▶"}
          </button>

          <div className="flex-1">
            <h5 className="font-semibold text-base text-gray-800">
              {team.name}
            </h5>
            <p className="text-xs text-gray-600 mt-1">
              {team.memberCount} / {team.maxMembers} members
            </p>
          </div>
        </div>

        {isUserInTeam ? (
          <button
            onClick={() => onLeave(team.id)}
            className="px-4 py-2 text-sm font-medium text-red-600 border-2 border-red-300 rounded-lg hover:bg-red-50 transition"
          >
            Leave Team
          </button>
        ) : (
          <button
            onClick={() => onJoin(team.id)}
            disabled={isFull}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              isFull
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
            }`}
          >
            {isFull ? "Team Full" : "Join Team"}
          </button>
        )}
      </div>

      {expanded && team.members && team.members.length > 0 && (
        <div className="border-t-2 border-gray-200 bg-white p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Team Members:
          </p>
          <ul className="space-y-2">
            {team.members.map((member) => (
              <li
                key={member.id}
                className="text-sm text-gray-700 flex items-center gap-2 bg-gray-50 p-2 rounded"
              >
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="font-medium">{member.user_name}</span>
                <span className="text-gray-500 text-xs ml-auto">
                  joined {new Date(member.joined_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
