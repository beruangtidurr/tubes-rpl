// app/courses/[slug]/page.tsx

import sql from "@/lib/db";
import TeamSection from "@/app/courses/[slug]/TeamSection";
import ExpandableAssignmentCard from "@/app/courses/[slug]/ExpandableAssignmentCard";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const titleSearch = slug.replace(/([A-Z])/g, ' $1').trim().toLowerCase();

  // Query course
  const course = await sql`
    SELECT *
    FROM courses
    WHERE LOWER(REPLACE(title, ' ', '')) = LOWER(REPLACE(${titleSearch}, ' ', ''))
    LIMIT 1
  `;

  if (course.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Course not found</h1>
          <p className="text-gray-500 mt-2">Searching for: {slug}</p>
        </div>
      </div>
    );
  }

  const data = course[0];

  // Get assignments for this course
  const assignments = await sql`
    SELECT 
      id,
      title,
      description,
      num_teams,
      max_members_per_team,
      created_at
    FROM assignments
    WHERE course_id = ${data.id}
    ORDER BY created_at DESC
  `;

  // If there are no assignments, show a message
  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
          <div className="text-gray-400 text-6xl">📚</div>
        </div>
        <div className="p-6">
          <h2 className="text-3xl font-bold mb-4">{data.title}</h2>
          {data.description && (
            <p className="text-gray-600 mb-6">{data.description}</p>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">📝 No assignments available yet for this course.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the latest assignment (featured assignment)
  const currentAssignment = assignments[0];

  // Get teams for the featured assignment and their members
  const teams = await sql`
    SELECT 
      t.id,
      t.name,
      t.max_members,
      COUNT(tm.id) as member_count,
      json_agg(
        json_build_object(
          'id', tm.id,
          'user_id', tm.user_id,
          'user_name', tm.user_name,
          'joined_at', tm.joined_at
        )
        ORDER BY tm.joined_at
      ) FILTER (WHERE tm.id IS NOT NULL) as members
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id
    WHERE t.assignment_id = ${currentAssignment.id}
    GROUP BY t.id, t.name, t.max_members
    ORDER BY t.name
  `;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Course Header Image */}
        <div className="h-64 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative">
          <div className="text-gray-400 text-6xl">📚</div>
        </div>

        {/* Course Content */}
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
          
          {/* Course Description */}
          {data.description && (
            <p className="text-gray-600 mb-6">{data.description}</p>
          )}

          {/* Featured Assignment Section */}
          <div className="mb-8 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⭐</span>
              <h2 className="text-xl font-bold text-blue-900">Current Assignment</h2>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {currentAssignment.title}
              </h3>
              {currentAssignment.description && (
                <p className="text-gray-700 text-sm mb-3">{currentAssignment.description}</p>
              )}
              <div className="flex gap-4 text-xs text-gray-600">
                <span>📅 Created: {new Date(currentAssignment.created_at).toLocaleDateString()}</span>
                <span>👥 Teams: {currentAssignment.num_teams}</span>
                <span>🔢 Max per team: {currentAssignment.max_members_per_team}</span>
              </div>
            </div>

            {/* Teams Section for Featured Assignment */}
            <div className="mt-4">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Available Teams</h4>
              {teams.length === 0 ? (
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-gray-500">No teams available yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <TeamSection
                      key={team.id}
                      team={{
                        id: team.id,
                        name: team.name,
                        maxMembers: team.max_members,
                        memberCount: parseInt(team.member_count),
                        members: team.members || [],
                      }}
                      assignmentId={currentAssignment.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Other Assignments Section */}
          {assignments.length > 1 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span>📋</span>
                Other Assignments
              </h2>
              <div className="space-y-3">
                {assignments.slice(1).map((assignment) => (
                  <ExpandableAssignmentCard
                    key={assignment.id}
                    assignment={{
                      id: assignment.id,
                      title: assignment.title,
                      description: assignment.description,
                      created_at: assignment.created_at,
                      num_teams: assignment.num_teams,
                      max_members_per_team: assignment.max_members_per_team,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
