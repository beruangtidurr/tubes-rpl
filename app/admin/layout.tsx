"use client";

import { usePathname } from 'next/navigation';
import ChatContainer from '../ui/chatContainer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Default view when on /chat
  return <div className="text-gray-900">{children}</div>;
}
