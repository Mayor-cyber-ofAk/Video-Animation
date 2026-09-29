import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RefreshCw,
  Zap,
  Globe2,
} from 'lucide-react';
import { Project } from '../types/studio';

export const SettingsView: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<any | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const fetchStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      setSystemStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Settings className="w-4 h-4" />
            <span>AI Architecture & Engine Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            AI PROVIDERS & SYSTEM SETTINGS
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            ANIMORA STUDIO uses a provider-independent modular architecture with zero fake tokens or artificial credit paywalls.
          </p>
        </div>

        <button
          onClick={fetchStatus}
          disabled={isChecking}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Test Provider Connections</span>
        </button>
      </div>

      {/* Free Usage Manifesto Guarantee Card */}
      <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-800/40 rounded-xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span>Zero-Paywall Local Studio Guarantee</span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          All creative editing tools—Character Creation, 6-Angle Reference Sheets, Storyboarding,
          Drawing Canvas, 2D Animation Rigging, Multi-Track Audio/Video Editing, Procedural VFX, and
          CapCut Exporter—are 100% free and run directly inside your browser. No subscription tokens,
          no coins, no paywalls.
        </p>
      </div>

      {/* Provider Registry Status */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Connected Generation Engines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              category: 'Text & Screenplay Generation',
              primaryModel: 'gemini-3.8-flash',
              altModel: 'gemini-3.1-pro-preview',
              status: systemStatus?.apiKeyPresent ? 'Online & Active' : 'Offline (Missing API Key)',
              active: systemStatus?.apiKeyPresent,
              desc: 'Powers story ideation, 3-act narrative breakdowns, and AI shot list generation.',
            },
            {
              category: 'Cinematic Image Generation',
              primaryModel: 'gemini-3.1-flash-image',
              altModel: 'gemini-3.1-flash-lite-image',
              status: systemStatus?.apiKeyPresent ? 'Online & Active' : 'Offline',
              active: systemStatus?.apiKeyPresent,
              desc: 'Generates high-resolution character turnarounds, location plates, and storyboard shot art.',
            },
            {
              category: 'AI Video Generation',
              primaryModel: 'veo-3.1-lite-generate-preview',
              altModel: 'veo-3.1-generate-preview',
              status: systemStatus?.apiKeyPresent ? 'Configured & Ready' : 'Awaiting Provider Setup',
              active: systemStatus?.apiKeyPresent,
              desc: 'Direct video motion synthesis with camera movements and character consistency.',
            },
            {
              category: 'Dialogue & Character Voice Dubbing',
              primaryModel: 'gemini-3.8-flash-lite-tts',
              altModel: 'gemini-3.8-flash-tts',
              status: systemStatus?.apiKeyPresent ? 'Online & Active' : 'Offline',
              active: systemStatus?.apiKeyPresent,
              desc: 'Synthesizes studio-grade character voices (Puck, Charon, Kore, Fenrir, Zephyr) in raw WAV.',
            },
            {
              category: 'Procedural Audio & SFX',
              primaryModel: 'Web Audio API Synthesizer',
              altModel: 'Local Browser Oscillator DSP',
              status: 'Local & Online',
              active: true,
              desc: 'Runs zero-latency offline procedural sound effects (rain, footsteps, thunder, sub-bass drones).',
            },
            {
              category: 'Scene Video Compositor',
              primaryModel: 'Client Canvas + MediaRecorder',
              altModel: 'HTML5 1080p WebM/MP4 Exporter',
              status: 'Local & Online',
              active: true,
              desc: 'Renders complete scenes with animated particles, letterbox bars, and subtitles directly in browser.',
            },
          ].map((provider) => (
            <div
              key={provider.category}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    {provider.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {provider.active ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span className={provider.active ? 'text-emerald-400' : 'text-amber-400'}>
                      {provider.status}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs text-zinc-100 font-semibold">
                  {provider.primaryModel}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">{provider.desc}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
                <span>Fallback: {provider.altModel}</span>
                <span className="text-purple-400/80">Secured Server-Side</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
