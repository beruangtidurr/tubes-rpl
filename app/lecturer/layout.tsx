"use client";

import { usePathname } from 'next/navigation';
import ChatContainer from '../ui/chatContainer';

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default view when on /chat
  return <div className="text-gray-900">{children}</div>;
}
