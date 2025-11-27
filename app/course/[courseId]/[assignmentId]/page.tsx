// app/course/[courseId]/[assignmentId]/page.tsx
export default function AssignmentDetailsPage({ 
  params,
}: {
  params: { courseId: string; assignmentId: string };
}) {
  const { courseId, assignmentId } = params;

  // Use courseId and assignmentId to fetch data and render the page
  return (
    <main>
      <h1>Assignment Details</h1>
      <p>Course ID: {courseId}</p>
      <p>Assignment ID: {assignmentId}</p>
      {/* ... rest of the page UI */}
    </main>
  );
}
