export default function ChatIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[400px]">
      <div className="bg-blue-100 p-4 rounded-lg mb-4">
        <p className="text-sm text-blue-800">📍 You are on: /chat (index page)</p>
      </div>
      <h2 className="text-2xl font-bold text-gray-800">Select a Chat Room</h2>
      <p className="text-gray-500 mt-2">Use the chat cards on the right to navigate to a specific course discussion.</p>
    </div>
  );
}
