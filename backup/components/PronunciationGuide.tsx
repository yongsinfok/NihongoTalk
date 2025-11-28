import React from 'react';
import { Ear, Music2, Timer } from 'lucide-react';

export const PronunciationGuide: React.FC = () => {
  return (
    <div className="w-full bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-sakura-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-sakura-100">
        <div className="p-1.5 bg-sakura-100 text-sakura-600 rounded-lg">
          <Ear size={16} />
        </div>
        <h3 className="font-semibold text-sm text-slate-700">Pronunciation Tips</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-3 text-xs text-slate-600 group">
          <div className="mt-0.5 text-sakura-400 group-hover:text-sakura-500 transition-colors">
            <Music2 size={14} />
          </div>
          <div>
            <span className="font-bold text-slate-700 block mb-0.5">Pitch Accent</span>
            Japanese is tonal. <span className="text-sakura-600 font-medium">Hashi</span> (chopsticks) vs <span className="text-sakura-600 font-medium">Hashi</span> (bridge). Listen to the melody.
          </div>
        </div>

        <div className="flex gap-3 text-xs text-slate-600 group">
          <div className="mt-0.5 text-sakura-400 group-hover:text-sakura-500 transition-colors">
            <Timer size={14} />
          </div>
          <div>
            <span className="font-bold text-slate-700 block mb-0.5">Long Vowels (Chouon)</span>
            Hold sounds fully! <span className="text-sakura-600 font-medium">Obasan</span> (aunt) vs <span className="text-sakura-600 font-medium">Obaasan</span> (grandmother).
          </div>
        </div>
      </div>
    </div>
  );
};
