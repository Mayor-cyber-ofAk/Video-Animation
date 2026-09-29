import React from 'react';
import {
  LayoutGrid,
  Plus,
  Play,
  Camera,
  Volume2,
  Trash2,
  Copy,
  ArrowRight,
  MoveLeft,
  MoveRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Project, Shot } from '../types/studio';

interface StoryboardViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onSelectShot: (shotId: string) => void;
  setActiveView: (view: string) => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  project,
  onUpdateProject,
  onSelectShot,
  setActiveView,
}) => {
  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];

  const handleAddShot = () => {
    const newShotNumber = activeScene.shots.length + 1;
    const newShot: Shot = {
      id: `shot_${Date.now()}`,
      shotNumber: newShotNumber,
      name: `Shot ${newShotNumber.toString().padStart(2, '0')}`,
      duration: 5,
      action: 'Character action description...',
      charactersPresent: project.characters[0] ? [project.characters[0].id] : [],
      locationId: project.locations[0]?.id || '',
      camera: {
        angle: 'Medium',
        movement: 'Static',
        lens: '35mm',
        depthOfField: 'Medium',
      },
      lighting: 'Cinematic key light',
      weather: 'Clear',
      mood: 'Suspenseful',
      visualStyle: project.visualStyle,
      vfx: {
        rain: false,
        snow: false,
        fog: false,
        sparks: false,
        smoke: false,
        lightning: false,
        filmGrain: 0.1,
        vignette: 0.2,
        cameraShake: 0,
        letterbox: true,
      },
    };

    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id ? { ...s, shots: [...s.shots, newShot] } : s
      ),
      activeShotId: newShot.id,
    }));
  };

  const handleMoveShot = (index: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= activeScene.shots.length) return;

    const reordered = [...activeScene.shots];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);

    // Renumber shots
    const updated = reordered.map((s, idx) => ({ ...s, shotNumber: idx + 1 }));

    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === activeScene.id ? { ...s, shots: updated } : s)),
    }));
  };

  const handleDeleteShot = (shotId: string) => {
    const filtered = activeScene.shots
      .filter((s) => s.id !== shotId)
      .map((s, idx) => ({ ...s, shotNumber: idx + 1 }));

    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) => (s.id === activeScene.id ? { ...s, shots: filtered } : s)),
      activeShotId: filtered[0]?.id || null,
    }));
  };

  const handleDuplicateShot = (shot: Shot) => {
    const copy: Shot = {
      ...shot,
      id: `shot_${Date.now()}`,
      name: `${shot.name} Copy`,
      shotNumber: activeScene.shots.length + 1,
    };
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id ? { ...s, shots: [...s.shots, copy] } : s
      ),
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <LayoutGrid className="w-4 h-4" />
            <span>Visual Storyboard & Shot Continuity</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            {activeScene.title} · STORYBOARD
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Plan, order, and preview shot composition, lens specifications, and dialogue beats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddShot}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-md shadow-purple-950/60 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Storyboard Shot</span>
          </button>
        </div>
      </div>

      {/* Storyboard Grid of Shot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {activeScene.shots.map((shot, idx) => (
          <div
            key={shot.id}
            onClick={() => {
              onSelectShot(shot.id);
              setActiveView('scene_builder');
            }}
            className="group bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-600/70 rounded-xl overflow-hidden transition-all shadow-md hover:shadow-xl hover:shadow-purple-950/20 cursor-pointer flex flex-col justify-between"
          >
            {/* Thumbnail Canvas / Image */}
            <div className="aspect-video bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800/80">
              {shot.generatedImageUrl ? (
                <img
                  src={shot.generatedImageUrl}
                  alt={shot.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-center p-4 text-zinc-600">
                  <Camera className="w-8 h-8 mx-auto mb-1 text-zinc-700" />
                  <span className="text-[10px] text-zinc-500">Unrendered Frame</span>
                </div>
              )}

              {/* Shot Pill Badges */}
              <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-purple-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                SHOT {shot.shotNumber.toString().padStart(2, '0')}
              </div>

              <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-xs text-zinc-300 font-mono text-[10px] px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-zinc-400" />
                <span>{shot.duration}s</span>
              </div>

              <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-zinc-300 text-[9px] font-mono px-2 py-0.5 rounded border border-white/10">
                {shot.camera.lens} · {shot.camera.angle}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between text-xs">
              <div className="space-y-1">
                <h4 className="font-semibold text-zinc-100 text-xs truncate group-hover:text-purple-300 transition-colors">
                  {shot.name}
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                  {shot.action}
                </p>
              </div>

              {/* Dialogue snippet if exists */}
              {shot.dialogue && (
                <div className="text-[10px] bg-zinc-950/80 p-2 rounded border border-zinc-800 text-purple-200/90 italic line-clamp-1">
                  "{shot.dialogue}"
                </div>
              )}

              {/* Card Footer Actions */}
              <div
                className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-zinc-500 text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Reorder arrows */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveShot(idx, 'left')}
                    disabled={idx === 0}
                    className="p-1 hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                    title="Move Left"
                  >
                    <MoveLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveShot(idx, 'right')}
                    disabled={idx === activeScene.shots.length - 1}
                    className="p-1 hover:text-zinc-200 disabled:opacity-20 cursor-pointer"
                    title="Move Right"
                  >
                    <MoveRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleDuplicateShot(shot)}
                    className="p-1 hover:text-purple-300 cursor-pointer"
                    title="Duplicate Shot"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteShot(shot.id)}
                    className="p-1 hover:text-rose-400 cursor-pointer"
                    title="Delete Shot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
