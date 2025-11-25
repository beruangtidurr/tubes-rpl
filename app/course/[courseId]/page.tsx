import Image from "next/image";
import dummyImage from "@/app/dummy-post-horisontal.jpg"
import AssignmentContainer from "@/app/ui/assignmentContainer";

export default async function CoursePage({ 
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
      {/* <div className="bg-green-500 text-white p-6 rounded-lg mb-4 text-center">
        <h1 className="text-3xl font-bold">✓ SUCCESS!</h1>
        <p className="text-xl mt-2">Route is working: {courseId}</p>
      </div> */}

      {/* Header */}
      <div className="border-b border-gray-300 pb-3 mb-4">        
        <Image src={dummyImage} alt="dummy"/>
        <h2 className="text-2xl font-bold text-gray-800">{courseTitle} Course</h2>
      </div>
      <AssignmentContainer/>
    </div>
  );
}
