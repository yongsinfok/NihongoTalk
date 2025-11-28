
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export interface VolumeLevel {
  input: number;
  output: number;
}

export interface Feedback {
  japanese: string;
  advice: string;
  correction?: string;
}

export interface TranscriptItem {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}
