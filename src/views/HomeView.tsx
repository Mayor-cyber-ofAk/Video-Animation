import React from 'react';
import {
  Film,
  Plus,
  Play,
  Layers,
  Sparkles,
  Users,
  Clapperboard,
  LayoutGrid,
  Download,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Project } from '../types/studio';
import { exportProjectJson } from '../services/storage';

interface HomeViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  setActiveView: (view: string) => void;
  onNewProject: () => void;
}

const TEMPLATES = [
  {
    id: 'cyberpunk_noir',
    title: 'THE LAST CITY (CYBERPUNK)',
    genre: 'Cyberpunk Noir',
    shots: 6,
    duration: '40s',
    desc: 'Rain-drowned alleyway standoff between a solo runner and a masked corporate assassin.',
    style: 'Photorealistic',
    badge: 'Demo Project',
  },
  {
    id: 'anime_rooftop_duel',
    title: 'NEO-SHIBUYA CLASH',
    genre: 'Anime Action',
    shots: 5,
    duration: '35s',
    desc: 'High-speed katana duel under neon skyscrapers with stylized speed lines and anime camera pushes.',
    style: 'Anime',
    badge: 'Template',
  },
  {
    id: 'sci_fi_derelict',
    title: 'STATION 88: DERELICT',
    genre: 'Sci-Fi Suspense',
    shots: 7,
    duration: '50s',
    desc: 'Zero-g exploration of an abandoned deep space research vessel with claustrophobic lighting.',
    style: 'Cinematic Live Action',
    badge: 'Template',
  },
  {
    id: 'dark_fantasy_ruins',
    title: 'THE ASHEN VALE',
    genre: 'Dark Fantasy',
    shots: 6,
    duration: '45s',
    desc: 'A lone knight steps into cursed cathedral ruins under an eclipse.',
    style: 'Dark Fantasy',
    badge: 'Template',
  },
];

export const HomeView: React.FC<HomeViewProps> = ({
  project,
  setActiveView,
  onNewProject,
}) => {
  const activeScene = project.scenes[0];
  const totalShots = project.scenes.reduce((acc, s) => acc + s.shots.length, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-8 custom-scrollbar">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-gradient-to-r from-zinc-900 via-purple-950/20 to-zinc-900 p-8 shadow-2xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Studio Production Suite</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide">
            ANIMORA STUDIO
          </h1>

          <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
            Create worlds. Direct scenes. Animate stories. A complete browser-based animation and
            filmmaking workstation designed for scene-by-scene cinematic production and CapCut assembly.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => setActiveView('scene_builder')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-5 py-2.5 rounded-lg text-xs shadow-lg shadow-purple-950/60 transition-all cursor-pointer hover:scale-105"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Direct Active Scene</span>
            </button>

            <button
              onClick={() => setActiveView('export')}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium px-4 py-2.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Export for CapCut</span>
            </button>

            <button
              onClick={() => exportProjectJson(project)}
              className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-4 py-2.5 rounded-lg text-xs transition-colors"
            >
              <span>Backup Project JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Character Creator', view: 'characters', icon: Users, color: 'text-rose-400' },
          { label: 'Story & Script', view: 'story', icon: BookOpen, color: 'text-amber-400' },
          { label: 'Storyboard', view: 'storyboard', icon: LayoutGrid, color: 'text-indigo-400' },
          { label: 'AI Scene Builder', view: 'scene_builder', icon: Clapperboard, color: 'text-purple-400' },
          { label: 'Timeline Editor', view: 'timeline', icon: Layers, color: 'text-cyan-400' },
          { label: 'CapCut Render', view: 'export', icon: Download, color: 'text-emerald-400' },
        ].map((btn) => {
          const Icon = btn.icon;
          return (
            <button
              key={btn.view}
              onClick={() => setActiveView(btn.view)}
              className="p-4 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 rounded-xl text-left transition-all group cursor-pointer flex flex-col justify-between h-28"
            >
              <Icon className={`w-5 h-5 ${btn.color} group-hover:scale-110 transition-transform`} />
              <div>
                <div className="text-xs font-semibold text-zinc-200 group-hover:text-purple-300 transition-colors">
                  {btn.label}
                </div>
                <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                  <span>Open</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Project Overview Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Active Project
              </div>
              <h2 className="text-lg font-bold text-zinc-100 uppercase">{project.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded border border-zinc-700">
              {project.visualStyle}
            </span>
            <button
              onClick={() => setActiveView('scene_builder')}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium cursor-pointer"
            >
              Direct Scene →
            </button>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">{project.logline}</p>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Scenes</div>
            <div className="text-lg font-bold text-zinc-100 mt-0.5">{project.scenes.length}</div>
          </div>
          <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Total Shots</div>
            <div className="text-lg font-bold text-zinc-100 mt-0.5">{totalShots}</div>
          </div>
          <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Cast Members</div>
            <div className="text-lg font-bold text-zinc-100 mt-0.5">{project.characters.length}</div>
          </div>
          <div className="p-3 bg-zinc-950/60 rounded-lg border border-zinc-800/60">
            <div className="text-zinc-500 text-[10px] uppercase font-bold">Style Lock</div>
            <div className="text-sm font-semibold text-purple-400 mt-1 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
              <span>{project.styleLocked ? 'Active' : 'Unlocked'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Workflow Reference */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          The ANIMORA Movie Directing Workflow
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-mono">
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">IDEA</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">STORY</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">CHARACTERS</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">WORLD</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">STORYBOARD</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">SHOTS</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">ANIMATION</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">AUDIO</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">EDIT</span>
          <span>→</span>
          <span className="bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-purple-300">RENDER</span>
          <span>→</span>
          <span className="bg-purple-950 border border-purple-800 text-purple-200 font-bold px-2 py-1 rounded">CAPCUT</span>
        </div>
      </div>

      {/* Cinematic Movie Templates */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
          Curated Movie Templates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 space-y-3 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                    {tmpl.genre}
                  </span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono">
                    {tmpl.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100">{tmpl.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{tmpl.desc}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-500">
                <div className="flex items-center gap-3">
                  <span>{tmpl.shots} structured shots</span>
                  <span>·</span>
                  <span>{tmpl.duration}</span>
                </div>
                <button
                  onClick={() => setActiveView('scene_builder')}
                  className="text-purple-400 hover:text-purple-300 font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Scene</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
