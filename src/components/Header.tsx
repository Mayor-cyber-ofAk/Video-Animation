import React, { useState } from 'react';
import {
  Film,
  Play,
  Square,
  Sparkles,
  Download,
  Save,
  RotateCcw,
  RotateCw,
  Lock,
  Unlock,
  Search,
  Settings,
  Layers,
  Video,
  CheckCircle2,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Project, VisualStyle } from '../types/studio';

interface HeaderProps {
  project: Project;
  activeView: string;
  setActiveView: (view: string) => void;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onOpenCommandPalette: () => void;
  onOpenAssistant: () => void;
  isAssistantOpen: boolean;
  onQuickSave: () => void;
  onExportCapCut: () => void;
}

const VISUAL_STYLES: VisualStyle[] = [
  'Photorealistic',
  'Cinematic Live Action',
  'Hyperrealistic',
  'Anime',
  'Manga',
  '2D Cartoon',
  '3D Animation',
  'Stylized 3D',
  'Pixar-like 3D',
  'Disney-like Fantasy',
  'Stop-Motion',
  'Comic Book',
  'Graphic Novel',
  'Dark Fantasy',
  'Sci-Fi Cyberpunk',
  'Horror Animation',
  'High-Octane Action',
  'Hybrid 2D/3D',
  'Retro',
  'Custom',
];

export const Header: React.FC<HeaderProps> = ({
  project,
  activeView,
  setActiveView,
  onUpdateProject,
  onOpenCommandPalette,
  onOpenAssistant,
  isAssistantOpen,
  onQuickSave,
  onExportCapCut,
}) => {
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const [showSceneMenu, setShowSceneMenu] = useState(false);

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];

  const handleAddNewScene = () => {
    const newSceneNumber = project.scenes.length + 1;
    const newSceneId = `scene_${Date.now()}`;
    const newScene = {
      id: newSceneId,
      sceneNumber: newSceneNumber,
      title: `SCENE ${newSceneNumber.toString().padStart(2, '0')}`,
      summary: 'New scene breakdown',
      durationSeconds: 30,
      shots: [],
      continuityWarnings: [],
      version: 1,
    };
    onUpdateProject((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      activeSceneId: newSceneId,
      activeShotId: null,
    }));
    setShowSceneMenu(false);
    setActiveView('scene_builder');
  };

  return (
    <header className="h-14 bg-zinc-950 border-b border-zinc-800/80 px-4 flex items-center justify-between select-none z-30 flex-shrink-0">
      {/* Left: Branding & Project Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveView('home')}
          className="flex items-center gap-2 group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-950/40 group-hover:scale-105 transition-transform">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-wider text-zinc-100 uppercase font-['Cinzel'] flex items-center gap-1.5">
              ANIMORA
              <span className="text-[10px] text-purple-400 font-sans px-1.5 py-0.2 bg-purple-950/60 border border-purple-800/40 rounded">
                STUDIO
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 tracking-tight">Cinematic Animation Suite</div>
          </div>
        </button>

        <div className="h-5 w-px bg-zinc-800" />

        {/* Project Title Input & Format */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={project.title}
            onChange={(e) =>
              onUpdateProject((prev) => ({ ...prev, title: e.target.value.toUpperCase() }))
            }
            className="text-xs font-semibold text-zinc-200 tracking-wide bg-transparent hover:bg-zinc-900/60 focus:bg-zinc-900 border border-transparent hover:border-zinc-800 focus:border-purple-600/50 rounded px-2 py-1 outline-none transition-all w-36 uppercase"
            title="Click to rename project"
          />

          <span className="hidden lg:inline-block text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            {project.format || 'Feature Film'} · {project.resolution || '1080p'}
          </span>

          {/* Active Scene Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSceneMenu(!showSceneMenu)}
              className="flex items-center gap-1.5 text-xs text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 px-2.5 py-1 rounded transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-medium truncate max-w-32">{activeScene ? activeScene.title : 'Scene 01'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showSceneMenu && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Movie Scenes
                </div>
                {project.scenes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onUpdateProject((prev) => ({
                        ...prev,
                        activeSceneId: s.id,
                        activeShotId: s.shots[0]?.id || null,
                      }));
                      setShowSceneMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-zinc-800 transition-colors ${
                      s.id === project.activeSceneId ? 'text-purple-400 bg-zinc-800/60 font-medium' : 'text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="text-[10px] text-zinc-400">{s.shots.length} shots</span>
                  </button>
                ))}
                <div className="border-t border-zinc-800 mt-1 pt-1">
                  <button
                    onClick={handleAddNewScene}
                    className="w-full text-left px-3 py-1.5 text-xs text-purple-400 hover:bg-zinc-800 flex items-center gap-1.5 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Scene
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center: Visual Style Consistency Selector */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowStyleMenu(!showStyleMenu)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-1 rounded-md text-xs transition-colors"
          >
            <span className="text-zinc-400">Style:</span>
            <span className="font-medium text-zinc-100">{project.visualStyle}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showStyleMenu && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50">
              <div className="px-3 py-1 text-[10px] uppercase font-semibold text-zinc-400">
                Visual Aesthetic
              </div>
              {VISUAL_STYLES.map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    onUpdateProject((prev) => ({ ...prev, visualStyle: style }));
                    setShowStyleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-800 transition-colors flex items-center justify-between ${
                    project.visualStyle === style ? 'text-purple-400 font-medium bg-zinc-800/40' : 'text-zinc-300'
                  }`}
                >
                  {style}
                  {style === 'Photorealistic' && (
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1 rounded">Live Action</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lock Visual Style Toggle */}
        <button
          onClick={() =>
            onUpdateProject((prev) => ({ ...prev, styleLocked: !prev.styleLocked }))
          }
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border transition-all ${
            project.styleLocked
              ? 'bg-purple-950/40 border-purple-700/60 text-purple-300 shadow-sm'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="When locked, all shots enforce this exact visual aesthetic and cinematography palette."
        >
          {project.styleLocked ? <Lock className="w-3.5 h-3.5 text-purple-400" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{project.styleLocked ? 'Style Locked' : 'Lock Style'}</span>
        </button>

        <div className="hidden md:flex items-center gap-1 text-[11px] text-zinc-400 ml-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Autosaved</span>
        </div>
      </div>

      {/* Right: Quick Actions & Assistant */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded text-xs transition-colors"
          title="Command Palette (Ctrl/Cmd + K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Commands</span>
          <kbd className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded font-mono">⌘K</kbd>
        </button>

        {/* AI Creative Assistant */}
        <button
          onClick={onOpenAssistant}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs border transition-all ${
            isAssistantOpen
              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-900/40'
              : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white'
          }`}
          title="Open AI Filmmaking Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="font-medium">Director AI</span>
        </button>

        {/* Export for CapCut button */}
        <button
          onClick={onExportCapCut}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-medium px-3.5 py-1 rounded-md text-xs shadow-md shadow-purple-950/60 transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export for CapCut</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setActiveView('settings')}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded transition-colors"
          title="AI Providers & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
