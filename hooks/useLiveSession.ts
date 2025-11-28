
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ConnectionState, VolumeLevel, Feedback, TranscriptItem } from '../types';
import { base64ToUint8Array, uint8ArrayToBase64, downsampleTo16k, decodeAudioData } from '../utils/audioUtils';

const OUTPUT_SAMPLE_RATE = 24000; // Gemini response rate
const DEFAULT_SYSTEM_INSTRUCTION = `You are Sakura, a friendly and patient Japanese language tutor. 
Your goal is to help the user practice Japanese conversation. 
Speak primarily in natural, polite Japanese suitable for daily life. 
**Feedback**: Listen carefully to the user's Japanese.
1. **Pronunciation**: Pitch accent, long vowels, intonation.
2. **Grammar**: Particles, conjugations, natural phrasing.
If you detect an error in pronunciation OR grammar, use the 'report_feedback' tool to provide the correction and advice in Chinese.
Keep verbal responses concise (1-3 sentences) to encourage dialogue. 
Be encouraging and warm.`;

const feedbackToolDeclaration: FunctionDeclaration = {
  name: 'report_feedback',
  description: 'Report pronunciation, grammar, or vocabulary feedback to the user interface card. Use this whenever the user makes a mistake.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      japanese: {
        type: Type.STRING,
        description: 'The Japanese word or phrase containing the error, or the corrected version.',
      },
      advice: {
        type: Type.STRING,
        description: 'Brief advice in Chinese explaining the grammar rule, particle usage, or pronunciation correction.',
      },
      correction: {
        type: Type.STRING,
        description: 'The fully corrected Japanese sentence or phrase.',
      },
    },
    required: ['japanese', 'advice'],
  },
};

export const useLiveSession = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<VolumeLevel>({ input: 0, output: 0 });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [currentAiSubtitle, setCurrentAiSubtitle] = useState<string>('');

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const volumeIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for accumulation to avoid dependency issues in callbacks
  const currentInputTranscriptionRef = useRef<string>('');
  const currentOutputTranscriptionRef = useRef<string>('');

  const cleanup = useCallback(() => {
    // Stop all audio sources
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourcesRef.current.clear();

    // Disconnect script processor
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current.onaudioprocess = null;
      } catch (e) { /* ignore */ }
      scriptProcessorRef.current = null;
    }

    // Close audio contexts
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear interval
    if (volumeIntervalRef.current) {
      window.clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }

    // Close session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        try { session.close(); } catch (e) { console.error("Error closing session", e); }
      }).catch(() => {});
      sessionPromiseRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume({ input: 0, output: 0 });
    setFeedback(null);
    setCurrentAiSubtitle('');
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';
  }, []);

  const connect = useCallback(async (customSystemInstruction?: string) => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key not found. Please select an API key in the settings.");
      }

      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      setFeedback(null);
      setTranscripts([]);
      setCurrentAiSubtitle('');

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const inputCtx = new AudioContextClass({ latencyHint: 'interactive' }); 
      const outputCtx = new AudioContextClass({ sampleRate: OUTPUT_SAMPLE_RATE, latencyHint: 'interactive' });
      
      await inputCtx.resume();
      await outputCtx.resume();

      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      const inputAnalyser = inputCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyser.smoothingTimeConstant = 0.5;
      inputAnalyserRef.current = inputAnalyser;

      const outputAnalyser = outputCtx.createAnalyser();
      outputAnalyser.fftSize = 256;
      outputAnalyser.smoothingTimeConstant = 0.5;
      outputAnalyserRef.current = outputAnalyser;

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const actualSampleRate = inputCtx.sampleRate;
      const finalSystemInstruction = customSystemInstruction || DEFAULT_SYSTEM_INSTRUCTION;

      let sessionPromise: Promise<any>;

      sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: finalSystemInstruction,
          tools: [{ functionDeclarations: [feedbackToolDeclaration] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: async () => {
            console.log('Session opened');
            setConnectionState(ConnectionState.CONNECTED);

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;
            
            // Create a GainNode to mute the local input so the user doesn't hear themselves
            const muteNode = inputCtx.createGain();
            muteNode.gain.value = 0;

            source.connect(inputAnalyser);
            inputAnalyser.connect(scriptProcessor);
            // Connect script processor to mute node, then to destination
            // This allows the script processor to run (it needs a destination) without audio feedback
            scriptProcessor.connect(muteNode);
            muteNode.connect(inputCtx.destination);

            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmInt16 = downsampleTo16k(inputData, actualSampleRate);
              const uint8 = new Uint8Array(pcmInt16.buffer);
              const base64 = uint8ArrayToBase64(uint8);

              sessionPromise.then((session: any) => {
                session.sendRealtimeInput({
                  media: {
                    mimeType: 'audio/pcm;rate=16000',
                    data: base64
                  }
                });
              }).catch(err => {
                console.warn("Failed to send realtime input:", err);
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.outputTranscription?.text) {
              const text = message.serverContent.outputTranscription.text;
              currentOutputTranscriptionRef.current += text;
              setCurrentAiSubtitle(currentOutputTranscriptionRef.current);
            }
            
            if (message.serverContent?.inputTranscription?.text) {
              const text = message.serverContent.inputTranscription.text;
              currentInputTranscriptionRef.current += text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscriptionRef.current.trim();
              const aiText = currentOutputTranscriptionRef.current.trim();
              
              if (userText || aiText) {
                setTranscripts(prev => {
                  const newItems: TranscriptItem[] = [];
                  if (userText) {
                    newItems.push({
                      id: Date.now() + '-user',
                      role: 'user',
                      text: userText,
                      timestamp: Date.now(),
                      isFinal: true
                    });
                  }
                  if (aiText) {
                    newItems.push({
                      id: Date.now() + '-ai',
                      role: 'ai',
                      text: aiText,
                      timestamp: Date.now() + 1, // Ensure distinct order
                      isFinal: true
                    });
                  }
                  return [...prev, ...newItems];
                });
              }

              // Reset buffers
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }

            // Handle Tool Calls (Feedback)
            if (message.toolCall) {
              const calls = message.toolCall.functionCalls;
              if (calls && calls.length > 0) {
                const call = calls[0];
                if (call.name === 'report_feedback') {
                  const args = call.args as any;
                  setFeedback({
                    japanese: args.japanese,
                    advice: args.advice,
                    correction: args.correction
                  });
                  
                  sessionPromise.then((session: any) => {
                    session.sendToolResponse({
                      functionResponses: calls.map(c => ({
                        id: c.id,
                        name: c.name,
                        response: { result: 'ok' }
                      }))
                    });
                  });
                }
              }
            }

            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputContextRef.current && outputAnalyserRef.current) {
              const ctx = outputContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(base64Audio),
                ctx,
                OUTPUT_SAMPLE_RATE
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAnalyserRef.current);
              outputAnalyserRef.current.connect(ctx.destination);
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;

              source.onended = () => {
                source.disconnect();
                audioSourcesRef.current.delete(source);
              };
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => {
                  try { s.stop(); } catch(e) {}
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              currentOutputTranscriptionRef.current = '';
              setCurrentAiSubtitle('');
            }
          },
          onclose: () => {
            console.log('Session closed');
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err: any) => {
            console.error('Session error', err);
            const errorMessage = err.message || "Connection error";
            setError(errorMessage);
            setConnectionState(ConnectionState.ERROR);
            cleanup();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

      volumeIntervalRef.current = window.setInterval(() => {
        if (!inputAnalyserRef.current || !outputAnalyserRef.current) return;
        const inputData = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
        inputAnalyserRef.current.getByteFrequencyData(inputData);
        const inputAvg = inputData.reduce((a, b) => a + b) / inputData.length;

        const outputData = new Uint8Array(outputAnalyserRef.current.frequencyBinCount);
        outputAnalyserRef.current.getByteFrequencyData(outputData);
        const outputAvg = outputData.reduce((a, b) => a + b) / outputData.length;

        setVolume({
          input: Math.min(1, (inputAvg / 128) * 1.5),
          output: Math.min(1, (outputAvg / 128) * 1.5)
        });
      }, 50);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start session");
      setConnectionState(ConnectionState.ERROR);
      cleanup();
    }
  }, [cleanup]);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const sendTextMessage = useCallback((text: string) => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.sendRealtimeInput({
          content: [{ parts: [{ text }] }]
        });
      });
    }
  }, []);

  return {
    connectionState,
    error,
    volume,
    connect,
    disconnect,
    feedback,
    sendTextMessage,
    transcripts,
    currentAiSubtitle
  };
};
