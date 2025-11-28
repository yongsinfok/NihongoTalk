
import React from 'react';
import { clsx } from 'clsx';

interface SubtitleOverlayProps {
  text: string;
}

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="w-full px-4 animate-in fade-in slide-in-from-bottom-2 duration-300 z-20">
      <div className="bg-black/60 backdrop-blur-sm text-white text-center rounded-xl p-4 shadow-lg mx-auto max-w-sm border border-white/10">
        <p className="text-lg font-medium leading-relaxed font-sans">{text}</p>
      </div>
    </div>
  );
};
