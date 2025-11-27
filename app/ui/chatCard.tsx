// app/ui/chatCard.tsx
"use client";

import { useChat } from "@/app/context/ChatContext";

interface ChatCardProps {
  title: string;
  team: number;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function ChatCard({ title, team }: ChatCardProps) {
  const { selectedChat, setSelectedChat } = useChat();

  const slug = slugify(title);
  const isActive = selectedChat?.slug === slug;

  const handleCardClick = () => {
<<<<<<< HEAD
    setSelectedChat({ title, team, slug });
=======
    // If the card is already active (clicked again), navigate to the root path ('/')
    if (isActive) {
      router.push('/');
    } else {
      // Otherwise, navigate to the chat path
      router.push(targetPath);
    }
>>>>>>> 2f568871f09fc23024fbd31bc270e66705f74a76
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        p-3 rounded-lg shadow-md border-l-4 transition duration-150 cursor-pointer mb-3
        ${
          isActive
            ? "bg-blue-500 border-blue-700 text-white"
            : "bg-white border-blue-500 hover:bg-blue-50 text-gray-900"
        }
      `}
    >
      <p className={`font-semibold text-sm ${isActive ? "text-white" : "text-gray-900"}`}>
        Course : {title}
      </p>
      <p className={`text-xs ${isActive ? "text-blue-100" : "text-gray-600"}`}>
        Kelompok : {team}
      </p>

      {isActive && (
        <div className="mt-2 flex items-center">
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
        </div>
      )}
    </div>
  );
}