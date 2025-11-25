"use client";

import { useRouter, usePathname } from 'next/navigation';

interface ChatCardProps {
  title: string;
  team: number;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function ChatCard({ title, team }: ChatCardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const slug = slugify(title);
  const targetPath = `/chat/${slug}`;
  
  // Check if this card's route is currently active
  const isActive = pathname === targetPath;

  const handleCardClick = () => {
    router.push(targetPath);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`
        p-3 rounded-lg shadow-md border-l-4 transition duration-150 cursor-pointer mb-3
        ${isActive 
          ? 'bg-blue-500 border-blue-700 text-white' 
          : 'bg-white border-blue-500 hover:bg-blue-50 text-gray-900'
        }
      `}
    >
      <p className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
        Course : {title}
      </p>
      <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-600'}`}>
        Kelompok : {team}
      </p>
      
      {/* Active indicator badge */}
      {isActive && (
        <div className="mt-2 flex items-center">
          <span className="inline-block w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
        </div>
      )}
    </div>
  );
}
