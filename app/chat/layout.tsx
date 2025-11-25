"use client";

import { usePathname } from 'next/navigation';
import ChatContainer from '../ui/chatContainer';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Extract courseId from pathname like /chat/artificial-intelligence
  const courseId = pathname.split('/chat/')[1];
  
  console.log("Chat Layout - pathname:", pathname);
  console.log("Chat Layout - courseId:", courseId);

  // If we're on a specific chat route
  if (courseId && courseId !== '') {
    const courseTitle = courseId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return (
      <div className="gap-6 h-full">
        {/* Chat Room */}
        <div className="flex flex-col h-full p-4 bg-white rounded-lg">
          {/* <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
            <h1 className="text-2xl font-bold">✓ Chat Layout Working!</h1>
            <p>CourseId: {courseId}</p>
          </div> */}

          {/* Header */}
          <div className="border-b border-gray-300 pb-3 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{courseTitle} Discussion</h2>
            <p className="text-sm text-gray-500">Welcome to the real-time group chat for this course.</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            <div className="flex justify-start">
              <div className="bg-gray-200 p-3 rounded-xl rounded-tl-sm max-w-[70%]">
                <span className="font-semibold text-xs text-blue-700">Team Member A:</span>
                <p className="text-sm text-gray-700">Has anyone started reviewing the material for {courseTitle}?</p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="bg-blue-600 text-white p-3 rounded-xl rounded-br-sm max-w-[70%]">
                <p className="text-sm">I'm currently on Chapter 3. Very interesting!</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="flex space-x-2 border-t pt-4">
            <input
              type="text"
              placeholder="Send a message..."
              className="flex-1 p-3 border rounded-lg text-gray-900"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
              SEND
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default view when on /chat
  return <div className="text-gray-900">{children}</div>;
}
