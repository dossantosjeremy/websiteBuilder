'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AIChatPanel from './AIChatPanel';
import AIChatToggleButton from './AIChatToggleButton';

const GrapesEditor = dynamic(() => import('./GrapesEditor'), { ssr: false });
const AI_CHAT_STORAGE_KEY = 'ai-chat-panel-open';
const LEFT_WIDTH_KEY = 'editor-left-panel-width';
const CHAT_WIDTH_KEY = 'editor-chat-panel-width';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/** Thin vertical drag handle */
function ResizeHandle({ onDrag }: { onDrag: (dx: number) => void }) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      onDrag(ev.clientX - lastX.current);
      lastX.current = ev.clientX;
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onDrag]);

  return (
    <div
      onMouseDown={onMouseDown}
      className="shrink-0 w-1 cursor-col-resize bg-slate-200 hover:bg-teal-400 active:bg-teal-500 transition-colors"
      style={{ zIndex: 10 }}
    />
  );
}

export default function EditorLayout() {
  const [aiChatOpen, setAiChatOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(260);
  const [chatWidth, setChatWidth] = useState(360);

  // Restore persisted widths and AI chat state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
      if (stored !== null) setAiChatOpen(stored !== 'false');
      const lw = Number(localStorage.getItem(LEFT_WIDTH_KEY));
      if (lw > 0) setLeftWidth(clamp(lw, 180, 480));
      const cw = Number(localStorage.getItem(CHAT_WIDTH_KEY));
      if (cw > 0) setChatWidth(clamp(cw, 280, 640));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(AI_CHAT_STORAGE_KEY, aiChatOpen ? 'true' : 'false'); } catch {}
  }, [aiChatOpen]);

  const handleLeftResize = useCallback((dx: number) => {
    setLeftWidth((w) => {
      const next = clamp(w + dx, 180, 480);
      try { localStorage.setItem(LEFT_WIDTH_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const handleChatResize = useCallback((dx: number) => {
    setChatWidth((w) => {
      const next = clamp(w - dx, 280, 640);
      try { localStorage.setItem(CHAT_WIDTH_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <div className="flex bg-white" style={{ height: 'calc(100vh - 60px)' }}>
      {/* GrapesJS — left panel + canvas */}
      <GrapesEditor leftPanelWidth={leftWidth} onLeftResize={handleLeftResize} />

      {/* Resize handle: canvas ↔ AI chat */}
      {aiChatOpen && <ResizeHandle onDrag={handleChatResize} />}

      {/* AI Chat */}
      {aiChatOpen ? (
        <div className="shrink-0 flex flex-col border-l border-slate-200 bg-white overflow-hidden"
          style={{ width: chatWidth }}>
          <AIChatPanel onCollapse={() => setAiChatOpen(false)} />
        </div>
      ) : (
        <AIChatToggleButton onClick={() => setAiChatOpen(true)} />
      )}
    </div>
  );
}
