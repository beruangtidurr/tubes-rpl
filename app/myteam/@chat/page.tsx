import ChatCard from "@/app/ui/chatCard";

export default function MyTeamChat() {
  return (
    <div className="flex flex-col grow p-2">
      <h2 className="text-2xl font-bold mb-4">Chat</h2>

      <ChatCard title="Artificial Intelligence" team={1} />
      <ChatCard title="Manajemen Proyek" team={1} />
      <ChatCard title="Pengantar Sistem Informasi" team={1} />
    </div>
  );
}
