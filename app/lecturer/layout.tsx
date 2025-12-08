// app/(main)/layout.tsx
import type { ReactNode } from "react";
import Panel from "@/app/ui/panel";
import NavbarLecturer from "@/app/ui/navbarLecturer";
import { ChatProvider } from "@/app/context/ChatContext";
import { CourseProvider } from "@/app/context/CourseContext";

export default function LecturerLayout({ children }: { children: ReactNode }) {
  return (
    <ChatProvider>
      <CourseProvider>
        <div className="min-h-screen flex flex-col">
          <NavbarLecturer />

          <main className="p-8 bg-[#6ec0ff] grow flex flex-col">
            <div className="grid gap-6 grow">

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
