'use client';

import { MessageSquare } from 'lucide-react';

interface AIChatToggleButtonProps {
  onClick: () => void;
}

export default function AIChatToggleButton({ onClick }: AIChatToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Open AI Chat"
      className="flex flex-col items-center justify-center gap-1 w-8 h-auto py-3 bg-white border-l border-slate-200 hover:bg-teal-50 transition-colors"
    >
      <MessageSquare className="w-4 h-4 text-teal-600" />
      <span
        className="text-[9px] text-slate-500 font-medium"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
      >
        AI Chat
      </span>
    </button>
  );
}
