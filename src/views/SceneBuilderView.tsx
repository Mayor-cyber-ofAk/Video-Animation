import React, { useState } from 'react';
import {
  Clapperboard,
  Sparkles,
  Wand2,
  Plus,
  Play,
  Camera,
  Layers,
  Clock,
  ArrowRight,
  Eye,
  Sliders,
  History,
  Check,
  Shield,
  Zap,
  Flame,
  Sun,
  Palette,
  Film,
} from 'lucide-react';
import { Project, Shot, Scene, VisualStyle, SceneVersion } from '../types/studio';
import { GeminiTextGenerator } from '../services/aiProviders';

interface SceneBuilderViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onSelectShot: (shotId: string) => void;
  setActiveView: (view: string) => void;
}

export const SceneBuilderView: React.FC<SceneBuilderViewProps> = ({
  project,
  onUpdateProject,
  onSelectShot,
  setActiveView,
}) => {
  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const [scenePrompt, setScenePrompt] = useState(
    activeScene.summary ||
      'Jay walks through an abandoned city at night while heavy rain falls. He hears footsteps behind him, stops, slowly turns around, and sees a masked figure standing beneath a flickering streetlight.'
  );
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Versions state
  const sceneVersions: SceneVersion[] = activeScene.versions || [
    {
      id: 'v1',
      sceneId: activeScene.id,
      versionNumber: 1,
      label: 'Initial Master Edit',
      createdAt: Date.now() - 3600000,
      shotCount: activeScene.shots.length,
      summary: activeScene.summary,
      shotsSnapshot: activeScene.shots,
    },
  ];

  // Save new version snapshot
  const handleSnapshotVersion = () => {
    const nextVerNum = sceneVersions.length + 1;
    const newVersion: SceneVersion = {
      id: `ver_${Date.now()}`,
      sceneId: activeScene.id,
      versionNumber: nextVerNum,
      label: `Take ${nextVerNum} (${project.visualStyle})`,
      createdAt: Date.now(),
      shotCount: activeScene.shots.length,
      summary: activeScene.summary,
      shotsSnapshot: [...activeScene.shots],
    };

    const updatedVersions = [...sceneVersions, newVersion];
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id ? { ...s, versions: updatedVersions, version: nextVerNum } : s
      ),
    }));
    setStatusMessage(`Saved Scene Snapshot as Version ${nextVerNum}!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Revert to snapshot version
  const handleRevertVersion = (ver: SceneVersion) => {
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === activeScene.id
          ? {
              ...s,
              shots: [...ver.shotsSnapshot],
              version: ver.versionNumber,
              summary: ver.summary,
            }
          : s
      ),
    }));
    setStatusMessage(`Reverted to Version ${ver.versionNumber}: ${ver.label}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Quick Directing Prompt Modifiers
  const handleApplyDirectorModifier = (instruction: string) => {
    setScenePrompt((prev) => `${prev} [DIRECTOR NOTE: ${instruction}]`);
    setStatusMessage(`Added director direction: "${instruction}"`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Calls real AI to break down prose script into structured cinema shots
  const handleBreakdownScript = async () => {
    if (!scenePrompt.trim()) return;
    setIsDecomposing(true);
    setStatusMessage('Decomposing screenplay prose into structured cinematic shots...');
    try {
      const textGen = new GeminiTextGenerator();
      const res = await textGen.generateShots({
        sceneDescription: scenePrompt,
        characters: project.characters.map((c) => c.name),
        location: project.locations[0]?.name || 'Urban setting',
        visualStyle: project.visualStyle,
        targetShotCount: 6,
      });

      if (res.shots && Array.isArray(res.shots)) {
        const mappedShots: Shot[] = res.shots.map((s: any, idx: number) => ({
          id: `shot_${Date.now()}_${idx}`,
          shotNumber: idx + 1,
          name: s.name || `Shot ${(idx + 1).toString().padStart(2, '0')}`,
          duration: s.duration || 5,
          action: s.action || '',
          charactersPresent: project.characters
            .filter((c) => s.charactersPresent?.includes(c.name))
            .map((c) => c.id),
          locationId: project.locations[0]?.id || '',
          camera: {
            angle: s.camera?.angle || 'Medium',
            movement: s.camera?.movement || 'Static',
            lens: s.camera?.lens || '35mm',
            depthOfField: s.camera?.depthOfField || 'Medium',
          },
          lighting: s.lighting || 'Cinematic natural key',
          weather: s.weather || 'Clear',
          mood: s.mood || 'Moody',
          visualStyle: project.visualStyle,
          dialogue: s.dialogue || '',
          soundEffects: s.soundEffects || '',
          musicCue: s.musicCue || '',
          negativePrompt: s.negativePrompt || 'blurry, deformed, cartoon lines',
          vfx: {
            rain: s.weather?.toLowerCase().includes('rain') || false,
            snow: s.weather?.toLowerCase().includes('snow') || false,
            fog: true,
            sparks: false,
            smoke: false,
            lightning: s.weather?.toLowerCase().includes('storm') || false,
            filmGrain: 0.15,
            vignette: 0.35,
            cameraShake: 0.1,
            letterbox: true,
          },
        }));

        onUpdateProject((prev) => ({
          ...prev,
          scenes: prev.scenes.map((sc) =>
            sc.id === activeScene.id
              ? {
                  ...sc,
                  title: res.sceneTitle?.toUpperCase() || sc.title,
                  summary: scenePrompt,
                  shots: mappedShots,
                }
              : sc
          ),
          activeShotId: mappedShots[0]?.id || null,
        }));

        setStatusMessage(`Generated ${mappedShots.length} structured cinematic shots`);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err: any) {
      setStatusMessage(`Shot generator error: ${err.message}`);
    } finally {
      setIsDecomposing(false);
    }
  };

  const totalDuration = activeScene.shots.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Clapperboard className="w-4 h-4" />
            <span>AI Scene Breakdown & Director Console</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            {activeScene.title} · SCENE DIRECTOR
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Turn screenplay prose into structured camera coverage with optics, lighting, and pacing.
          </p>
        </div>

        {/* Scene Versioning Bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs">
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-zinc-500 font-semibold">Versions:</span>
            {sceneVersions.map((v) => (
              <button
                key={v.id}
                onClick={() => handleRevertVersion(v)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                  activeScene.version === v.versionNumber
                    ? 'bg-purple-950 text-purple-200 font-bold border border-purple-800'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title={`Revert to ${v.label}`}
              >
                v{v.versionNumber}
              </button>
            ))}
            <button
              onClick={handleSnapshotVersion}
              className="text-purple-400 hover:text-purple-300 font-bold px-1 ml-1"
              title="Snapshot new version"
            >
              + Snapshot
            </button>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">Scene Duration</div>
            <div className="text-sm font-bold text-purple-400 font-mono">{totalDuration}s</div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-purple-950/80 border border-purple-700/60 text-purple-200 rounded-lg text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Production Aesthetics Quick Switch */}
      <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between gap-3 text-xs">
        <span className="font-bold uppercase text-[10px] text-zinc-400">Production Mode:</span>
        <div className="flex items-center gap-2">
          {[
            { id: 'Photorealistic', label: 'Realism Mode', icon: Camera },
            { id: 'Anime', label: 'Anime Production Mode', icon: Zap },
            { id: '3D Animation', label: 'Cartoon / 3D Mode', icon: Film },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => onUpdateProject((prev) => ({ ...prev, visualStyle: m.id as VisualStyle }))}
              className={`px-3 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                project.visualStyle === m.id
                  ? 'bg-purple-950 border-purple-600 text-purple-200 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <m.icon className="w-3.5 h-3.5" />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Screenplay Prose Workspace */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Scene Narrative Action Prompt</span>
          </label>
          <span className="text-[11px] text-zinc-500">
            Write actions, sounds, and character movements
          </span>
        </div>

        <textarea
          rows={4}
          value={scenePrompt}
          onChange={(e) => setScenePrompt(e.target.value)}
          placeholder="e.g. Jay walks through an abandoned city at night while heavy rain falls. He hears footsteps behind him, stops, slowly turns around, and sees a masked figure standing beneath a streetlight..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-100 outline-none focus:border-purple-600 leading-relaxed font-sans"
        />

        {/* AI Creative Director Quick Modifiers */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase text-purple-400 block">
            AI Creative Director Quick Directives:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              'Make this scene feel more cinematic',
              'Make the combat choreography more intense',
              'Dramatic low angle with volumetric rim lighting',
              'Character expression looks terrified and breathless',
              'Moody golden hour twilight reflections',
            ].map((instruction) => (
              <button
                key={instruction}
                onClick={() => handleApplyDirectorModifier(instruction)}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-purple-950 border border-zinc-800 hover:border-purple-700 text-zinc-400 hover:text-purple-300 text-[11px] transition-colors"
              >
                + "{instruction}"
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <div className="text-[11px] text-zinc-500">
            Engine: <span className="text-zinc-300 font-mono">Gemini 3.8 Flash Cinematography Agent</span>
          </div>

          <button
            onClick={handleBreakdownScript}
            disabled={isDecomposing || !scenePrompt.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-lg text-xs shadow-md shadow-purple-950/60 transition-all cursor-pointer disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            <span>{isDecomposing ? 'Decomposing Scene...' : 'Convert to Structured Shots'}</span>
          </button>
        </div>
      </div>

      {/* Shot List Coverage Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Camera Coverage & Shot List ({activeScene.shots.length})
          </h3>
          <button
            onClick={() => setActiveView('storyboard')}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Open Storyboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {activeScene.shots.map((shot) => (
            <div
              key={shot.id}
              onClick={() => onSelectShot(shot.id)}
              className="p-4 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-purple-600/60 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left Details */}
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-purple-300 flex-shrink-0">
                  {shot.shotNumber.toString().padStart(2, '0')}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-100 group-hover:text-purple-300 transition-colors">
                      {shot.name}
                    </span>
                    <span className="text-[10px] bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-mono">
                      {shot.camera.lens} · {shot.camera.angle}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {shot.duration}s
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 line-clamp-2 max-w-2xl">
                    {shot.action}
                  </p>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectShot(shot.id);
                    setActiveView('timeline');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-purple-950 text-zinc-200 hover:text-purple-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  <span>Direct Shot</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
