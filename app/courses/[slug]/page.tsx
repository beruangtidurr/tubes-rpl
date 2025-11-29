import sql from "@/lib/db";
import TeamSection from "@/app/courses/[slug]/TeamSection";

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
        <h1 className="text-2xl font-bold text-gray-800">Course not found</h1>
        <p className="text-gray-500 mt-2">Searching for: {slug}</p>
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
        <div className="h-64 bg-gray-200 flex items-center justify-center relative">
          <div className="text-gray-400 text-6xl">🖼️</div>
        </div>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">{data.title}</h2>
          {data.description && (
            <p className="text-gray-600 mb-6">{data.description}</p>
          )}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">No assignments available yet for this course.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the latest assignment (or you can let user select)
  const currentAssignment = assignments[0];

  // Get teams for this assignment and their members
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Course Header Image */}
      <div className="h-64 bg-gray-200 flex items-center justify-center relative">
        <div className="text-gray-400 text-6xl">🖼️</div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">{data.title}</h2>

        {/* Assignment Info */}
        <div className="mb-6">
          <div className="inline-block bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium mb-2">
            Assignment: {currentAssignment.title}
          </div>
          {currentAssignment.description && (
            <p className="text-gray-600 text-sm mt-2">{currentAssignment.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Teams: {currentAssignment.num_teams} | Max members per team: {currentAssignment.max_members_per_team}
          </p>
        </div>

        {/* Teams Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold mb-3">Teams</h3>
          {teams.length === 0 ? (
            <p className="text-gray-500">No teams available yet.</p>
          ) : (
            teams.map((team) => (
              <TeamSection
                key={team.id}
                team={{
                  id: team.id,
                  name: team.name,
                  maxMembers: team.max_members,
                  memberCount: parseInt(team.member_count),
                  members: team.members || [],
                }}
              />
            ))
          )}
        </div>

        {/* Course Description */}
        {data.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold mb-2">About this course</h3>
            <p className="text-gray-600">{data.description}</p>
          </div>
        )}

        {/* Show other assignments if available */}
        {assignments.length > 1 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-semibold mb-3">Other Assignments</h3>
            <div className="space-y-2">
              {assignments.slice(1).map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-3 bg-gray-50">
                  <p className="font-medium">{assignment.title}</p>
                  {assignment.description && (
                    <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
