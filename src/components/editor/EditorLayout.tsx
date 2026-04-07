'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AIChatPanel from './AIChatPanel';
import AIChatToggleButton from './AIChatToggleButton';

const StudioWrapper = dynamic(() => import('./StudioWrapper'), { ssr: false });
const AI_CHAT_STORAGE_KEY = 'ai-chat-panel-open';

export default function EditorLayout() {
  const [aiChatOpen, setAiChatOpen] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
      if (stored !== null) setAiChatOpen(stored !== 'false');
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(AI_CHAT_STORAGE_KEY, aiChatOpen ? 'true' : 'false'); } catch {}
  }, [aiChatOpen]);

  return (
    <div className="flex" style={{ height: 'calc(100vh - 60px)' }}>
      {/* GrapesJS Studio SDK — includes blocks, layers, styles, traits panels */}
      <StudioWrapper />

      {/* AI Chat */}
      {aiChatOpen ? (
        <div className="shrink-0 flex flex-col border-l border-[#222]" style={{ width: 360 }}>
          <AIChatPanel onCollapse={() => setAiChatOpen(false)} />
        </div>
      ) : (
        <AIChatToggleButton onClick={() => setAiChatOpen(true)} />
      )}
    </div>
  );
}
