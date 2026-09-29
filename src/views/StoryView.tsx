import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Layers,
  CheckCircle2,
  Plus,
  ArrowRight,
  Wand2,
  Film,
  Users,
  Globe2,
  Shield,
  Palette,
  Swords,
  Sliders,
  Flame,
  Zap,
  Camera,
  Compass,
  FileText,
  Save,
} from 'lucide-react';
import {
  Project,
  Scene,
  ProjectFormat,
  StyleBible,
  ActionBeat,
  StructuredPrompt,
} from '../types/studio';
import { GeminiTextGenerator } from '../services/aiProviders';

interface StoryViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  setActiveView: (view: string) => void;
}

const PROJECT_FORMATS: ProjectFormat[] = [
  'Feature Film',
  'Anime Episode',
  'Cartoon Episode',
  'Short Film',
  'Music Video',
  'Cinematic Sequence',
  'Game Cinematic',
  'Short Animation',
];

const DEFAULT_STYLE_BIBLE: StyleBible = {
  artStyle: 'High-contrast neo-noir anime with cinematic live-action lighting and rich hand-drawn textures',
  characterDesignRules: 'Distinctive sharp silhouettes, expressive ocular reflections, physically plausible cloth wrinkles, consistent facial scars and haircuts',
  colorPalette: ['#0A0B0E', '#161922', '#7C3AED', '#EC4899', '#38BDF8', '#F59E0B'],
  lightingStyle: 'Moody chiaroscuro, volumetric rain beams, harsh amber neon rim lights against deep cobalt shadows',
  cameraStyle: 'Anamorphic 35mm and 85mm prime lenses with shallow depth of field, dynamic handheld sway during action beats',
  environmentStyle: 'Flooded monolithic cyberpunk ruins, detailed wet asphalt reflections, steam vents, dripping neon signage',
  animationStyle: 'Animated on 2s for dialogue, accelerating to full 1s with impact frames and smear lines during dynamic combat',
  renderingStyle: 'Cel-shaded hybrid with realistic physical shaders and atmospheric particle occlusion',
  lineStyle: 'Variable-weight ink lines with subtle dry-brush friction on edges',
  facialStyle: 'Subtle micro-expressions, dilated pupils under stress, authentic lip phoneme syncing',
  negativeStyleRules: 'No generic flat 3D plastic faces, no rubbery limbs, no mismatched lighting, no distorted fingers',
};

const DEFAULT_ACTION_BEATS: ActionBeat[] = [
  {
    id: 'beat_1',
    beatNumber: 1,
    title: 'Detection & Standoff',
    type: 'notice',
    description: 'Jay halts abruptly in the pouring rain. A shadow detaches from the ruined neon pillar 30 yards ahead.',
    characterAttacking: 'char_masked_man',
    characterDefending: 'char_jay',
    cameraAngle: 'Medium',
    cameraMovement: 'Push in',
    vfx: ['Rain', 'Fog'],
    speedLines: false,
    impactFrame: false,
  },
  {
    id: 'beat_2',
    beatNumber: 2,
    title: 'Surprise Flash Attack',
    type: 'attack',
    description: 'The Masked Man explodes forward with supersonic speed, kicking up a rooster tail of neon water.',
    characterAttacking: 'char_masked_man',
    cameraAngle: 'Low angle',
    cameraMovement: 'Tracking',
    vfx: ['Sparks', 'Speed Lines'],
    speedLines: true,
    impactFrame: false,
  },
  {
    id: 'beat_3',
    beatNumber: 3,
    title: 'Evasive Slide & Counter',
    type: 'dodge',
    description: 'Jay drops into a wet slide beneath the incoming strike, drawing his stun blade in a defensive arc.',
    characterAttacking: 'char_jay',
    characterDefending: 'char_masked_man',
    cameraAngle: 'Dutch angle',
    cameraMovement: 'Orbit',
    vfx: ['Sparks', 'Lightning'],
    speedLines: true,
    impactFrame: true,
  },
  {
    id: 'beat_4',
    beatNumber: 4,
    title: 'Kinetic Shockwave Impact',
    type: 'impact',
    description: 'Blades collide with an electric shockwave that disperses the raindrops in a 5-meter halo.',
    characterAttacking: 'char_jay',
    characterDefending: 'char_masked_man',
    cameraAngle: 'Close-up',
    cameraMovement: 'Handheld',
    vfx: ['Sparks', 'Shockwave', 'Lightning'],
    speedLines: true,
    impactFrame: true,
  },
];

export const StoryView: React.FC<StoryViewProps> = ({
  project,
  onUpdateProject,
  setActiveView,
}) => {
  const [activeTab, setActiveTab] = useState<'script' | 'bible' | 'action' | 'prompts'>('script');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const styleBible: StyleBible = project.styleBible || DEFAULT_STYLE_BIBLE;
  const actionBeats: ActionBeat[] = project.scenes[0]?.actionBeats || DEFAULT_ACTION_BEATS;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleGenerateStoryBreakdown = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const textGen = new GeminiTextGenerator();
      const res = await textGen.generateStory({
        title: project.title,
        genre: project.genre,
        logline: project.logline,
        mood: project.mood,
        targetDuration: project.targetDuration,
        visualStyle: project.visualStyle,
      });

      setAiSuggestions(res);
      onUpdateProject((prev) => ({
        ...prev,
        beginning: prev.beginning || res.beginning,
        middle: prev.middle || res.middle,
        ending: prev.ending || res.ending,
        themes: prev.themes.length > 0 ? prev.themes : res.themes || [],
      }));
      showToast('AI Story Arc Generated Successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate story');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdoptScene = (suggested: any) => {
    const newSceneId = `scene_${Date.now()}`;
    const newScene: Scene = {
      id: newSceneId,
      sceneNumber: project.scenes.length + 1,
      actNumber: suggested.actNumber || 1,
      title: suggested.title.toUpperCase(),
      summary: suggested.summary,
      durationSeconds: suggested.durationSeconds || 45,
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
  };

  const handleUpdateBible = (updates: Partial<StyleBible>) => {
    const updated = { ...styleBible, ...updates };
    onUpdateProject((prev) => ({
      ...prev,
      styleBible: updated,
    }));
    showToast('Style Bible Updated!');
  };

  const handleAddActionBeat = () => {
    const newBeat: ActionBeat = {
      id: `beat_${Date.now()}`,
      beatNumber: actionBeats.length + 1,
      title: 'Action Sequence Beat',
      type: 'attack',
      description: 'Character launches an intense kinetic strike...',
      cameraAngle: 'Medium',
      cameraMovement: 'Handheld',
      vfx: ['Sparks', 'Speed Lines'],
      speedLines: true,
      impactFrame: false,
    };
    const updatedBeats = [...actionBeats, newBeat];
    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s, idx) => (idx === 0 ? { ...s, actionBeats: updatedBeats } : s)),
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 right-6 z-50 bg-purple-950 border border-purple-600 text-purple-200 px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-2xl animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <BookOpen className="w-4 h-4" />
            <span>Movie Production & Narrative Bible</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            STORY & SCRIPT ARCHITECTURE
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Architect the narrative arc, multi-act script, production style bible, and action choreography.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'script' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>3-Act Script</span>
          </button>
          <button
            onClick={() => setActiveTab('bible')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'bible' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Style Bible</span>
          </button>
          <button
            onClick={() => setActiveTab('action')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'action' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Action Choreo</span>
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'prompts' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Prompt Builder</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SCRIPT & 3-ACT STRUCTURE */}
      {activeTab === 'script' && (
        <div className="space-y-6">
          {/* Project Format, Title, Genre */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase font-bold text-zinc-400 block mb-1">
                Project Format
              </label>
              <select
                value={project.format || 'Feature Film'}
                onChange={(e) => onUpdateProject((prev) => ({ ...prev, format: e.target.value as any }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:border-purple-600 outline-none"
              >
                {PROJECT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-zinc-400 block mb-1">
                Production Title
              </label>
              <input
                type="text"
                value={project.title}
                onChange={(e) => onUpdateProject((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:border-purple-600 outline-none"
              />
            </div>

            <div>
              <label className="text-xs uppercase font-bold text-zinc-400 block mb-1">
                Genre
              </label>
              <input
                type="text"
                value={project.genre}
                onChange={(e) => onUpdateProject((prev) => ({ ...prev, genre: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 text-xs focus:border-purple-600 outline-none"
              />
            </div>
          </div>

          {/* Logline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase font-bold text-zinc-400">
                Story Logline / Core Premise
              </label>
              <button
                onClick={handleGenerateStoryBreakdown}
                disabled={isGenerating}
                className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isGenerating ? 'AI Generating...' : 'Auto-Generate Narrative Arc'}</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={project.logline}
              onChange={(e) => onUpdateProject((prev) => ({ ...prev, logline: e.target.value }))}
              placeholder="A one-sentence summary capturing protagonist, conflict, and stakes..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-3 text-xs text-zinc-200 focus:border-purple-600 outline-none leading-relaxed"
            />
          </div>

          {/* Three-Act Narrative Structure */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-700/60 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Act I: Setup & Inciting Incident</span>
              </div>
              <textarea
                rows={5}
                value={project.beginning || ''}
                onChange={(e) => onUpdateProject((prev) => ({ ...prev, beginning: e.target.value }))}
                placeholder="The ordinary world, inciting incident, protagonist goal..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 focus:border-purple-600 outline-none leading-relaxed"
              />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-sky-950 border border-sky-700/60 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Act II: Confrontation & Midpoint</span>
              </div>
              <textarea
                rows={5}
                value={project.middle || ''}
                onChange={(e) => onUpdateProject((prev) => ({ ...prev, middle: e.target.value }))}
                placeholder="Rising conflict, antagonist escalation, midpoint revelation..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 focus:border-purple-600 outline-none leading-relaxed"
              />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-pink-400 uppercase tracking-wide">
                <span className="w-5 h-5 rounded-full bg-pink-950 border border-pink-700/60 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Act III: Climax & Resolution</span>
              </div>
              <textarea
                rows={5}
                value={project.ending || ''}
                onChange={(e) => onUpdateProject((prev) => ({ ...prev, ending: e.target.value }))}
                placeholder="The final confrontation, realization, resolution..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-zinc-200 focus:border-purple-600 outline-none leading-relaxed"
              />
            </div>
          </div>

          {/* Production Scenes Hierarchy */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Scenes in Production ({project.scenes.length})
              </h3>
              <button
                onClick={() => {
                  const newId = `scene_${Date.now()}`;
                  const newScene: Scene = {
                    id: newId,
                    sceneNumber: project.scenes.length + 1,
                    actNumber: 1,
                    title: `SCENE ${project.scenes.length + 1}`,
                    summary: 'New scene outline...',
                    durationSeconds: 45,
                    shots: [],
                    continuityWarnings: [],
                    version: 1,
                  };
                  onUpdateProject((prev) => ({
                    ...prev,
                    scenes: [...prev.scenes, newScene],
                    activeSceneId: newId,
                  }));
                }}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scene</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {project.scenes.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => {
                    onUpdateProject((prev) => ({ ...prev, activeSceneId: scene.id }));
                    setActiveView('scene_builder');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    project.activeSceneId === scene.id
                      ? 'border-purple-600 bg-purple-950/40 shadow-md ring-1 ring-purple-500'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-purple-300 font-mono">
                      <span>ACT {scene.actNumber || 1} · SCENE {scene.sceneNumber}</span>
                      <span>{scene.durationSeconds}s · v{scene.version}</span>
                    </div>
                    <h4 className="text-sm font-bold text-zinc-100 font-['Cinzel'] mt-1 truncate">
                      {scene.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                      {scene.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 mt-2 text-[10px] text-zinc-500">
                    <span>{scene.shots.length} Shots Planned</span>
                    <span className="text-purple-400 font-medium">Direct Scene →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTION STYLE BIBLE */}
      {activeTab === 'bible' && (
        <div className="space-y-4">
          <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl text-xs text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>
                <strong>Project Style Bible:</strong> Enforces consistent art style, lighting rules, color palettes, and anatomy standards across all generated shots and characters.
              </span>
            </div>
            <button
              onClick={() => handleUpdateBible({})}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-medium flex items-center gap-1 shadow-sm"
            >
              <Save className="w-3 h-3" />
              <span>Save Bible</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
                  Primary Art & Visual Identity
                </label>
                <textarea
                  rows={2}
                  value={styleBible.artStyle}
                  onChange={(e) => handleUpdateBible({ artStyle: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
                  Character Design Rules
                </label>
                <textarea
                  rows={2}
                  value={styleBible.characterDesignRules}
                  onChange={(e) => handleUpdateBible({ characterDesignRules: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-purple-400 block mb-1">
                  Lighting & Volumetric Style
                </label>
                <textarea
                  rows={2}
                  value={styleBible.lightingStyle}
                  onChange={(e) => handleUpdateBible({ lightingStyle: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-sky-400 block mb-1">
                  Camera Lens & Cinematic Rules
                </label>
                <textarea
                  rows={2}
                  value={styleBible.cameraStyle}
                  onChange={(e) => handleUpdateBible({ cameraStyle: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-sky-400 block mb-1">
                  Animation & Timing Rules
                </label>
                <textarea
                  rows={2}
                  value={styleBible.animationStyle}
                  onChange={(e) => handleUpdateBible({ animationStyle: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-rose-400 block mb-1">
                  Negative Style Rules (Things to Prohibit)
                </label>
                <textarea
                  rows={2}
                  value={styleBible.negativeStyleRules}
                  onChange={(e) => handleUpdateBible({ negativeStyleRules: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACTION CHOREOGRAPHY */}
      {activeTab === 'action' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-pink-400">
                <Swords className="w-4 h-4" />
                <span>Action Choreography & Combat Timing</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Choreograph martial arts, sword fights, dynamic evasion, speed lines, and impact frames.
              </p>
            </div>

            <button
              onClick={handleAddActionBeat}
              className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-pink-950"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Action Beat</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {actionBeats.map((beat, idx) => (
              <div
                key={beat.id}
                className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-950 border border-pink-700/60 flex items-center justify-center font-bold text-pink-300 font-mono text-xs flex-shrink-0">
                    B{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-200 text-xs">{beat.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono bg-zinc-800 text-pink-300 border border-pink-900">
                        {beat.type}
                      </span>
                      {beat.speedLines && (
                        <span className="px-1 py-0.5 rounded text-[9px] uppercase font-mono bg-purple-950 text-purple-300">
                          Speed Lines
                        </span>
                      )}
                      {beat.impactFrame && (
                        <span className="px-1 py-0.5 rounded text-[9px] uppercase font-mono bg-rose-950 text-rose-300">
                          Impact Frame
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{beat.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono flex-shrink-0">
                  <span>{beat.cameraAngle} · {beat.cameraMovement}</span>
                  <div className="flex items-center gap-1">
                    {beat.vfx.map((v, i) => (
                      <span key={i} className="text-[10px] bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STRUCTURED PROMPT BUILDER */}
      {activeTab === 'prompts' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <FileText className="w-4 h-4" />
            <span>Structured Cinematic Prompt Builder</span>
          </div>

          <p className="text-xs text-zinc-400">
            Decompose shots into cinematic parameters instead of chaotic natural language:
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Subject</label>
              <input
                type="text"
                defaultValue="Jay, young cyber courier in wet high-collar trenchcoat"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Action</label>
              <input
                type="text"
                defaultValue="Sprints down flooded alley, turning head back in anticipation"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Environment</label>
              <input
                type="text"
                defaultValue="Flooded neon ruins of Sector 7, towering brutalist monoliths"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Camera & Lens</label>
              <input
                type="text"
                defaultValue="Low angle 35mm tracking dolly shot, shallow depth of field"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Lighting</label>
              <input
                type="text"
                defaultValue="Volumetric rain backlight, neon amber puddle reflections"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Negative Rules</label>
              <input
                type="text"
                defaultValue="no plastic skin, no distorted fingers, no blur, no low resolution"
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-zinc-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
