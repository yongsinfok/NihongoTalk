
import React, { useState, useEffect } from 'react';
import { MessageCircle, Info, Coffee, MapPin, User, Sparkles, Gamepad2, GraduationCap, History } from 'lucide-react';
import clsx from 'clsx';
import { useLiveSession } from './hooks/useLiveSession';
import { Visualizer } from './components/Visualizer';
import { ControlPanel } from './components/ControlPanel';
import { TopicSelector, Topic } from './components/TopicSelector';
import { FeedbackCard } from './components/FeedbackCard';
import { PronunciationGuide } from './components/PronunciationGuide';
import { SubtitleOverlay } from './components/SubtitleOverlay';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ConnectionState } from './types';

// Define conversation topics and their corresponding system instructions
const TOPICS: Topic[] = [
  {
    id: 'free_talk',
    label: 'Free Talk',
    icon: <Sparkles size={16} />,
    instruction: `You are Sakura, a friendly and patient Japanese language tutor. 
Your goal is to help the user practice Japanese conversation. 
Speak primarily in natural, polite Japanese suitable for daily life. 
**Feedback**: 
Listen carefully to the user's Japanese. 
1. If you detect unnatural sounds, intonation, or pitch accent.
2. If you detect grammar mistakes (wrong particles, verb conjugations, unnatural phrasing).
**Action**: Use the 'report_feedback' tool to provide the specific correction and advice in Chinese.
Keep your responses concise (1-3 sentences) to encourage back-and-forth dialogue. 
Be encouraging and warm.`
  },
  {
    id: 'ordering',
    label: 'Order Food',
    icon: <Coffee size={16} />,
    instruction: `Roleplay Simulation: You are a waiter at a Japanese Izakaya (pub). The user is a customer.
Start by welcoming them with a cheerful "Irasshaimase!" and asking how many people are in their party.
Guide them through ordering drinks and food. 
**Feedback**: If the user makes pronunciation or grammar errors (e.g., using the wrong counter for items), use the 'report_feedback' tool to correct them in Chinese, then continue the roleplay in Japanese.
Keep the interaction natural.`
  },
  {
    id: 'travel',
    label: 'Travel Help',
    icon: <MapPin size={16} />,
    instruction: `Roleplay Simulation: You are a helpful local in Tokyo. The user looks lost.
Approach them kindly and ask if they need help (using polite Japanese).
**Feedback**: If they mispronounce place names or use incorrect grammar when asking for directions, use the 'report_feedback' tool to kindly correct them in Chinese.
Maintain the persona of a helpful stranger.`
  },
  {
    id: 'hobbies',
    label: 'Hobbies',
    icon: <Gamepad2 size={16} />,
    instruction: `Conversation Topic: Hobbies and Free Time.
Ask the user what they like to do on weekends.
Share some common Japanese hobbies (like Karaoke, Onsen, or Anime) to spark conversation.
**Feedback**: If the user uses the wrong tone, pronunciation, or grammar (e.g. wrong verb forms for likes/dislikes), use the 'report_feedback' tool to provide a quick tip in Chinese, then continue the chat.`
  },
  {
    id: 'intro',
    label: 'Self Intro',
    icon: <User size={16} />,
    instruction: `Practice Mode: Self Introduction (Jiko Shoukai).
Help the user practice their self-introduction.
Start by introducing yourself briefly, then ask the user to introduce themselves.
**Feedback**: Pay close attention to pronunciation and grammar. After they speak, use the 'report_feedback' tool to give specific feedback in Chinese on what sounded good and what needs improvement (long vowels, particles, polite forms).`
  }
];

const App: React.FC = () => {
  const { 
    connectionState, 
    error, 
    volume, 
    connect, 
    disconnect, 
    feedback, 
    sendTextMessage,
    transcripts,
    currentAiSubtitle
  } = useLiveSession();
  
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('free_talk');
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasApiKey(hasKey);
        } else {
          // Fallback for development outside aistudio environment
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key:", e);
        // Default to true if check fails to avoid blocking UI unnecessarily
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success after dialog interaction per instructions
      setHasApiKey(true);
    }
  };

  const handleConnect = () => {
    const selectedTopic = TOPICS.find(t => t.id === selectedTopicId);
    let instruction = selectedTopic?.instruction || '';

    if (isPracticeMode) {
      instruction += `
      
      IMPORTANT: STRICT PRACTICE MODE ENABLED.
      You are now a strict language coach. 
      1. Stop the user immediately if they make ANY pronunciation, pitch accent, or grammar mistake.
      2. Use the 'report_feedback' tool to explicitly correct the mistake in Chinese.
      3. Ask the user to repeat the corrected phrase.
      4. Be more directive and less casual than the standard roleplay. Ensure they get it right.`;
    }

    connect(instruction);
  };

  const handleRetry = () => {
    if (feedback && connectionState === ConnectionState.CONNECTED) {
      const targetPhrase = feedback.correction || feedback.japanese;
      sendTextMessage(`I will try to pronounce "${targetPhrase}" again. Please listen and check.`);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between p-6 safe-area-inset-bottom overflow-hidden">
      
      {/* History Drawer */}
      <HistoryDrawer 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        transcripts={transcripts}
      />

      {/* Header */}
      <header className="w-full flex justify-between items-center z-10 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sakura-400 flex items-center justify-center text-white shadow-sm">
            <span className="font-bold text-lg">JP</span>
          </div>
          <h1 className="text-xl font-bold text-slate-700 tracking-tight">Nihongo Talk</h1>
        </div>
        <div className="flex gap-2">
          {transcripts.length > 0 && (
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-slate-400 hover:text-sakura-500 hover:bg-sakura-50 rounded-full transition-all"
            >
              <History size={24} />
            </button>
          )}
          <button className="text-slate-400 hover:text-sakura-500 transition-colors p-2">
            <Info size={24} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-4 relative">
        
        {/* Connection Status / Visualizer */}
        <div className="flex flex-col items-center gap-6 w-full relative"> 
           <Visualizer 
             volume={volume} 
             active={connectionState === ConnectionState.CONNECTED} 
           />
           
           {/* Subtitle Overlay */}
           {connectionState === ConnectionState.CONNECTED && currentAiSubtitle && (
             <div className="absolute top-[280px] w-full">
               <SubtitleOverlay text={currentAiSubtitle} />
             </div>
           )}
           
           {/* Visual Feedback Card (appears during session) */}
           {connectionState === ConnectionState.CONNECTED && feedback && (
             <div className="w-full px-2 animate-in slide-in-from-top-4 fade-in duration-500 z-10 mt-4">
               <FeedbackCard 
                 data={feedback} 
                 onRetry={handleRetry}
               />
             </div>
           )}
        </div>

        {/* Instructions / Context */}
        {connectionState === ConnectionState.DISCONNECTED && (
          <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-2 px-4">
              <h2 className="text-2xl font-bold text-slate-800">
                {hasApiKey ? "Choose a Topic" : "Setup Required"}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                {hasApiKey 
                  ? "Select a conversation scenario to start practicing."
                  : "To start using the live conversation features, please select a valid API Key from a paid project."}
              </p>
            </div>

            {hasApiKey && (
              <>
                <div className="w-full space-y-3">
                  {/* Mode Toggle */}
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Conversation Mode
                    </span>
                    <button
                      onClick={() => setIsPracticeMode(!isPracticeMode)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 border",
                        isPracticeMode 
                          ? "bg-sakura-50 border-sakura-200 text-sakura-600 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-500"
                      )}
                    >
                      <div className={clsx(
                        "transition-colors duration-300",
                        isPracticeMode ? "text-sakura-500" : "text-slate-400"
                      )}>
                        <GraduationCap size={16} />
                      </div>
                      <span className="text-xs font-bold">
                        {isPracticeMode ? 'Strict Practice' : 'Casual Chat'}
                      </span>
                      <div className={clsx(
                        "w-8 h-4 rounded-full relative transition-colors duration-300 ml-1",
                        isPracticeMode ? "bg-sakura-500" : "bg-slate-200"
                      )}>
                        <div className={clsx(
                          "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300",
                          isPracticeMode ? "translate-x-4" : "translate-x-0"
                        )} />
                      </div>
                    </button>
                  </div>

                  <TopicSelector 
                    topics={TOPICS}
                    selectedTopicId={selectedTopicId}
                    onSelectTopic={setSelectedTopicId}
                  />
                </div>
                
                {selectedTopicId === 'free_talk' && <PronunciationGuide />}
              </>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="absolute top-0 w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center shadow-sm animate-in fade-in slide-in-from-top-4">
            {error}
          </div>
        )}
      </main>

      {/* Footer / Controls */}
      <footer className="w-full max-w-md pb-8 z-10">
         <ControlPanel 
           state={connectionState}
           onConnect={handleConnect}
           onDisconnect={disconnect}
           hasApiKey={hasApiKey}
           onSelectKey={handleSelectKey}
         />
         
         <div className="mt-8 flex justify-center gap-2 text-xs text-slate-400">
            <MessageCircle size={14} />
            <span>Powered by Gemini Live</span>
         </div>
      </footer>
    </div>
  );
};

export default App;
