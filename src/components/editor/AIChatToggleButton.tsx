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
      className="flex flex-col items-center justify-center gap-1 w-8 h-auto py-3 bg-[hsl(0,0%,16%)] border-l border-[hsl(0,0%,22%)] hover:bg-[hsl(0,0%,22%)] transition-colors"
    >
      <MessageSquare className="w-4 h-4 text-blue-400" />
      <span
        className="text-[9px] text-gray-400 font-medium"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
      >
        AI Chat
      </span>
    </button>
  );
}
