// app/ui/courseCard.tsx
"use client";

import Image from "next/image";
import dummyImage from "@/app/dummy-post-horisontal.jpg";
import { useCourse } from "@/app/context/CourseContext";

interface CourseCardProps {
  title: string;
  desc: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export default function CourseCard({ title, desc }: CourseCardProps) {
  const { selectedCourse, setSelectedCourse } = useCourse();

  const slug = slugify(title);
  const isActive = selectedCourse?.id === slug;

  const handleCardClick = () => {
    setSelectedCourse({ id: slug, title, description: desc });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        p-4 rounded-xl shadow-lg transition-all duration-300 ease-in-out
        cursor-pointer flex flex-col
        ${
          isActive
            ? "bg-blue-500 text-white shadow-xl scale-105"
            : "bg-[#ECECEC] hover:bg-gray-300 hover:shadow-xl"
        }
      `}
    >
      {/* Image Container */}
      <div className="relative w-full mb-3 rounded-lg overflow-hidden aspect-video">
        <Image
          src={dummyImage}
          fill
          alt={`Image for ${title}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
          className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
        />
      </div>

      {/* Title */}
      <h3
        className={`
        text-base font-semibold leading-tight mb-1 line-clamp-1
        ${isActive ? "text-white" : "text-gray-900"}
      `}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`
        text-sm line-clamp-2
        ${isActive ? "text-blue-100" : "text-gray-600"}
      `}
      >
        {desc}
      </p>
    </div>
  );
}