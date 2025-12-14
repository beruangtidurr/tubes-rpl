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
          {/* Header */}
          <h2 className="text-2xl font-bold text-gray-800">{courseTitle} Discussion</h2>
        </div>
      </div>
    );
  }

  // Default view when on /chat
  return <div className="text-gray-900">{children}</div>;
}
