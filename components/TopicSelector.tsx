import React from 'react';
import clsx from 'clsx';
import { Coffee, MapPin, User, Gamepad2, Sparkles } from 'lucide-react';

export interface Topic {
  id: string;
  label: string;
  icon: React.ReactNode;
  instruction: string;
}

interface TopicSelectorProps {
  topics: Topic[];
  selectedTopicId: string;
  onSelectTopic: (id: string) => void;
  disabled?: boolean;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  topics,
  selectedTopicId,
  onSelectTopic,
  disabled = false
}) => {
  return (
    <div className="w-full overflow-x-auto pb-4 px-2 -mx-2 hide-scrollbar">
      <div className="flex gap-3 justify-start md:justify-center min-w-max">
        {topics.map((topic) => {
          const isSelected = selectedTopicId === topic.id;
          
          return (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              disabled={disabled}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border",
                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sakura-300",
                isSelected 
                  ? "bg-sakura-500 text-white border-transparent shadow-md scale-105" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-sakura-300 hover:text-sakura-500",
                disabled && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              {topic.icon}
              <span>{topic.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};