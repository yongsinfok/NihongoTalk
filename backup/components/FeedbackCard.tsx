
import React from 'react';
import { Sparkles, MessageCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Feedback } from '../types';

interface FeedbackCardProps {
  data: Feedback;
  onRetry?: () => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ data, onRetry }) => {
  if (!data) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md border border-sakura-200 rounded-2xl p-5 shadow-lg shadow-sakura-100/50 w-full max-w-sm mx-auto transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-sakura-100 text-sakura-500 rounded-full shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="space-y-2 w-full">
          <div>
            <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-sakura-500 uppercase tracking-wider">Pronunciation Tip</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800 leading-snug">
              {data.japanese}
            </h3>
          </div>
          
          <div className="bg-sakura-50 rounded-lg p-3 border border-sakura-100 flex gap-2">
            <MessageCircle size={16} className="text-sakura-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">
              {data.advice}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {data.correction && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pl-1">
                <ArrowRight size={12} />
                <span>Try: <span className="font-medium text-slate-700">{data.correction}</span></span>
              </div>
            )}
            
            {onRetry && (
              <button 
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-sakura-400 hover:bg-sakura-500 rounded-full transition-colors shadow-sm active:scale-95"
              >
                <RefreshCw size={12} />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
