import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Clapperboard,
  Camera,
  Layers,
  Wand2,
  Film,
  CheckCircle,
} from 'lucide-react';
import { Project } from '../types/studio';
import { GeminiTextGenerator } from '../services/aiProviders';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Greetings Director! I am your ANIMORA Filmmaking Assistant. Ask me to refine dialogue, suggest cinematic lenses, elevate lighting schemes, or fix narrative pacing.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const textGen = new GeminiTextGenerator();
      const reply = await textGen.askAssistant({
        message: userText,
        projectContext: {
          title: project.title,
          genre: project.genre,
          style: project.visualStyle,
          activeScene: project.scenes.find((s) => s.id === project.activeSceneId)?.title,
          characters: project.characters.map((c) => c.name),
        },
        conversationHistory: newMessages.slice(-6),
      });

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry Director: ${err.message || 'Error communicating with assistant.'}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col z-50 animate-slide-left">
      {/* Header */}
      <div className="h-12 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-purple-950 border border-purple-800 text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
              Director AI
            </div>
            <div className="text-[10px] text-zinc-500">Cinematography & Script Doctor</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-zinc-200 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar text-xs">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-500 text-xs italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-purple-400" />
            <span>Analyzing scene and optics...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 border-t border-zinc-900 bg-zinc-950/80 flex gap-1.5 overflow-x-auto text-[10px] custom-scrollbar">
        {[
          'Make this scene feel more cinematic',
          'Make the fight more intense',
          'Give me a dramatic camera angle',
          'Make this character look terrified',
          'Make the lighting feel like sunset',
          'Create five possible camera angles',
          'Animate this character walking toward the camera',
        ].map((q) => (
          <button
            key={q}
            onClick={() => setInput(q)}
            className="px-2 py-1 rounded bg-zinc-900 hover:bg-purple-950/60 text-zinc-400 hover:text-purple-200 border border-zinc-800 whitespace-nowrap cursor-pointer transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center gap-2 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask Director AI..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 outline-none focus:border-purple-600"
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg cursor-pointer transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
