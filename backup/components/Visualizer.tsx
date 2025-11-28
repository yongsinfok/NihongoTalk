import React from 'react';
import clsx from 'clsx';
import { VolumeLevel } from '../types';

interface VisualizerProps {
  volume: VolumeLevel;
  active: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ volume, active }) => {
  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Background decoration */}
      <div className={clsx(
        "absolute inset-0 bg-sakura-200 rounded-full blur-3xl opacity-30 transition-all duration-1000",
        active && "animate-pulse-slow"
      )}></div>

      {/* AI Circle (Output) */}
      <div 
        className="absolute bg-gradient-to-tr from-sakura-400 to-rose-400 rounded-full shadow-lg transition-all duration-100 ease-out flex items-center justify-center"
        style={{
          width: `${120 + (volume.output * 100)}px`,
          height: `${120 + (volume.output * 100)}px`,
          opacity: active ? 0.9 : 0.5
        }}
      >
        <div className="text-white text-opacity-80 font-bold text-2xl tracking-widest">
          {active ? 'AI' : '...'}
        </div>
      </div>

      {/* User Ripple (Input) */}
      <div 
        className="absolute border-4 border-white/50 rounded-full transition-all duration-75 ease-out pointer-events-none"
        style={{
          width: `${140 + (volume.input * 150)}px`,
          height: `${140 + (volume.input * 150)}px`,
          opacity: volume.input > 0.1 ? 0.6 : 0,
          borderColor: 'rgba(255, 255, 255, 0.6)'
        }}
      />
    </div>
  );
};
