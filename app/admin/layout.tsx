// app/(main)/layout.tsx
import type { ReactNode } from "react";
import Panel from "@/app/ui/panel";
import NavbarAdmin from "@/app/ui/navbarAdmin";
import ChatContainer from "@/app/ui/chatContainer";
import { ChatProvider } from "@/app/context/ChatContext";
import { CourseProvider } from "@/app/context/CourseContext";

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <CourseProvider>
        <div className="min-h-screen flex flex-col">
          <NavbarAdmin />
          
          <main className="p-8 bg-[#6ec0ff] grow flex flex-col">
            <div className="grid grid-cols gap-6 grow">
              {/* Main Content Column */}
              <div className="flex flex-col">
                <Panel>
                  <div className="text-gray-900 h-full">{children}</div>
                </Panel>
              </div>
            </div>
          </main>
        </div>
      </CourseProvider>
    </ChatProvider>
  );
}
