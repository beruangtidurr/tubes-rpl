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
            <div className="grid grid-cols-[350px_1fr] gap-6 grow">
              {/* Calendar Column */}
              <div className="flex flex-col">
                <Panel>
                  <div className="text-gray-900">
                    <h2 className="text-2xl font-bold mb-4">Courses</h2>
                    <div className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500 mb-3">
                      <p className="font-semibold">Dummy Courses</p>
                      <p className="text-sm text-gray-600">Desc...</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow border-l-4 border-blue-500 mb-3">
                      <p className="font-semibold">Dummy Courses</p>
                      <p className="text-sm text-gray-600">Desc...</p>
                    </div>
                    <div className="flex justify-center mt-auto p-4">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-150">
                        View Full Schedule
                      </button>
                    </div>
                  </div>
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
