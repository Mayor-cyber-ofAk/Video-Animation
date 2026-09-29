import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Grid,
  Shield,
  Layers,
  Sparkles,
  Camera,
  Film,
  Subtitles,
  Navigation,
  Move,
  Sliders,
  Eye,
  Columns,
  Compass,
  TrendingUp,
} from 'lucide-react';
import { Shot, Scene, VisualStyle, Project, MotionPath, CameraRig, Keyframe } from '../types/studio';
import { webAudioEngine } from '../services/aiProviders';
import {
  calculateCameraShake,
  interpolateKeyframes,
  evaluateMotionPath,
} from '../services/animationEngine';
import { MotionPathOverlay } from './MotionPathOverlay';
import { GraphEditor } from './GraphEditor';

interface ScenePlayerProps {
  scene: Scene;
  activeShot: Shot | null;
  onSelectShot: (shotId: string) => void;
  visualStyle: VisualStyle;
  project?: Project;
  currentTime?: number;
  onSeek?: (time: number) => void;
  onUpdateProject?: (updater: (prev: Project) => Project) => void;
}

export const ScenePlayer: React.FC<ScenePlayerProps> = ({
  scene,
  activeShot,
  onSelectShot,
  visualStyle,
  project,
  currentTime: externalCurrentTime,
  onSeek,
  onUpdateProject,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [internalTime, setInternalTime] = useState(0); // in seconds
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '2.39:1' | '4:3'>('16:9');
  const [showGrid, setShowGrid] = useState(false);
  const [showSafeAreas, setShowSafeAreas] = useState(false);
  const [showVFX, setShowVFX] = useState(true);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showMotionPath, setShowMotionPath] = useState(true);
  const [showGizmo, setShowGizmo] = useState(true);
  const [multiViewMode, setMultiViewMode] = useState<'single' | 'split'>('single');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGraphEditorOpen, setIsGraphEditorOpen] = useState(false);

  // Focus Distance & Depth of Field (Rack Focus)
  const [focusDistance, setFocusDistance] = useState(50); // 0 (near/foreground) to 100 (far)
  const [rackFocusTarget, setRackFocusTarget] = useState<'subject' | 'foreground' | 'background'>('subject');

  // Object Transform state (for on-canvas gizmo)
  const [objectTransform, setObjectTransform] = useState({
    x: 50,
    y: 50,
    scale: 1,
    rotation: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const currentTime = externalCurrentTime !== undefined ? externalCurrentTime : internalTime;
  const setTime = (time: number) => {
    if (onSeek) onSeek(time);
    else setInternalTime(time);
  };

  const totalDuration = scene.shots.reduce((acc, s) => acc + s.duration, 0) || 1;

  // Find which shot corresponds to currentTime
  const currentShotIndex = React.useMemo(() => {
    let accumulated = 0;
    for (let i = 0; i < scene.shots.length; i++) {
      accumulated += scene.shots[i].duration;
      if (currentTime < accumulated) {
        return i;
      }
    }
    return Math.max(0, scene.shots.length - 1);
  }, [currentTime, scene.shots]);

  const currentDisplayShot = scene.shots[currentShotIndex] || activeShot || scene.shots[0];

  // Shot time offset
  const shotStartTime = React.useMemo(() => {
    let acc = 0;
    for (let i = 0; i < currentShotIndex; i++) {
      acc += scene.shots[i].duration;
    }
    return acc;
  }, [currentShotIndex, scene.shots]);

  const timeInCurrentShot = Math.max(0, currentTime - shotStartTime);

  // Play / Pause timer loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      return;
    }

    let lastTimestamp = performance.now();
    const speed = project?.timingSettings?.playbackSpeed || 1;

    const loop = (timestamp: number) => {
      const delta = ((timestamp - lastTimestamp) / 1000) * speed;
      lastTimestamp = timestamp;

      setTime(currentTime + delta >= totalDuration ? 0 : currentTime + delta);
      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, currentTime, totalDuration, project?.timingSettings?.playbackSpeed]);

  // Audio cues on shot start
  useEffect(() => {
    if (isPlaying && !isMuted && currentDisplayShot) {
      if (currentDisplayShot.vfx.rain) {
        webAudioEngine.playRain(1);
      }
      if (currentDisplayShot.vfx.lightning && Math.random() > 0.6) {
        webAudioEngine.playThunder();
      }
    }
  }, [currentShotIndex, isPlaying, isMuted, currentDisplayShot]);

  // Sync selected shot if player moves to next shot
  useEffect(() => {
    if (isPlaying && currentDisplayShot && currentDisplayShot.id !== activeShot?.id) {
      onSelectShot(currentDisplayShot.id);
    }
  }, [currentDisplayShot, isPlaying, activeShot, onSelectShot]);

  // Keyboard shortcut for Space = Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === '[') {
        jumpToShot(Math.max(0, currentShotIndex - 1));
      } else if (e.key === ']') {
        jumpToShot(Math.min(scene.shots.length - 1, currentShotIndex + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentShotIndex, scene.shots.length]);

  const jumpToShot = (index: number) => {
    let acc = 0;
    for (let i = 0; i < index; i++) {
      acc += scene.shots[i].duration;
    }
    setTime(acc);
    if (scene.shots[index]) {
      onSelectShot(scene.shots[index].id);
    }
  };

  // Render canvas procedural VFX layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (!showVFX || !currentDisplayShot) return;

    const vfx = currentDisplayShot.vfx;

    // 1. Rain
    if (vfx.rain) {
      ctx.strokeStyle = 'rgba(190, 220, 255, 0.45)';
      ctx.lineWidth = 1.4;
      const count = 70;
      for (let i = 0; i < count; i++) {
        const seed = (i * 997 + currentTime * 400) % width;
        const y = (i * 73 + currentTime * 1400) % height;
        ctx.beginPath();
        ctx.moveTo(seed, y);
        ctx.lineTo(seed - 8, y + 28);
        ctx.stroke();
      }
    }

    // 2. Sparks
    if (vfx.sparks) {
      ctx.fillStyle = '#FFAE33';
      for (let s = 0; s < 15; s++) {
        const sx = (Math.sin(s + currentTime * 3) * 0.5 + 0.5) * width;
        const sy = (Math.cos(s * 2 + currentTime * 4) * 0.5 + 0.5) * height;
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // 3. Lightning Flash
    if (vfx.lightning && Math.sin(currentTime * 12) > 0.95) {
      ctx.fillStyle = 'rgba(235, 245, 255, 0.28)';
      ctx.fillRect(0, 0, width, height);
    }

    // 4. Vignette
    if (vfx.vignette > 0) {
      const radius = Math.max(width, height) * 0.65;
      const vig = ctx.createRadialGradient(width / 2, height / 2, radius * 0.4, width / 2, height / 2, radius);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${Math.min(vfx.vignette, 0.85)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. Film Grain
    if (vfx.filmGrain > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const grainCount = 300;
      for (let g = 0; g < grainCount; g++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
      }
    }
  }, [currentTime, currentDisplayShot, showVFX]);

  // Format Timecode
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const frames = Math.floor((sec % 1) * 24);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[80vh]';
      case '2.39:1':
        return 'aspect-[2.39/1] max-w-full';
      case '4:3':
        return 'aspect-[4/3] max-h-[80vh]';
      case '16:9':
      default:
        return 'aspect-video max-w-full';
    }
  };

  // Extract all keyframes from project timeline tracks
  const allKeyframes: Keyframe[] = React.useMemo(() => {
    if (!project?.timelineTracks) return [];
    return project.timelineTracks.flatMap((t) => t.keyframes || []);
  }, [project?.timelineTracks]);

  // Evaluate Animated Camera System (Keyframes + Procedural Movement + Shake)
  const getCameraTransform = () => {
    if (!currentDisplayShot) return '';
    const cam = currentDisplayShot.camera;
    const dur = currentDisplayShot.duration || 5;
    const ratio = Math.min(1, timeInCurrentShot / dur);

    // Keyframed camera properties
    const kfPanX = interpolateKeyframes(
      allKeyframes.filter((k) => k.property === 'cameraPanX'),
      currentTime,
      0
    );
    const kfPanY = interpolateKeyframes(
      allKeyframes.filter((k) => k.property === 'cameraPanY'),
      currentTime,
      0
    );
    const kfTilt = interpolateKeyframes(
      allKeyframes.filter((k) => k.property === 'cameraTilt'),
      currentTime,
      0
    );
    const kfRoll = interpolateKeyframes(
      allKeyframes.filter((k) => k.property === 'cameraRoll'),
      currentTime,
      0
    );
    const kfZoom = interpolateKeyframes(
      allKeyframes.filter((k) => k.property === 'cameraZoom'),
      currentTime,
      1
    );

    let scale = kfZoom !== 1 ? kfZoom : 1.0;
    let translateX = kfPanX;
    let translateY = kfPanY;
    let rotateZ = kfRoll;

    // Movement presets
    if (cam.movement === 'Push in' || cam.movement === 'Dolly') {
      scale *= 1.0 + ratio * 0.08;
    } else if (cam.movement === 'Pull out') {
      scale *= 1.08 - ratio * 0.08;
    } else if (cam.movement === 'Pan' || cam.movement === 'Tracking') {
      translateX += (ratio - 0.5) * 28;
    } else if (cam.movement === 'Tilt') {
      translateY += (ratio - 0.5) * 22;
    }

    if (cam.angle === 'Dutch angle') {
      rotateZ += 6;
    }

    // Procedural shake
    const shakeIntensity = cam.shakeIntensity || 0;
    if (shakeIntensity > 0 && isPlaying) {
      const shake = calculateCameraShake(currentTime, shakeIntensity, 'handheld');
      translateX += shake.x;
      translateY += shake.y;
      rotateZ += shake.roll;
    }

    return `scale(${scale}) translate(${translateX}px, ${translateY}px) rotate(${rotateZ + kfTilt * 0.5}deg)`;
  };

  // Evaluate Rack Focus Depth-of-Field Blur (Focus Distance)
  const getDepthOfFieldFilter = () => {
    // If focus distance is at 50, standard crisp focus
    // If rack focused to background (e.g. 90), foreground blurs slightly (e.g. 1.2px)
    // If rack focused to extreme near (e.g. 10), background blurs (e.g. 2.0px)
    const kfFocus = interpolateKeyframes(
      allKeyframes.filter((k) => k.property === 'cameraFocusDistance'),
      currentTime,
      focusDistance
    );
    const deviation = Math.abs(kfFocus - 50);
    const blurPx = (deviation / 50) * 1.6;
    return blurPx > 0.3 ? `blur(${blurPx.toFixed(1)}px)` : 'none';
  };

  // Motion path updater
  const handleUpdateMotionPath = (path: MotionPath) => {
    if (!onUpdateProject) return;
    onUpdateProject((prev) => ({
      ...prev,
      motionPaths: [path],
    }));
  };

  // Rack Focus toggle
  const handleTriggerRackFocus = (target: 'subject' | 'foreground' | 'background') => {
    setRackFocusTarget(target);
    const val = target === 'foreground' ? 15 : target === 'background' ? 85 : 50;
    setFocusDistance(val);
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col bg-zinc-950/95 overflow-hidden select-none relative"
    >
      {/* Top Viewport Toolbar */}
      <div className="h-10 px-3 flex items-center justify-between border-b border-zinc-900 bg-zinc-950 text-xs text-zinc-400 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-zinc-200 uppercase tracking-wide">
            SHOT {currentDisplayShot?.shotNumber || 1} / {scene.shots.length}
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-300 truncate max-w-44 font-medium">{currentDisplayShot?.name}</span>
          <span className="text-zinc-600">·</span>
          <span className="text-purple-400 font-mono text-[11px] hidden sm:inline">
            {currentDisplayShot?.camera?.lens || '35mm'} {currentDisplayShot?.camera?.angle} ({currentDisplayShot?.camera?.movement})
          </span>
        </div>

        {/* Viewport controls & Animation Toggles */}
        <div className="flex items-center gap-2">
          {/* Multi-Angle Split Toggle */}
          <button
            onClick={() => setMultiViewMode(multiViewMode === 'single' ? 'split' : 'single')}
            className={`p-1 rounded transition-colors flex items-center gap-1 text-[11px] ${
              multiViewMode === 'split' ? 'text-purple-300 bg-purple-950 border border-purple-800' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            title="Split-Screen Multi-Angle Preview (Master Shot vs Director Cam)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Multi-Angle</span>
          </button>

          {/* Motion Path overlay toggle */}
          <button
            onClick={() => setShowMotionPath(!showMotionPath)}
            className={`p-1 rounded transition-colors flex items-center gap-1 text-[11px] ${
              showMotionPath ? 'text-purple-400 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle Visual Motion Path & Trajectory Handles"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Path</span>
          </button>

          {/* Transform Gizmo toggle */}
          <button
            onClick={() => setShowGizmo(!showGizmo)}
            className={`p-1 rounded transition-colors flex items-center gap-1 text-[11px] ${
              showGizmo ? 'text-purple-400 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title="Toggle On-Screen Transform Gizmo (Translate, Rotate, Scale)"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Gizmo</span>
          </button>

          {/* Aspect Ratio selector */}
          <div className="flex items-center bg-zinc-900 rounded p-0.5 border border-zinc-800">
            {(['16:9', '9:16', '2.39:1', '4:3'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  aspectRatio === r ? 'bg-purple-900/60 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1 rounded transition-colors ${showGrid ? 'text-purple-400 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Rule of Thirds Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Safe Areas toggle */}
          <button
            onClick={() => setShowSafeAreas(!showSafeAreas)}
            className={`p-1 rounded transition-colors ${showSafeAreas ? 'text-purple-400 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Title & Action Safe Zones"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>

          {/* VFX toggle */}
          <button
            onClick={() => setShowVFX(!showVFX)}
            className={`p-1 rounded transition-colors ${showVFX ? 'text-purple-400 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Procedural VFX Overlay"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          {/* Graph Editor toggle button */}
          <button
            onClick={() => setIsGraphEditorOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/70 border border-purple-700/60 text-purple-300 hover:text-white transition-colors text-xs cursor-pointer shadow-xs"
            title="Open Camera & Motion Graph Editor"
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Curves</span>
          </button>

          {/* Subtitles toggle */}
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`p-1 rounded transition-colors ${showSubtitles ? 'text-purple-400 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Subtitles Preview"
          >
            <Subtitles className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            title="Fullscreen Canvas"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Center Video / Canvas Display */}
      <div className="flex-1 flex items-center justify-center p-2.5 relative bg-black/60 overflow-hidden">
        {/* If multiViewMode === 'split', show Dual Screens */}
        <div className={`w-full h-full flex items-center justify-center gap-3 ${multiViewMode === 'split' ? 'grid grid-cols-2' : ''}`}>
          {/* Main Director Camera View */}
          <div
            className={`relative bg-zinc-950 rounded-lg overflow-hidden shadow-2xl border border-zinc-800/80 transition-all ${getAspectClass()}`}
            style={{ maxHeight: 'calc(100vh - 290px)', width: 'auto' }}
          >
            {/* Active Image / Video Layer with camera motion & depth of field */}
            <div
              className="w-full h-full relative transition-transform duration-75 ease-out overflow-hidden flex items-center justify-center"
              style={{
                transform: getCameraTransform(),
                filter: getDepthOfFieldFilter(),
              }}
            >
              {currentDisplayShot?.generatedImageUrl ? (
                <img
                  src={currentDisplayShot.generatedImageUrl}
                  alt={currentDisplayShot.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-center text-center p-6">
                  <Camera className="w-12 h-12 text-zinc-700 mb-3" />
                  <div className="text-zinc-300 font-bold text-lg font-['Cinzel'] tracking-wide">
                    SHOT {currentDisplayShot?.shotNumber}
                  </div>
                  <div className="text-zinc-500 text-xs max-w-md mt-1">{currentDisplayShot?.action}</div>
                  <div className="mt-4 text-[11px] text-purple-400 border border-purple-800/40 bg-purple-950/40 px-3 py-1 rounded">
                    Direct & Animate in Inspector →
                  </div>
                </div>
              )}
            </div>

            {/* Procedural VFX Canvas */}
            <canvas
              ref={canvasRef}
              width={960}
              height={540}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Interactive Motion Path & Transform Gizmo Overlay */}
            {showMotionPath && (
              <MotionPathOverlay
                motionPath={project?.motionPaths?.[0]}
                currentTime={timeInCurrentShot}
                duration={currentDisplayShot?.duration || 5}
                onUpdatePath={handleUpdateMotionPath}
                showGizmo={showGizmo}
                transform={objectTransform}
                onUpdateTransform={setObjectTransform}
              />
            )}

            {/* Anamorphic Letterbox Bars if enabled */}
            {currentDisplayShot?.vfx.letterbox && (
              <>
                <div className="absolute top-0 left-0 right-0 h-[10%] bg-black pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black pointer-events-none z-10" />
              </>
            )}

            {/* Rule of Thirds Grid Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
                <div className="border-r border-b border-purple-500/25" />
                <div className="border-r border-b border-purple-500/25" />
                <div className="border-b border-purple-500/25" />
                <div className="border-r border-b border-purple-500/25" />
                <div className="border-r border-b border-purple-500/25" />
                <div className="border-b border-purple-500/25" />
                <div className="border-r border-b border-purple-500/25" />
                <div className="border-r border-b border-purple-500/25" />
                <div />
              </div>
            )}

            {/* Safe Areas Overlay */}
            {showSafeAreas && (
              <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                <div className="w-[90%] h-[90%] border border-emerald-500/30 relative">
                  <span className="absolute top-1 left-1 text-[9px] text-emerald-400/60 uppercase">Action Safe 90%</span>
                  <div className="w-[88%] h-[88%] absolute inset-0 m-auto border border-amber-500/30">
                    <span className="absolute top-1 left-1 text-[9px] text-amber-400/60 uppercase">Title Safe 80%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Subtitles Overlay */}
            {showSubtitles && (currentDisplayShot?.textOverlay?.content || currentDisplayShot?.dialogue) && (
              <div className="absolute bottom-6 inset-x-8 text-center pointer-events-none z-20">
                <span className="inline-block bg-black/75 backdrop-blur-xs text-white font-medium text-sm px-4 py-1.5 rounded shadow-lg border border-white/10 font-sans tracking-wide">
                  {currentDisplayShot.textOverlay?.content || currentDisplayShot.dialogue}
                </span>
              </div>
            )}

            {/* Watermark Tag */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-zinc-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 pointer-events-none z-20 flex items-center gap-1.5">
              <span>SHOT {currentDisplayShot?.shotNumber.toString().padStart(2, '0')}</span>
              <span className="text-zinc-500">·</span>
              <span className="text-purple-300">{timeInCurrentShot.toFixed(1)}s</span>
              <span className="text-zinc-500">·</span>
              <span className="text-emerald-400">FPS {project?.timingSettings?.fps || 24}</span>
            </div>

            {/* Rack Focus Quick Controller on Top Right */}
            <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-xs px-2 py-1 rounded border border-white/10 flex items-center gap-1 text-[9px] z-20">
              <span className="text-zinc-400 uppercase font-mono mr-1">Rack Focus:</span>
              <button
                onClick={() => handleTriggerRackFocus('foreground')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  rackFocusTarget === 'foreground' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Near
              </button>
              <button
                onClick={() => handleTriggerRackFocus('subject')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  rackFocusTarget === 'subject' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Subject
              </button>
              <button
                onClick={() => handleTriggerRackFocus('background')}
                className={`px-1.5 py-0.5 rounded font-mono ${
                  rackFocusTarget === 'background' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Far
              </button>
            </div>
          </div>

          {/* Secondary Multi-Angle View: Wide Master or Top-Down Wireframe */}
          {multiViewMode === 'split' && (
            <div
              className={`relative bg-zinc-950 rounded-lg overflow-hidden shadow-2xl border border-purple-800/60 flex flex-col items-center justify-center p-4 ${getAspectClass()}`}
              style={{ maxHeight: 'calc(100vh - 290px)' }}
            >
              <div className="absolute top-2 left-2 bg-purple-950/80 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded border border-purple-700/50">
                MULTI-ANGLE: 3D PERSPECTIVE / MASTER CAM
              </div>
              <Compass className="w-10 h-10 text-purple-400 mb-2 animate-spin duration-1000" />
              <div className="text-xs text-zinc-300 font-semibold uppercase">
                Isometric Scene Overview
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 text-center max-w-xs">
                Real-time synchronized angle: Pan {objectTransform.x.toFixed(0)}%, Tilt {currentDisplayShot.camera.angle}, FOV {currentDisplayShot.camera.lens}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrub Bar & Player Controls Bar */}
      <div className="h-14 px-4 bg-zinc-950 border-t border-zinc-900 flex flex-col justify-center gap-1.5 flex-shrink-0">
        {/* Scrub progress bar */}
        <div
          className="relative h-2 bg-zinc-800/80 hover:h-2.5 rounded-full cursor-pointer transition-all group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setTime(pos * totalDuration);
          }}
        >
          {/* Shot divisions ticks */}
          {scene.shots.map((s, idx) => {
            let start = 0;
            for (let i = 0; i < idx; i++) start += scene.shots[i].duration;
            const leftPct = (start / totalDuration) * 100;
            return (
              <div
                key={s.id}
                className="absolute top-0 bottom-0 w-0.5 bg-zinc-900 z-10"
                style={{ left: `${leftPct}%` }}
                title={`Shot ${s.shotNumber}: ${s.name}`}
              />
            );
          })}

          {/* Filled progress */}
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full relative"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="w-3.5 h-3.5 bg-white rounded-full shadow-md border-2 border-purple-600 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Buttons and Timecodes */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          {/* Left: Transport buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => jumpToShot(Math.max(0, currentShotIndex - 1))}
              className="p-1 hover:text-zinc-200 transition-colors"
              title="Previous Shot ([)"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-950 transition-transform active:scale-95 cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            <button
              onClick={() => jumpToShot(Math.min(scene.shots.length - 1, currentShotIndex + 1))}
              className="p-1 hover:text-zinc-200 transition-colors"
              title="Next Shot (])"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setTime(0)}
              className="p-1 hover:text-zinc-200 transition-colors ml-1"
              title="Return to Start"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1 rounded transition-colors ${isMuted ? 'text-rose-400' : 'hover:text-zinc-200'}`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Center: Real Timecode / Frame */}
          <div className="font-mono text-xs text-zinc-300 flex items-center gap-2">
            <span className="text-purple-400 font-semibold">{formatTimecode(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span>{formatTimecode(totalDuration)}</span>
            <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
              FRAME {Math.floor(currentTime * (project?.timingSettings?.fps || 24))}
            </span>
          </div>

          {/* Right: Quick shot selector pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-sm py-0.5">
            {scene.shots.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => jumpToShot(idx)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  idx === currentShotIndex
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                }`}
                title={`Shot ${s.shotNumber}: ${s.name}`}
              >
                S{s.shotNumber.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Motion Curves & Graph Editor */}
      {isGraphEditorOpen && project && (
        <GraphEditor
          project={project}
          currentTime={currentTime}
          onSeek={setTime}
          onUpdateProject={onUpdateProject || (() => {})}
          onClose={() => setIsGraphEditorOpen(false)}
          initialProperty="cameraPanX"
        />
      )}
    </div>
  );
};
