"use client";

import { useRouter, usePathname } from 'next/navigation';
import Image from "next/image";
import dummyImage from "@/app/dummy-post-horisontal.jpg"
import { handleClientScriptLoad } from 'next/script';

interface CourseCardProps {
  title: string;
  desc: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function CourseCard({ title, desc }: CourseCardProps) {
  const router = useRouter();
    const pathname = usePathname();
  
    const slug = slugify(title);
    const targetPath = `/course/${slug}`;
    
    // Check if this card's route is currently active
    const isActive = pathname === targetPath;
  
    const handleCardClick = () => {
      router.push(targetPath);
    };
  
  return (
    // Card Container: Use w-full (100%) for mobile, but limit size on larger screens
    // The min-h-[250px] ensures a minimum height, but we remove the fixed h-60
    <div 
    onClick={handleCardClick}
    className="p-4 rounded-xl shadow-xl w-full lg:w-[180px] bg-[#ECECEC] min-h-20 xl:w-[320px] flex flex-col 
      hover:bg-gray-300 hover:shadow-2xl hover:cursor-pointer transition duration-300 ease-in-out">
      
      {/* Image Container: Uses aspect-ratio and relative positioning */}
      <div className="relative w-full mb-3 rounded-lg overflow-hidden aspect-video">
        <Image 
          src={dummyImage} 
          // key property tells Next.js to scale the image flexibly within its parent container
          // and maintain aspect ratio.
          fill
          alt={`Image for ${title}`}
          sizes="(max-width: 640px) 100vw, 300px" // Responsive sizes hint for optimization
          className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
        />
      </div>

      <div className="lg:text-sm font-semibold leading-tight mb-1 truncate">
        {title}
      </div>
      <p className="text-gray-600 text-sm line-clamp-2">
        {desc}
      </p>
    </div>
  );
}
