// app/(main)/layout.tsx
import type { ReactNode } from "react";
import Panel from "@/app/ui/panel";
import Navbar from "@/app/ui/navbar";
import Calendar from "@/app/ui/Reminder";
import { ChatProvider } from "@/app/context/ChatContext";
import { CourseProvider } from "@/app/context/CourseContext";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <CourseProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />

          <main className="p-8 bg-[#6ec0ff] grow flex flex-col">
            <div className="grid grid-cols-[350px_1fr] gap-6 grow">
              {/* Calendar Column */}
              <div className="flex flex-col">
                <Panel>
                  <Calendar />
                </Panel>
              </div>

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
