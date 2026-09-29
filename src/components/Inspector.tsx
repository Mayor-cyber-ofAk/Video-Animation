import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Sparkles,
  Volume2,
  Sliders,
  Lock,
  Unlock,
  ChevronRight,
  ChevronDown,
  Wand2,
  Play,
  Film,
  Image as ImageIcon,
  ShieldAlert,
  CheckCircle2,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  Shot,
  Project,
  Character,
  CameraAngle,
  CameraMovement,
  CameraLens,
  VisualStyle,
} from '../types/studio';
import {
  aiImageEngine,
  aiVideoEngine,
  aiVoiceEngine,
  GeminiTextGenerator,
} from '../services/aiProviders';

interface InspectorProps {
  project: Project;
  activeShot: Shot | null;
  onUpdateShot: (shotId: string, updates: Partial<Shot>) => void;
  activeCharacter: Character | null;
  onUpdateCharacter: (charId: string, updates: Partial<Character>) => void;
  onClose?: () => void;
}

const CAMERA_ANGLES: CameraAngle[] = [
  'Wide',
  'Medium',
  'Close-up',
  'Extreme close-up',
  'POV',
  'Over-the-shoulder',
  'Low angle',
  'High angle',
  'Dutch angle',
];

const CAMERA_MOVEMENTS: CameraMovement[] = [
  'Static',
  'Pan',
  'Tilt',
  'Dolly',
  'Push in',
  'Pull out',
  'Tracking',
  'Orbit',
  'Crane',
  'Handheld',
];

const CAMERA_LENSES: CameraLens[] = ['18mm', '24mm', '35mm', '50mm', '85mm', '135mm'];

export const Inspector: React.FC<InspectorProps> = ({
  project,
  activeShot,
  onUpdateShot,
  activeCharacter,
  onUpdateCharacter,
}) => {
  const [activeTab, setActiveTab] = useState<'shot' | 'camera' | 'vfx' | 'character' | 'audio'>('shot');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [continuityResult, setContinuityResult] = useState<any | null>(null);
  const [isCheckingContinuity, setIsCheckingContinuity] = useState(false);

  // Fallback to activeShot if present, else first shot of active scene
  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const shot = activeShot || activeScene?.shots[0] || null;

  // Realism Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (!shot) return;
    setIsEnhancingPrompt(true);
    setStatusMessage('Enhancing prompt with cinematic realism engine...');
    try {
      const textGen = new GeminiTextGenerator();
      const res = await textGen.enhancePrompt({
        userPrompt: shot.action,
        visualStyle: shot.visualStyle || project.visualStyle,
        cameraLens: shot.camera.lens,
        lighting: shot.lighting,
        characterTags: shot.charactersPresent.join(', '),
      });
      onUpdateShot(shot.id, {
        action: res.enhancedPrompt,
        negativePrompt: res.negativePrompt,
      });
      setStatusMessage('Prompt upgraded with cinematic optics & physical textures');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Real Image Generation
  const handleGenerateShotVisual = async () => {
    if (!shot) return;
    setIsGeneratingImage(true);
    setStatusMessage('Calling generation engine for shot image...');
    try {
      const res = await aiImageEngine.generateImage({
        prompt: `${shot.visualStyle} cinema still: ${shot.action}. Camera: ${shot.camera.lens} ${shot.camera.angle}, ${shot.lighting}, ${shot.weather}. Negative: ${shot.negativePrompt || 'blurry, cartoon, extra limbs'}`,
        aspectRatio: '16:9',
      });
      onUpdateShot(shot.id, { generatedImageUrl: res.imageUrl });
      setStatusMessage('Shot frame generated and applied to timeline');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Image engine: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Real Voice Synthesis
  const handleGenerateVoice = async () => {
    if (!shot || !shot.dialogue) return;
    setIsGeneratingVoice(true);
    setStatusMessage('Synthesizing dialogue audio with Gemini TTS...');
    try {
      const res = await aiVoiceEngine.generateVoice({
        text: shot.dialogue,
        voiceName: 'Puck',
        style: `${shot.mood} cinematic character dialogue with natural pauses`,
      });
      setVoiceAudioUrl(res.audioUrl);
      const audio = new Audio(res.audioUrl);
      audio.play();
      onUpdateShot(shot.id, { generatedAudioUrl: res.audioUrl });
      setStatusMessage('Voice synthesized and played');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Voice error: ${err.message}`);
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Real Continuity Checker
  const handleCheckContinuity = async () => {
    if (!shot || !activeScene) return;
    setIsCheckingContinuity(true);
    setStatusMessage('Analyzing shot sequence for wardrobe & continuity conflicts...');
    try {
      const res = await fetch('/api/ai/continuity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentShot: shot,
          previousShots: activeScene.shots.filter((s) => s.shotNumber < shot.shotNumber),
          characters: project.characters,
          location: project.locations.find((l) => l.id === shot.locationId),
        }),
      });
      const data = await res.json();
      setContinuityResult(data);
      setStatusMessage(data.hasIssues ? 'Continuity warnings found' : 'Continuity verified clean');
    } catch (err: any) {
      setStatusMessage(`Continuity check: ${err.message}`);
    } finally {
      setIsCheckingContinuity(false);
    }
  };

  return (
    <aside className="w-80 bg-zinc-950 border-l border-zinc-800/80 flex flex-col justify-between select-none z-20 flex-shrink-0 text-zinc-300 overflow-hidden">
      {/* Inspector Header */}
      <div className="h-10 px-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/80 flex-shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-200">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Inspector</span>
        </div>
        {shot && (
          <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 rounded">
            SHOT {shot.shotNumber.toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-900/50 p-1 gap-1 text-[11px] font-medium flex-shrink-0">
        <button
          onClick={() => setActiveTab('shot')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeTab === 'shot' ? 'bg-zinc-800 text-purple-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Shot
        </button>
        <button
          onClick={() => setActiveTab('camera')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeTab === 'camera' ? 'bg-zinc-800 text-purple-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Camera
        </button>
        <button
          onClick={() => setActiveTab('vfx')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeTab === 'vfx' ? 'bg-zinc-800 text-purple-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          VFX
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeTab === 'audio' ? 'bg-zinc-800 text-purple-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Audio
        </button>
        <button
          onClick={() => setActiveTab('character')}
          className={`flex-1 py-1 rounded transition-colors ${
            activeTab === 'character' ? 'bg-zinc-800 text-purple-300 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Cast
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
        {statusMessage && (
          <div className="bg-purple-950/80 border border-purple-700/60 text-purple-200 p-2 rounded text-[11px] flex items-center justify-between animate-fade-in">
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 1. SHOT TAB */}
        {activeTab === 'shot' && shot && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Shot Title
              </label>
              <input
                type="text"
                value={shot.name}
                onChange={(e) => onUpdateShot(shot.id, { name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 focus:border-purple-600 outline-none"
              />
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Duration</label>
                <span className="font-mono text-purple-400 font-semibold">{shot.duration} seconds</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={shot.duration}
                onChange={(e) => onUpdateShot(shot.id, { duration: parseInt(e.target.value) || 5 })}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            {/* Action Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Action & Motion</label>
                <button
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancingPrompt}
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                  title="Enhance prompt with cinematic realism and physical lighting tokens"
                >
                  <Wand2 className="w-3 h-3" />
                  <span>{isEnhancingPrompt ? 'Enhancing...' : 'Enhance Prompt'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={shot.action}
                onChange={(e) => onUpdateShot(shot.id, { action: e.target.value })}
                placeholder="Describe character action, motion, and interaction..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-purple-600 outline-none text-xs leading-relaxed"
              />
            </div>

            {/* Lighting & Weather */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Lighting
                </label>
                <input
                  type="text"
                  value={shot.lighting}
                  onChange={(e) => onUpdateShot(shot.id, { lighting: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Weather
                </label>
                <input
                  type="text"
                  value={shot.weather}
                  onChange={(e) => onUpdateShot(shot.id, { weather: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 text-xs outline-none"
                />
              </div>
            </div>

            {/* Negative Prompt */}
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Negative Prompt (Anti-Artifacts)
              </label>
              <input
                type="text"
                value={shot.negativePrompt || ''}
                onChange={(e) => onUpdateShot(shot.id, { negativePrompt: e.target.value })}
                placeholder="plastic skin, extra limbs, cartoon lines..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-300 text-xs outline-none"
              />
            </div>

            {/* Real Generation Actions */}
            <div className="pt-2 border-t border-zinc-900 space-y-2">
              <button
                onClick={handleGenerateShotVisual}
                disabled={isGeneratingImage}
                className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white font-medium rounded flex items-center justify-center gap-2 shadow-md shadow-purple-950 transition-all cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>{isGeneratingImage ? 'Generating Frame...' : 'Generate Shot Frame'}</span>
              </button>

              <button
                onClick={handleCheckContinuity}
                disabled={isCheckingContinuity}
                className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>{isCheckingContinuity ? 'Checking...' : 'Check Shot Continuity'}</span>
              </button>
            </div>

            {/* Continuity feedback card if available */}
            {continuityResult && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded p-2.5 text-[11px] space-y-1.5">
                <div className="font-semibold text-zinc-200 flex items-center gap-1">
                  {continuityResult.hasIssues ? (
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Continuity Report</span>
                </div>
                {continuityResult.warnings?.map((w: any, idx: number) => (
                  <div key={idx} className="text-amber-300/90 pl-4 border-l border-amber-500/40">
                    <p className="font-medium">{w.issue}</p>
                    <p className="text-[10px] text-zinc-400">{w.suggestedFix}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. CAMERA TAB */}
        {activeTab === 'camera' && shot && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Focal Length (Prime Lens)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {CAMERA_LENSES.map((lens) => (
                  <button
                    key={lens}
                    onClick={() =>
                      onUpdateShot(shot.id, {
                        camera: { ...shot.camera, lens },
                      })
                    }
                    className={`py-1.5 px-2 rounded border text-center transition-colors font-mono ${
                      shot.camera.lens === lens
                        ? 'bg-purple-950/80 border-purple-600 text-purple-200 font-bold'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {lens}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Camera Angle
              </label>
              <select
                value={shot.camera.angle}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    camera: { ...shot.camera, angle: e.target.value as CameraAngle },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 outline-none"
              >
                {CAMERA_ANGLES.map((angle) => (
                  <option key={angle} value={angle}>
                    {angle}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Camera Movement
              </label>
              <select
                value={shot.camera.movement}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    camera: { ...shot.camera, movement: e.target.value as CameraMovement },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 outline-none"
              >
                {CAMERA_MOVEMENTS.map((mov) => (
                  <option key={mov} value={mov}>
                    {mov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Depth of Field / Bokeh
              </label>
              <select
                value={shot.camera.depthOfField}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    camera: {
                      ...shot.camera,
                      depthOfField: e.target.value as 'Deep' | 'Medium' | 'Shallow' | 'Extreme Bokeh',
                    },
                  })
                }
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-zinc-200 outline-none"
              >
                <option value="Shallow">Shallow (f/1.4 - Cinematic portrait)</option>
                <option value="Medium">Medium (f/2.8 - Standard dialogue)</option>
                <option value="Deep">Deep (f/8.0 - Establishing wide)</option>
                <option value="Extreme Bokeh">Extreme Anamorphic Bokeh</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">
                  Focus Distance (Rack Focus)
                </label>
                <span className="font-mono text-purple-400">
                  {(shot.camera.focusDistance || 50)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={shot.camera.focusDistance || 50}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    camera: { ...shot.camera, focusDistance: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-purple-600"
              />
              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>Near (Foreground)</span>
                <span>Subject (50%)</span>
                <span>Far (Infinity)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">
                  Camera Handheld Shake
                </label>
                <span className="font-mono text-purple-400">
                  {((shot.camera.shakeIntensity || 0) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={shot.camera.shakeIntensity || 0}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    camera: { ...shot.camera, shakeIntensity: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        )}

        {/* 3. VFX TAB */}
        {activeTab === 'vfx' && shot && (
          <div className="space-y-4">
            <div className="text-[11px] text-zinc-400">
              Configure real procedural shaders and particle effects composited onto this shot:
            </div>

            <div className="space-y-2">
              {[
                { key: 'rain', label: 'Heavy Rain Streaks' },
                { key: 'fog', label: 'Atmospheric Ground Fog' },
                { key: 'sparks', label: 'Electrical Transformer Sparks' },
                { key: 'lightning', label: 'Lightning Flash Silhouette' },
                { key: 'letterbox', label: '2.39:1 Anamorphic Cinema Bars' },
              ].map((fx) => (
                <label
                  key={fx.key}
                  className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
                >
                  <span className="text-zinc-200">{fx.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean((shot.vfx as any)[fx.key])}
                    onChange={(e) =>
                      onUpdateShot(shot.id, {
                        vfx: { ...shot.vfx, [fx.key]: e.target.checked },
                      })
                    }
                    className="accent-purple-600 rounded"
                  />
                </label>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Film Grain</label>
                <span className="font-mono text-purple-400 font-semibold">
                  {(shot.vfx.filmGrain * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={shot.vfx.filmGrain}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    vfx: { ...shot.vfx, filmGrain: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400">Vignette Edge Falloff</label>
                <span className="font-mono text-purple-400 font-semibold">
                  {(shot.vfx.vignette * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={shot.vfx.vignette}
                onChange={(e) =>
                  onUpdateShot(shot.id, {
                    vfx: { ...shot.vfx, vignette: parseFloat(e.target.value) },
                  })
                }
                className="w-full accent-purple-600"
              />
            </div>
          </div>
        )}

        {/* 4. AUDIO & DIALOGUE TAB */}
        {activeTab === 'audio' && shot && (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Character Spoken Dialogue
              </label>
              <textarea
                rows={3}
                value={shot.dialogue || ''}
                onChange={(e) => onUpdateShot(shot.id, { dialogue: e.target.value })}
                placeholder="Enter character dialogue..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-200 focus:border-purple-600 outline-none text-xs"
              />
              <button
                onClick={handleGenerateVoice}
                disabled={isGeneratingVoice || !shot.dialogue}
                className="mt-2 w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 font-medium rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs disabled:opacity-50"
              >
                <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                <span>{isGeneratingVoice ? 'Synthesizing...' : 'Synthesize Voice (Gemini TTS)'}</span>
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Sound Effects Cue (SFX)
              </label>
              <input
                type="text"
                value={shot.soundEffects || ''}
                onChange={(e) => onUpdateShot(shot.id, { soundEffects: e.target.value })}
                placeholder="Heavy rain, footsteps, thunder..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Music Track Cue
              </label>
              <input
                type="text"
                value={shot.musicCue || ''}
                onChange={(e) => onUpdateShot(shot.id, { musicCue: e.target.value })}
                placeholder="Sub-bass drone, tension riser..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
              />
            </div>
          </div>
        )}

        {/* 5. CAST & CHARACTERS TAB */}
        {activeTab === 'character' && (
          <div className="space-y-4">
            <div className="text-[11px] text-zinc-400">
              Cast assigned to this shot and persistent identity consistency locks:
            </div>

            <div className="space-y-2">
              {project.characters.map((char) => {
                const isPresent = shot?.charactersPresent?.includes(char.id);
                return (
                  <div
                    key={char.id}
                    className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {char.avatarUrl ? (
                          <img
                            src={char.avatarUrl}
                            alt={char.name}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-purple-500/40"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-purple-950 flex items-center justify-center text-[10px] font-bold text-purple-300">
                            {char.name[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-zinc-100">{char.name}</div>
                          <div className="text-[10px] text-zinc-400">{char.role}</div>
                        </div>
                      </div>

                      {shot && (
                        <button
                          onClick={() => {
                            const current = shot.charactersPresent || [];
                            const updated = isPresent
                              ? current.filter((id) => id !== char.id)
                              : [...current, char.id];
                            onUpdateShot(shot.id, { charactersPresent: updated });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                            isPresent
                              ? 'bg-purple-600 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {isPresent ? 'In Shot' : '+ Add'}
                        </button>
                      )}
                    </div>

                    {/* Consistency Locks for this character */}
                    <div className="pt-2 border-t border-zinc-800/80 grid grid-cols-2 gap-1 text-[10px]">
                      {(
                        [
                          { key: 'face', label: 'Lock Face' },
                          { key: 'outfit', label: 'Lock Outfit' },
                          { key: 'hair', label: 'Lock Hair' },
                          { key: 'identity', label: 'Lock Identity' },
                        ] as const
                      ).map((lockItem) => {
                        const isLocked = Boolean(char.lockedAttributes[lockItem.key]);
                        return (
                          <button
                            key={lockItem.key}
                            onClick={() =>
                              onUpdateCharacter(char.id, {
                                lockedAttributes: {
                                  ...char.lockedAttributes,
                                  [lockItem.key]: !isLocked,
                                },
                              })
                            }
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                              isLocked
                                ? 'bg-purple-950/60 border-purple-700/60 text-purple-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                            }`}
                          >
                            {isLocked ? (
                              <Lock className="w-2.5 h-2.5 text-purple-400" />
                            ) : (
                              <Unlock className="w-2.5 h-2.5" />
                            )}
                            <span>{lockItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
