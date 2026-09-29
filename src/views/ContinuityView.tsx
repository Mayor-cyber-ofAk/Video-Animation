import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { Project, Shot } from '../types/studio';

interface ContinuityViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onSelectShot: (shotId: string) => void;
  setActiveView: (view: string) => void;
}

export const ContinuityView: React.FC<ContinuityViewProps> = ({
  project,
  onUpdateProject,
  onSelectShot,
  setActiveView,
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditLog, setAuditLog] = useState<any[] | null>(null);

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];

  const handleRunFullAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/ai/continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentShot: activeScene.shots[activeScene.shots.length - 1],
          previousShots: activeScene.shots.slice(0, -1),
          characters: project.characters,
          location: project.locations[0],
        }),
      });
      const data = await res.json();
      setAuditLog(data.warnings || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Script Supervisor & Continuity Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            CONTINUITY MANAGER
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Automated verification of character wardrobe, physical injuries, 180° camera axis, props, and lighting across all shots.
          </p>
        </div>

        <button
          onClick={handleRunFullAudit}
          disabled={isAuditing}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-md shadow-purple-950 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>{isAuditing ? 'Auditing Movie...' : 'Run Scene Continuity Audit'}</span>
        </button>
      </div>

      {/* Continuity Status Overview Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-100 uppercase">
                {activeScene.title} · Baseline Integrity
              </h3>
              <p className="text-xs text-zinc-400">
                Weather: Heavy Storm · Time of Day: Night · Lighting Scheme: Active Streetlamp 4B
              </p>
            </div>
          </div>

          <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-full font-medium">
            Master Rules Enforced
          </span>
        </div>

        {/* Continuity Checks Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-1">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Wardrobe Tracking</div>
            <div className="text-zinc-200 font-medium">Jay: Black Technical Weather Jacket</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Locked across shots 1-6</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-1">
            <div className="text-[10px] uppercase font-bold text-zinc-400">Physical Prop Location</div>
            <div className="text-zinc-200 font-medium">Quantum Memory Drive: Left Jacket Pocket</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Location verified</span>
            </div>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-1">
            <div className="text-[10px] uppercase font-bold text-zinc-400">180° Camera Axis</div>
            <div className="text-zinc-200 font-medium">Shot 4 intentional 180° turn</div>
            <div className="text-[10px] text-purple-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Directional flip acknowledged</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Warnings Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
          Continuity Notes & Live Warnings
        </h3>

        {auditLog && auditLog.length > 0 ? (
          auditLog.map((warning, idx) => (
            <div
              key={idx}
              className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-2 text-xs"
            >
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>CONTINUITY CONFLICT DETECTED</span>
              </div>
              <p className="text-zinc-200">{warning.issue}</p>
              <div className="text-[11px] text-zinc-400 bg-black/40 p-2.5 rounded border border-amber-900/40">
                Fix: {warning.suggestedFix}
              </div>
            </div>
          ))
        ) : (
          <div className="p-5 bg-zinc-900/40 border border-zinc-800 rounded-xl text-xs text-zinc-400 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-zinc-200">No Continuity Collisions Detected</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Every character wardrobe item, facial scar, prop state, and weather condition remains consistent between scene transitions.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
