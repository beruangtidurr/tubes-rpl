import React from 'react';

interface PanelProps {
  children: React.ReactNode;
}

export default function Panel({ children }: PanelProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg w-full h-full">
      {children}
    </div>
  );
}
