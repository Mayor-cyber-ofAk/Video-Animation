import React from 'react';
import {
  Sparkles,
  CloudRain,
  Flame,
  Zap,
  Wind,
  Layers,
  CheckCircle2,
  Sliders,
  Copy,
} from 'lucide-react';
import { Project, VFXSettings } from '../types/studio';

interface VFXStudioViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const VFXStudioView: React.FC<VFXStudioViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const activeShot = activeScene.shots.find((s) => s.id === project.activeShotId) || activeScene.shots[0];

  const updateActiveShotVFX = (updates: Partial<VFXSettings>) => {
    if (!activeShot) return;
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? {
              ...s,
              shots: s.shots.map((sh) =>
                sh.id === activeShot.id ? { ...sh, vfx: { ...sh.vfx, ...updates } } : sh
              ),
            }
          : s
      ),
    }));
  };

  const handleApplyVFXToAllShots = () => {
    if (!activeShot) return;
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? {
              ...s,
              shots: s.shots.map((sh) => ({ ...sh, vfx: { ...activeShot.vfx } })),
            }
          : s
      ),
    }));
  };

  if (!activeShot) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Sparkles className="w-4 h-4" />
            <span>Visual Effects, Particle Engines & Shaders</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            CINEMATIC VFX & ATMOSPHERE
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time particle systems, atmospheric weather, anamorphic letterbox, and analog film grain.
          </p>
        </div>

        <button
          onClick={handleApplyVFXToAllShots}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 font-medium px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Apply Preset to All Shots in Scene</span>
        </button>
      </div>

      {/* VFX Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environmental Particles */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Weather & Atmospheric Particles
          </h3>

          <div className="space-y-2.5">
            {[
              { key: 'rain', label: 'Diagonal Monsoon Rain', desc: 'Real-time velocity-based rain streaks with puddle splash calculation' },
              { key: 'snow', label: 'Drifting Snowflakes', desc: 'Floating organic snowflake particles' },
              { key: 'fog', label: 'Volumetric Ground Fog', desc: 'Atmospheric depth mist layered over background' },
              { key: 'sparks', label: 'Electrical Sparks & Embers', desc: 'High-temperature orange particles' },
              { key: 'lightning', label: 'Photometric Lightning Flash', desc: 'Randomized high-key exposure spikes' },
              { key: 'letterbox', label: '2.39:1 Cinema Anamorphic Bars', desc: 'Hollywood widescreen framing' },
            ].map((fx) => (
              <label
                key={fx.key}
                className="flex items-start justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200">{fx.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{fx.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean((activeShot.vfx as any)[fx.key])}
                  onChange={(e) => updateActiveShotVFX({ [fx.key]: e.target.checked })}
                  className="accent-purple-600 rounded mt-1 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Optical Lens & Analog Film Characteristics */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Optics, Exposure & Analog Film Look
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200">Film Grain Intensity</span>
                <span className="font-mono text-purple-400 font-bold">
                  {(activeShot.vfx.filmGrain * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-2">Simulates 35mm photochemical film noise</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeShot.vfx.filmGrain}
                onChange={(e) => updateActiveShotVFX({ filmGrain: parseFloat(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200">Vignette Falloff</span>
                <span className="font-mono text-purple-400 font-bold">
                  {(activeShot.vfx.vignette * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-2">Radial corner shadow from vintage anamorphic lenses</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeShot.vfx.vignette}
                onChange={(e) => updateActiveShotVFX({ vignette: parseFloat(e.target.value) })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-zinc-200">Camera Handheld Shake</span>
                <span className="font-mono text-purple-400 font-bold">
                  {((activeShot.camera.shakeIntensity || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mb-2">Organic cinematographer micro-movements</p>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={activeShot.camera.shakeIntensity || 0}
                onChange={(e) =>
                  onUpdateProject((prev) => ({
                    ...prev,
                    scenes: prev.scenes.map((s) =>
                      s.id === activeScene.id
                        ? {
                            ...s,
                            shots: s.shots.map((sh) =>
                              sh.id === activeShot.id
                                ? { ...sh, camera: { ...sh.camera, shakeIntensity: parseFloat(e.target.value) } }
                                : sh
                            ),
                          }
                        : s
                    ),
                  }))
                }
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
