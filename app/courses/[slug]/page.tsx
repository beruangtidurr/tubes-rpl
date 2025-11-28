import sql from "@/lib/db";
import Image from "next/image";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CourseDetailPage({ params }: Props) {
  // Await params in Next.js 15+
  const { slug } = await params;

  // Convert slug back to title format
  // "artificialintelligence" -> "artificial intelligence"
  const titleSearch = slug.replace(/([A-Z])/g, ' $1').trim().toLowerCase();

  // Query by matching the title (case-insensitive, ignoring spaces)
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Course Header Image */}
      <div className="h-64 bg-gray-200 flex items-center justify-center relative">
        <div className="text-gray-400 text-6xl">🖼️</div>
      </div>

      {/* Course Content */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {data.title}
        </h2>

        {/* Assignment Badge */}
        <div className="inline-block bg-gray-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
          Assignment
        </div>

        {/* Kelompok Sections */}
        <div className="space-y-3">
          {[1, 2, 3].map((num) => (
            <details key={num} className="border-b border-gray-200 pb-3">
              <summary className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 transition list-none">
                <span className="font-medium">Kelompok {num}</span>
                <div className="flex items-center gap-2">
                  {num === 2 && <span className="text-sm text-gray-500">3/5</span>}
                  <svg 
                    className="w-5 h-5 text-gray-600" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </summary>
              
              {num === 2 && (
                <div className="mt-3 ml-4 space-y-2">
                  {["John Doe", "John Doe", "John Doe"].map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                        👤
                      </div>
                      <span>{name}</span>
                      {idx === 0 && <span className="text-yellow-500">🟡</span>}
                    </div>
                  ))}
                  <button className="mt-3 px-6 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition">
                    Submit
                  </button>
                </div>
              )}
            </details>
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
