'use client';

import { formatDistanceToNow } from 'date-fns';
import type { ChatMessage as ChatMessageType } from '@/types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const timeAgo = formatDistanceToNow(message.timestamp, { addSuffix: true });

  return (
    <div className={`flex flex-col mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? 'bg-teal-600 text-white'
            : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        {/* Attachment previews */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.attachments.map((att, i) =>
              att.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`data:${att.mimeType};base64,${att.data}`}
                  alt={att.name}
                  className="max-w-[120px] max-h-[80px] rounded object-cover border border-white/20"
                />
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-1 bg-white/10 rounded px-2 py-0.5 text-[10px] opacity-80"
                >
                  <span>📄</span>
                  <span className="truncate max-w-[100px]">{att.name}</span>
                </div>
              )
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap break-words">{message.content || '(no response text)'}</p>

        {!isUser && message.type === 'edit' && message.applied && (
          <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 rounded px-2 py-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            Applied
          </div>
        )}
      </div>
      <span className="text-[10px] text-slate-400 mt-1 px-1">{timeAgo}</span>
    </div>
  );
}
