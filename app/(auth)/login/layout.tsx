// app/(auth)/login/layout.tsx
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 flex items-center justify-center">
      {children}
    </div>
  );
}