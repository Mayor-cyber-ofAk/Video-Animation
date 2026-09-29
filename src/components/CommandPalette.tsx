import React, { useState, useEffect } from 'react';
import {
  Search,
  Clapperboard,
  Users,
  LayoutGrid,
  Download,
  BookOpen,
  PenTool,
  Film,
  Music,
  Globe2,
  FolderOpen,
  Sparkles,
  Lock,
  X,
} from 'lucide-react';
import { Project } from '../types/studio';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveView: (view: string) => void;
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onQuickSave: () => void;
}

interface Action {
  id: string;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  perform: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setActiveView,
  project,
  onUpdateProject,
  onQuickSave,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions: Action[] = [
    {
      id: 'create_character',
      label: 'Create Character',
      category: 'Production',
      icon: Users,
      perform: () => {
        setActiveView('characters');
        onClose();
      },
    },
    {
      id: 'create_scene',
      label: 'Create New Scene',
      category: 'Production',
      icon: Clapperboard,
      perform: () => {
        const newSceneId = `scene_${Date.now()}`;
        const newScene = {
          id: newSceneId,
          sceneNumber: project.scenes.length + 1,
          title: `SCENE ${(project.scenes.length + 1).toString().padStart(2, '0')}`,
          summary: '',
          durationSeconds: 30,
          shots: [],
          continuityWarnings: [],
          version: 1,
        };
        onUpdateProject((prev) => ({
          ...prev,
          scenes: [...prev.scenes, newScene],
          activeSceneId: newSceneId,
        }));
        setActiveView('scene_builder');
        onClose();
      },
    },
    {
      id: 'open_storyboard',
      label: 'Open Storyboard',
      category: 'Navigation',
      icon: LayoutGrid,
      perform: () => {
        setActiveView('storyboard');
        onClose();
      },
    },
    {
      id: 'open_timeline',
      label: 'Open Multi-Track Timeline',
      category: 'Navigation',
      icon: Film,
      perform: () => {
        setActiveView('timeline');
        onClose();
      },
    },
    {
      id: 'export_capcut',
      label: 'Export Scene for CapCut',
      category: 'Export',
      icon: Download,
      perform: () => {
        setActiveView('export');
        onClose();
      },
    },
    {
      id: 'drawing_studio',
      label: 'Open Drawing Studio',
      category: 'Creative',
      icon: PenTool,
      perform: () => {
        setActiveView('drawing');
        onClose();
      },
    },
    {
      id: 'animation_studio',
      label: 'Open 2D Frame Animation & X-Sheet Suite',
      category: 'Animation',
      icon: Film,
      perform: () => {
        setActiveView('animation');
        onClose();
      },
    },
    {
      id: 'character_rig',
      label: 'Open Character Rig & Pose Animator',
      category: 'Animation',
      icon: Users,
      perform: () => {
        setActiveView('characters');
        onClose();
      },
    },
    {
      id: 'open_timeline_keyframes',
      label: 'Open Timeline Keyframe Tracks & Graph Editor',
      category: 'Animation',
      icon: LayoutGrid,
      perform: () => {
        setActiveView('timeline');
        onClose();
      },
    },
    {
      id: 'audio_studio',
      label: 'Open Audio & Voices',
      category: 'Creative',
      icon: Music,
      perform: () => {
        setActiveView('audio');
        onClose();
      },
    },
    {
      id: 'toggle_lock_style',
      label: project.styleLocked ? 'Unlock Visual Style' : 'Lock Visual Style Consistency',
      category: 'Directing',
      icon: Lock,
      perform: () => {
        onUpdateProject((prev) => ({ ...prev, styleLocked: !prev.styleLocked }));
        onClose();
      },
    },
    {
      id: 'save_project',
      label: 'Save Project to Local Storage',
      category: 'Project',
      icon: Sparkles,
      perform: () => {
        onQuickSave();
        onClose();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.label.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-24 z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-zinc-500" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action (e.g. Character, Scene, Storyboard, Export)..."
            className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500">No actions found</div>
          ) : (
            filtered.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={action.perform}
                  className="w-full p-2.5 rounded-lg flex items-center justify-between text-xs hover:bg-zinc-900 transition-colors text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-purple-400 group-hover:scale-105 transition-transform">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-zinc-200 font-medium group-hover:text-purple-300">
                      {action.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded font-mono">
                    {action.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
