import React, { useState, useRef } from 'react';
import {
  Music,
  Mic,
  Volume2,
  Play,
  Pause,
  Sparkles,
  Download,
  Upload,
  Layers,
  Radio,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Project, Shot } from '../types/studio';
import { aiVoiceEngine, webAudioEngine } from '../services/aiProviders';

interface AudioStudioViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const AudioStudioView: React.FC<AudioStudioViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [dialogueText, setDialogueText] = useState(
    'If you want this drive... you’re going to have to take it from me.'
  );
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedVoiceUrl, setGeneratedVoiceUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSynthesizeDialogue = async () => {
    if (!dialogueText.trim()) return;
    setIsGeneratingVoice(true);
    setStatusMessage('Calling Gemini TTS for high-fidelity speech WAV...');
    try {
      const res = await aiVoiceEngine.generateVoice({
        text: dialogueText,
        voiceName: selectedVoice,
        style: 'Intense cinematic thriller dialogue with dramatic cadence',
      });
      setGeneratedVoiceUrl(res.audioUrl);
      const audio = new Audio(res.audioUrl);
      audio.play();
      setStatusMessage('Voice audio synthesized successfully');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Microphone recording
  const handleToggleRecord = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          stream.getTracks().forEach((t) => t.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        setStatusMessage('Recording voice from microphone...');
      } catch (err: any) {
        setStatusMessage(`Microphone error: ${err.message}`);
      }
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setStatusMessage('Recording completed');
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Music className="w-4 h-4" />
            <span>Audio Studio, Dialogue Dubbing & SFX Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            CINEMATIC SOUND DESIGN
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Synthesize character voices via Gemini TTS, trigger procedural Web Audio soundscapes, or record live foley.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-purple-950/80 border border-purple-700/60 text-purple-200 rounded-lg text-xs">
          {statusMessage}
        </div>
      )}

      {/* Grid: Dialogue Voice Dubbing & Foley SFX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Voice Synthesis (TTS) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gemini Dialogue Voice Synthesizer</span>
            </h3>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
              gemini-3.8-flash-lite-tts
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Select Voice Persona
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
              >
                <option value="Puck">Puck (Jay · Young Determined Protagonist)</option>
                <option value="Charon">Charon (The Masked Man · Deep Threatening Baritone)</option>
                <option value="Kore">Kore (Clear Heroic Female Lead)</option>
                <option value="Fenrir">Fenrir (Heavy Gruff Operative)</option>
                <option value="Zephyr">Zephyr (Soft Whispering Ghost)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Dialogue Script Line
              </label>
              <textarea
                rows={4}
                value={dialogueText}
                onChange={(e) => setDialogueText(e.target.value)}
                placeholder="Enter lines to speak..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-200 outline-none focus:border-purple-600 leading-relaxed font-sans text-xs"
              />
            </div>

            <button
              onClick={handleSynthesizeDialogue}
              disabled={isGeneratingVoice || !dialogueText.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 shadow-md shadow-purple-950 cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isGeneratingVoice ? 'Synthesizing...' : 'Synthesize Voice Clip'}</span>
            </button>

            {generatedVoiceUrl && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
                <span className="text-xs text-purple-300 font-mono">WAV audio ready</span>
                <button
                  onClick={() => new Audio(generatedVoiceUrl).play()}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-xs flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Play</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. Web Audio Foley & Atmosphere Synthesizer */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5" />
              <span>Procedural SFX & Foley Soundboard</span>
            </h3>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
              Web Audio Synthesizer
            </span>
          </div>

          <p className="text-xs text-zinc-400">
            Real-time algorithmic sound generators that run completely offline in browser:
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => webAudioEngine.playRain(3)}
              className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer group"
            >
              <div className="font-semibold text-zinc-200 group-hover:text-cyan-300">
                Monsoon Rain Loop
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Filtered white noise generator</div>
            </button>

            <button
              onClick={() => webAudioEngine.playFootstep()}
              className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer group"
            >
              <div className="font-semibold text-zinc-200 group-hover:text-cyan-300">
                Wet Bootstep Strike
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Exponential pitch decay foley</div>
            </button>

            <button
              onClick={() => webAudioEngine.playThunder()}
              className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer group"
            >
              <div className="font-semibold text-zinc-200 group-hover:text-cyan-300">
                Thunderclap Blast
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Subwoofer impact wave</div>
            </button>

            <button
              onClick={() => webAudioEngine.playSubDrone()}
              className="p-3 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg text-left transition-colors cursor-pointer group"
            >
              <div className="font-semibold text-zinc-200 group-hover:text-cyan-300">
                35Hz Dystopian Drone
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">Sawtooth sub-bass drone</div>
            </button>
          </div>

          {/* Microphone Live Voice Recorder */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Live Voiceover Microphone
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleRecord}
                className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isRecording ? 'Stop Recording' : 'Record Mic Foley / VO'}</span>
              </button>

              {recordedAudioUrl && (
                <button
                  onClick={() => new Audio(recordedAudioUrl).play()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Playback</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
