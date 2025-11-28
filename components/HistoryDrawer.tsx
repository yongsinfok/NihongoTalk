
import React, { useRef, useEffect } from 'react';
import { X, User, Bot, Clock } from 'lucide-react';
import { TranscriptItem } from '../types';
import clsx from 'clsx';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcripts: TranscriptItem[];
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, transcripts }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, transcripts]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white/95 backdrop-blur-xl animate-in slide-in-from-right duration-300">
      <div className="flex items-center justify-between p-4 border-b border-sakura-100 bg-white/50">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-sakura-500" />
          <h2 className="font-bold text-slate-800">Conversation History</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-sakura-50 rounded-full text-slate-500 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Bot size={48} className="opacity-20" />
            <p>No conversation yet.</p>
          </div>
        ) : (
          transcripts.map((item) => (
            <div 
              key={item.id} 
              className={clsx(
                "flex gap-3 max-w-[90%]",
                item.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                item.role === 'user' ? "bg-slate-200 text-slate-600" : "bg-sakura-400 text-white"
              )}>
                {item.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={clsx(
                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                item.role === 'user' 
                  ? "bg-slate-100 text-slate-800 rounded-tr-none" 
                  : "bg-sakura-50 text-slate-800 rounded-tl-none border border-sakura-100"
              )}>
                {item.text}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
