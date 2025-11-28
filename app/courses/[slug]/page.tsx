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

  // Get teams and their members
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
    WHERE t.course_id = ${data.id}
    GROUP BY t.id, t.name, t.max_members
    ORDER BY t.id
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

        {/* Assignment Badge */}
        <div className="inline-block bg-gray-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
          Assignment
        </div>

        {/* Teams Section */}
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
            />
          ))}
        </div>

        {/* Description */}
        {data.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600">{data.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
