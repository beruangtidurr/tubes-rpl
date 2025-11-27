// app/context/ChatContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ChatInfo = {
  title: string;
  team: number;
  slug: string;
} | null;

type ChatContextType = {
  selectedChat: ChatInfo;
  setSelectedChat: (chat: ChatInfo) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [selectedChat, setSelectedChat] = useState<ChatInfo>(null);

  return (
    <ChatContext.Provider value={{ selectedChat, setSelectedChat }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}