'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { X, Send, Paperclip } from 'lucide-react';
import { useEditorContext } from './EditorContext';
import { useSelectedComponent } from '@/hooks/useSelectedComponent';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import type { ChatMessage as ChatMessageType, ChatAttachment } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const TEXT_TYPES = [
  'text/plain', 'text/html', 'text/css', 'text/javascript',
  'application/json', 'application/javascript', 'application/typescript',
];
const TEXT_EXTENSIONS = ['.txt', '.md', '.json', '.html', '.css', '.js', '.ts', '.tsx', '.jsx', '.csv', '.xml', '.yaml', '.yml'];

interface AIChatPanelProps {
  onCollapse: () => void;
}

export default function AIChatPanel({ onCollapse }: AIChatPanelProps) {
  const { editor, project, currentPageIndex, pages } = useEditorContext();
  const { selectedComponentJson, selectedComponentLabel } = useSelectedComponent(editor);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<'page' | 'component'>('page');
  const [inputValue, setInputValue] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages / streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const currentPage = pages[currentPageIndex];
  const contextLabel =
    mode === 'component' && selectedComponentLabel
      ? `Editing: ${selectedComponentLabel}`
      : `Page: ${currentPage?.name ?? 'Home'}`;

  const readFileAsAttachment = useCallback((file: File): Promise<ChatAttachment> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(`${file.name} exceeds 5 MB limit`));
        return;
      }

      const isImage = IMAGE_TYPES.includes(file.type);
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isTextFile = TEXT_TYPES.includes(file.type) || TEXT_EXTENSIONS.includes(ext);

      if (!isImage && !isTextFile) {
        reject(new Error(`${file.name}: unsupported format. Supported: images, text, JSON, HTML, CSS, JS, MD`));
        return;
      }

      const reader = new FileReader();
      if (isImage) {
        reader.readAsDataURL(file);
        reader.onload = () => {
          // Strip "data:image/...;base64," prefix — Claude just needs the raw base64
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(',')[1];
          resolve({ name: file.name, mimeType: file.type, data: base64, isImage: true });
        };
      } else {
        reader.readAsText(file);
        reader.onload = () => {
          resolve({ name: file.name, mimeType: file.type || 'text/plain', data: reader.result as string, isImage: false });
        };
      }
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    });
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const results = await Promise.allSettled(files.map(readFileAsAttachment));
    const succeeded: ChatAttachment[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        succeeded.push(r.value);
      } else {
        toast.error(r.reason?.message ?? 'Failed to read file');
      }
    }
    setAttachments(prev => [...prev, ...succeeded].slice(0, 5)); // max 5 attachments
    e.target.value = '';
  }, [readFileAsAttachment]);

  const removeAttachment = useCallback((idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if ((!text && attachments.length === 0) || isStreaming) return;

    const userMessage: ChatMessageType = {
      id: uuidv4(),
      role: 'user',
      content: text || '(See attached files)',
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setAttachments([]);
    setIsStreaming(true);

    const historyPayload = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text || '(See attached files)',
          projectId: String(project.id),
          pageIndex: currentPageIndex,
          selectedComponentJson: mode === 'component' ? selectedComponentJson : undefined,
          mode,
          attachments: attachments.length > 0 ? attachments : undefined,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${errBody}`);
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let finalResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr) continue;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk !== undefined) {
              accumulated += parsed.chunk;
            } else if (parsed.done && parsed.result) {
              finalResult = parsed.result;
            } else if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            console.warn('Failed to parse SSE line:', dataStr, parseErr);
          }
        }
      }

      // If done event was missed, try to parse accumulated text
      if (!finalResult && accumulated) {
        try {
          const clean = accumulated.trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```\s*$/, '')
            .trim();
          finalResult = JSON.parse(clean);
        } catch {
          const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try { finalResult = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
          }
        }
      }

      let applied = false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let componentsDiff: any = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let stylesDiff: any = null;
      const explanation = finalResult?.explanation ?? accumulated;
      const type: 'edit' | 'message' = finalResult?.type ?? 'message';

      if (finalResult) {
        componentsDiff = finalResult.componentsDiff ?? null;
        stylesDiff = finalResult.stylesDiff ?? null;

        if (type === 'edit' && editor) {
          try {
            if (mode === 'component' && componentsDiff) {
              // Component mode: only replace the selected component, not the whole page
              const selected = editor.getSelected();
              if (selected) {
                const patch = Array.isArray(componentsDiff) ? componentsDiff[0] : componentsDiff;
                selected.replaceWith(patch);
              } else {
                editor.setComponents(componentsDiff);
              }
            } else {
              // Page mode: replace the whole page
              if (componentsDiff) editor.setComponents(componentsDiff);
              if (stylesDiff) editor.setStyle(stylesDiff);
            }
            applied = true;
            toast.success('Changes applied to canvas');
          } catch (applyErr) {
            console.error('Failed to apply AI changes:', applyErr);
            toast.error('Failed to apply changes to canvas');
          }
        }
      }

      setMessages((prev) => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: explanation,
        type,
        applied,
        componentsDiff,
        stylesDiff,
        timestamp: new Date(),
      }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('AI chat error:', errMsg);
      toast.error('AI request failed');
      setMessages((prev) => [...prev, {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${errMsg}`,
        type: 'message',
        timestamp: new Date(),
      }]);
    } finally {
      setIsStreaming(false);
    }
  }, [inputValue, attachments, isStreaming, messages, project.id, currentPageIndex, selectedComponentJson, mode, editor]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(0,0%,14%)] border-l border-[hsl(0,0%,22%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[hsl(0,0%,22%)] shrink-0">
        <span className="text-sm font-semibold text-gray-100">AI Assistant</span>
        <div className="flex items-center gap-2">
          <div className="flex rounded overflow-hidden border border-[hsl(0,0%,28%)]">
            <button
              onClick={() => setMode('page')}
              className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                mode === 'page' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Page
            </button>
            <button
              onClick={() => setMode('component')}
              className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                mode === 'component' ? 'bg-blue-600 text-white' : 'bg-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Comp
            </button>
          </div>
          <button onClick={onCollapse} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context indicator */}
      <div className="px-3 py-1.5 border-b border-[hsl(0,0%,20%)] shrink-0">
        <p className="text-[11px] text-gray-400 truncate">
          <span className="text-gray-500">Context: </span>{contextLabel}
        </p>
      </div>

      {/* Messages scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 min-h-0">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 text-xs gap-2">
            <p>Ask me to edit your website or answer questions about it.</p>
            <p className="text-[10px] text-gray-600">
              Tip: Attach images or files using the paperclip icon.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <div className="flex flex-col items-start mb-3">
            <div className="bg-[hsl(0,0%,18%)] border border-[hsl(0,0%,25%)] rounded-lg">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="shrink-0 px-2 pt-2 flex flex-wrap gap-1.5 border-t border-[hsl(0,0%,22%)]">
          {attachments.map((att, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-[hsl(0,0%,20%)] border border-[hsl(0,0%,28%)] rounded px-2 py-1 text-[11px] text-gray-300 max-w-[140px]"
            >
              {att.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt={att.name}
                  className="w-5 h-5 object-cover rounded shrink-0"
                />
              ) : (
                <span className="shrink-0 text-blue-400">📄</span>
              )}
              <span className="truncate">{att.name}</span>
              <button
                onClick={() => removeAttachment(i)}
                className="shrink-0 text-gray-500 hover:text-gray-300 ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="shrink-0 border-t border-[hsl(0,0%,22%)] p-2">
        <div className="flex items-end gap-2">
          {/* Attach file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isStreaming}
            title="Attach file or image"
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-gray-200 hover:bg-[hsl(0,0%,20%)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.html,.css,.js,.ts,.tsx,.jsx,.csv,.xml,.yaml,.yml"
            className="hidden"
            onChange={handleFileChange}
          />

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to edit your site..."
            disabled={isStreaming}
            rows={2}
            className="flex-1 resize-none rounded bg-[hsl(0,0%,20%)] border border-[hsl(0,0%,28%)] text-sm text-gray-100 placeholder-gray-500 px-2 py-1.5 focus:outline-none focus:border-blue-500 disabled:opacity-50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || (!inputValue.trim() && attachments.length === 0)}
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-600 mt-1">Enter to send · Shift+Enter for newline · Paperclip to attach</p>
      </div>
    </div>
  );
}
