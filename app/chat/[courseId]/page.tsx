export default async function ChatRoomPage({ 
  params 
}: { 
  params: Promise<{ courseId: string }> 
}) {
  const { courseId } = await params;

  const courseTitle = courseId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="flex flex-col h-full p-4">
      {/* BIG DEBUG BOX - If you see this, the route works! */}
      <div className="bg-green-500 text-white p-6 rounded-lg mb-4 text-center">
        <h1 className="text-3xl font-bold">✓ SUCCESS!</h1>
        <p className="text-xl mt-2">Route is working: {courseId}</p>
      </div>

      {/* Header */}
      <div className="border-b border-gray-300 pb-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{courseTitle} Discussion</h2>
        <p className="text-sm text-gray-500">Welcome to the real-time group chat for this course.</p>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        <div className="flex justify-start">
          <div className="bg-gray-200 p-3 rounded-xl rounded-tl-sm max-w-[70%] shadow-sm">
            <span className="font-semibold text-xs text-blue-700">Team Member A:</span>
            <p className="text-sm text-gray-700">Has anyone started reviewing the material for the {courseTitle} module?</p>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="bg-blue-600 text-white p-3 rounded-xl rounded-br-sm max-w-[70%] shadow-md">
            <p className="text-sm">I'm currently on Chapter 3. The content is very interesting!</p>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex space-x-2 border-t border-gray-300 pt-4">
        <input
          type="text"
          placeholder="Send a message to the group..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
        />
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-150">
          SEND
        </button>
      </div>
    </div>
  );
}
