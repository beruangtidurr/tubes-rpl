'use client';

import { useRouter, usePathname } from 'next/navigation';
import ArrowRight from "@/asset/arrow-right.svg";
import Image from 'next/image';


interface AssignmentCardProps {
  assignmentNum: number;
  assignmentDate: string;
  assignmentDesc: string;
}

export default function AssignmentCard({ assignmentNum, assignmentDate, assignmentDesc }: AssignmentCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean); // Filters out empty strings from the split
  const courseIndex = pathSegments.indexOf('course');
  let courseId = '';

  if (courseIndex !== -1 && pathSegments.length > courseIndex + 1) {
    courseId = pathSegments[courseIndex + 1].split('?')[0].split('#')[0];
  }
  const slug = String(assignmentNum);
  const targetPath = `/course/${courseId}/${slug}`;
  const handleCardClick = () => {
    router.push(targetPath);
  };

  return (
    <div
      className="bg-white text-black border-2 p-2 rounded-xl border-white shadow-md border-l-blue-400 border-l-4 m-4 cursor-pointer hover:shadow-lg transition-shadow flex justify-between group"
      onClick={handleCardClick}
    >
      <div>
        <h1 className="font-bold">Assignment {assignmentNum}</h1>
        <p className="text-sm">Due Date: {assignmentDate}</p>
        <p className="text-sm">{assignmentDesc}</p>
      </div>
      <div className='opacity-0 group-hover:opacity-100 transition ease-in-out duration-300'>
        <Image src={ArrowRight} alt="arrowRight"/>
      </div>

    </div>
  )
}
