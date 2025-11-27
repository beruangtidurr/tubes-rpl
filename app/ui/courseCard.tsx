"use client";

import Image from "next/image";
import dummyImage from "@/app/dummy-post-horisontal.jpg";
import { useRouter } from "next/navigation";

interface CourseCardProps {
  id: number;
  title: string;
  desc: string;
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "")
    .replace(/^-+|-+$/g, "");
};

export default function CourseCard({ title, desc }: CourseCardProps) {
  const router = useRouter();
  const slug = slugify(title);

  const handleCardClick = () => {
    router.push(`/courses/${slug}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="
        p-4 rounded-xl shadow-lg cursor-pointer
        bg-[#ECECEC] hover:bg-gray-300 hover:shadow-xl transition
      "
    >
      <div className="relative w-full mb-3 rounded-lg overflow-hidden aspect-video">
        <Image
          src={dummyImage}
          fill
          alt={`Image for ${title}`}
          className="object-cover"
        />
      </div>

      <h3 className="text-base font-semibold leading-tight mb-1">{title}</h3>
      <p className="text-sm text-gray-600 line-clamp-2">{desc}</p>
    </div>
  );
}
