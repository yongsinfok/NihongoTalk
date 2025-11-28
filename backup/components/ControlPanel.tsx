import React from 'react';
import { Phone, PhoneOff, Key } from 'lucide-react';
import { ConnectionState } from '../types';

interface ControlPanelProps {
  state: ConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  state, 
  onConnect, 
  onDisconnect, 
  hasApiKey, 
  onSelectKey 
}) => {
  const isConnected = state === ConnectionState.CONNECTED;
  const isConnecting = state === ConnectionState.CONNECTING;

  if (isConnected || isConnecting) {
    return (
      <div className="flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="text-sakura-600 font-medium text-lg animate-pulse">
          {isConnecting ? 'Connecting...' : 'Listening...'}
        </div>
        
        <button
          onClick={onDisconnect}
          className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500 text-white shadow-xl hover:bg-red-600 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-200"
          aria-label="End call"
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-20 group-hover:opacity-40" />
          <PhoneOff size={32} />
        </button>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
        <div className="text-slate-500 text-sm font-medium">
          Set up your API Key to start
        </div>
        
        <button
          onClick={onSelectKey}
          className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 text-white shadow-2xl hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-slate-300"
          aria-label="Select API Key"
        >
          <Key size={32} className="fill-current" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
      <div className="text-slate-500 text-sm font-medium">
        Tap to start practice
      </div>
      
      <button
        onClick={onConnect}
        className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-sakura-400 to-sakura-500 text-white shadow-2xl hover:shadow-sakura-300/50 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sakura-200"
        aria-label="Start conversation"
      >
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
        <Phone size={40} className="fill-current" />
      </button>
    </div>
  );
};