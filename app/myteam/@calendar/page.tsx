export default function MyTeamCalendar() {
  return (
    <div className="flex flex-col grow p-2 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Calendar</h2>
      <div className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500">
        <p className="font-semibold">Today's Focus:</p>
        <p className="text-sm text-gray-600">Complete Module 3 Quiz</p>
      </div>
      <div className="bg-white p-3 rounded-lg shadow border-l-4 border-yellow-500">
        <p className="font-semibold">Upcoming Due Date:</p>
        <p className="text-sm text-gray-600">Project Proposal (Friday)</p>
      </div>
      <div className="flex justify-center mt-auto p-4">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-150">
          View Full Schedule
        </button>
      </div>
    </div>
  );
}
