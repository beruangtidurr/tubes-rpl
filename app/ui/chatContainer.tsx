import ChatCard from "./chatCard";

interface ChatContainerProps {
  children: React.ReactNode;
}

export default function ChatContainer() {
  return (
    <div>
      <ChatCard title="Artificial Intelligence" team={1} />
      <ChatCard title="Manajemen Proyek" team={4} />
      <ChatCard title="Pengantar Sistem Informasi" team={2} />
    </div>
  )
}
