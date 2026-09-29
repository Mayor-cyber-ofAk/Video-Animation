import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Paintbrush,
  PenTool,
  Eraser,
  Sliders,
  Settings2,
  Clock,
  Repeat,
  FastForward,
  Rewind,
  Undo2,
  Redo2,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import {
  Project,
  AnimationFrame,
  AnimationLayerItem,
  OnionSkinSettings,
} from '../types/studio';
import { renderOnionSkin } from '../services/onionSkinRenderer';

interface AnimationStudioViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

const DEFAULT_LAYERS: AnimationLayerItem[] = [
  { id: 'layer_body', name: 'Body & Roughs', type: 'body', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
  { id: 'layer_facial', name: 'Facial & Eyes', type: 'facial', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
  { id: 'layer_clothing', name: 'Clothing & Hair', type: 'clothing', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
  { id: 'layer_fx', name: 'Effects & Sparks', type: 'effects', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
  { id: 'layer_bg', name: 'Background Motion', type: 'background', visible: true, locked: false, opacity: 0.8, blendMode: 'source-over' },
];

export const AnimationStudioView: React.FC<AnimationStudioViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(12);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [loopMode, setLoopMode] = useState<'loop' | 'bounce' | 'once'>('loop');
  const [playDirection, setPlayDirection] = useState<1 | -1>(1);
  const [viewMode, setViewMode] = useState<'canvas' | 'xsheet'>('canvas');

  // Onion skinning state
  const [onionSkin, setOnionSkin] = useState<OnionSkinSettings>(
    project.onionSkinSettings || {
      enabled: true,
      framesBefore: 2,
      framesAfter: 1,
      opacity: 0.35,
      prevTint: '#EF4444', // Red for previous frames
      nextTint: '#10B981', // Green for next frames
      showGhost: true,
      enablePrevious: true,
      enableNext: true,
    }
  );

  // Drawing tool state
  const [tool, setTool] = useState<'brush' | 'pencil' | 'eraser'>('brush');
  const [color, setColor] = useState('#A855F7');
  const [brushSize, setBrushSize] = useState(4);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer_body');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const playTimer = useRef<number | null>(null);
  const undoStack = useRef<string[]>([]);

  const layers = project.animationLayers || DEFAULT_LAYERS;
  const frames = project.animationFrames && project.animationFrames.length > 0
    ? project.animationFrames
    : [
        { id: 'f_0', frameIndex: 0, durationMs: 83, holdCount: 1, layers: {} },
        { id: 'f_1', frameIndex: 1, durationMs: 83, holdCount: 1, layers: {} },
        { id: 'f_2', frameIndex: 2, durationMs: 83, holdCount: 1, layers: {} },
        { id: 'f_3', frameIndex: 3, durationMs: 83, holdCount: 1, layers: {} },
      ];

  // Animation Playback Loop with Ping-Pong / Bounce support
  useEffect(() => {
    if (!isPlaying) {
      if (playTimer.current) clearInterval(playTimer.current);
      return;
    }

    const intervalMs = 1000 / fps;
    playTimer.current = window.setInterval(() => {
      setActiveFrameIdx((prev) => {
        if (loopMode === 'bounce') {
          if (prev >= frames.length - 1) {
            setPlayDirection(-1);
            return Math.max(0, prev - 1);
          } else if (prev <= 0) {
            setPlayDirection(1);
            return Math.min(frames.length - 1, prev + 1);
          }
          return prev + playDirection;
        } else if (loopMode === 'once') {
          if (prev >= frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        } else {
          return (prev + 1) % frames.length;
        }
      });
    }, intervalMs);

    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isPlaying, fps, frames.length, loopMode, playDirection]);

  // Synchronize Ghost Canvas and Active Frame Canvas
  useEffect(() => {
    // 1. Render Ghost Onion Skin on underlay canvas
    const ghostCanvas = ghostCanvasRef.current;
    if (ghostCanvas) {
      const gctx = ghostCanvas.getContext('2d');
      if (gctx) {
        renderOnionSkin(
          gctx,
          ghostCanvas.width,
          ghostCanvas.height,
          frames,
          activeFrameIdx,
          layers,
          onionSkin,
          () => {
            // Re-render when image finishes loading
            const gc = ghostCanvasRef.current;
            if (gc) {
              const c = gc.getContext('2d');
              if (c) renderOnionSkin(c, gc.width, gc.height, frames, activeFrameIdx, layers, onionSkin);
            }
          }
        );
      }
    }

    // 2. Render Active Frame Layers on foreground drawing canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentFrame = frames[activeFrameIdx];
    if (currentFrame) {
      layers.forEach((l) => {
        if (l.visible && currentFrame.layers[l.id]) {
          const img = new Image();
          img.onload = () => {
            ctx.save();
            ctx.globalAlpha = l.opacity;
            ctx.globalCompositeOperation = l.blendMode || 'source-over';
            ctx.drawImage(img, 0, 0);
            ctx.restore();
          };
          img.src = currentFrame.layers[l.id];
        }
      });
    }
  }, [activeFrameIdx, onionSkin, frames, layers]);

  // Save drawing state into current active frame and layer
  const saveCurrentFrameCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const updated = frames.map((f, idx) =>
      idx === activeFrameIdx
        ? {
            ...f,
            layers: {
              ...f.layers,
              [activeLayerId]: dataUrl,
            },
          }
        : f
    );
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: updated,
      onionSkinSettings: onionSkin,
    }));
  };

  // Add Frame
  const handleAddFrame = () => {
    const newFrame: AnimationFrame = {
      id: `f_${Date.now()}`,
      frameIndex: frames.length,
      durationMs: Math.round(1000 / fps),
      holdCount: 1,
      layers: {},
    };
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: [...frames, newFrame],
    }));
    setActiveFrameIdx(frames.length);
  };

  // Duplicate Frame
  const handleDuplicateFrame = () => {
    const current = frames[activeFrameIdx];
    const newFrame: AnimationFrame = {
      id: `f_${Date.now()}`,
      frameIndex: frames.length,
      durationMs: current.durationMs,
      holdCount: current.holdCount || 1,
      layers: { ...current.layers },
    };
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: [...frames, newFrame],
    }));
  };

  // Insert In-Between (Tween Breakdown)
  const handleInsertInBetween = () => {
    const newFrame: AnimationFrame = {
      id: `f_inbetween_${Date.now()}`,
      frameIndex: activeFrameIdx + 1,
      durationMs: Math.round(1000 / fps),
      holdCount: 1,
      layers: {},
    };
    const updated = [...frames];
    updated.splice(activeFrameIdx + 1, 0, newFrame);
    // re-index
    updated.forEach((f, i) => (f.frameIndex = i));
    onUpdateProject((prev) => ({ ...prev, animationFrames: updated }));
    setActiveFrameIdx(activeFrameIdx + 1);
  };

  // Delete Frame
  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const filtered = frames.filter((_, i) => i !== index);
    filtered.forEach((f, i) => (f.frameIndex = i));
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: filtered,
    }));
    setActiveFrameIdx(Math.max(0, index - 1));
  };

  // Change Frame Exposure (Hold count: 1s, 2s, 3s)
  const handleSetFrameHold = (frameIdx: number, hold: number) => {
    const updated = frames.map((f, i) =>
      i === frameIdx ? { ...f, holdCount: hold } : f
    );
    onUpdateProject((prev) => ({ ...prev, animationFrames: updated }));
  };

  // Drawing mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const currentLayer = layers.find((l) => l.id === activeLayerId);
    if (currentLayer?.locked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Save undo snapshot
    undoStack.current.push(canvas.toDataURL('image/png'));
    if (undoStack.current.length > 20) undoStack.current.shift();

    isDrawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = tool === 'pencil' ? Math.max(1, brushSize * 0.7) : brushSize;
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    saveCurrentFrameCanvas();
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.current.length === 0) return;
    const previousData = undoStack.current.pop();
    if (!previousData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      saveCurrentFrameCanvas();
    };
    img.src = previousData;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 text-zinc-200 p-4 space-y-3">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Film className="w-4 h-4" />
            <span>2D Frame-by-Frame Animation & X-Sheet Suite</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-0.5">
            ANIMATION WORKSPACE
          </h1>
        </div>

        {/* Transport & Controls */}
        <div className="flex items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'canvas' ? 'bg-purple-950 text-purple-300 font-semibold' : 'text-zinc-400'
              }`}
            >
              Canvas View
            </button>
            <button
              onClick={() => setViewMode('xsheet')}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                viewMode === 'xsheet' ? 'bg-purple-950 text-purple-300 font-semibold' : 'text-zinc-400'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>X-Sheet / Dope Sheet</span>
            </button>
          </div>

          {/* FPS Selector */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg text-xs">
            <span className="text-zinc-500 font-bold">FPS:</span>
            {[8, 12, 24, 30].map((f) => (
              <button
                key={f}
                onClick={() => setFps(f)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  fps === f ? 'bg-purple-900 text-purple-200 font-bold' : 'text-zinc-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Loop Mode */}
          <button
            onClick={() => {
              const next = loopMode === 'loop' ? 'bounce' : loopMode === 'bounce' ? 'once' : 'loop';
              setLoopMode(next);
            }}
            className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white"
            title="Loop mode: Loop, Bounce / Ping-pong, or Once"
          >
            <Repeat className="w-3 h-3 text-purple-400" />
            <span className="capitalize">{loopMode}</span>
          </button>

          {/* Onion Skin Dropdown / Toggle */}
          <button
            onClick={() => setOnionSkin((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`px-3 py-1.5 rounded-lg text-xs border font-medium transition-colors ${
              onionSkin.enabled
                ? 'bg-purple-950 border-purple-600 text-purple-300 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
          >
            Onion Skin {onionSkin.enabled ? 'ON' : 'OFF'}
          </button>

          {/* Step Back / Forward */}
          <button
            onClick={() => setActiveFrameIdx((p) => Math.max(0, p - 1))}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            title="Step 1 Frame Back"
          >
            <Rewind className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause Loop */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-md shadow-purple-950"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Loop'}</span>
          </button>

          <button
            onClick={() => setActiveFrameIdx((p) => Math.min(frames.length - 1, p + 1))}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300"
            title="Step 1 Frame Forward"
          >
            <FastForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Layers & Tools + Center Canvas + Right Onion Skin Config */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Left: Animation Layers & Tools Panel */}
        <div className="w-60 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between flex-shrink-0 space-y-3">
          {/* Drawing Tools */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-300 font-semibold">
              <span className="uppercase tracking-wider text-[10px] text-zinc-400">Tools</span>
              <button
                onClick={handleUndo}
                className="p-1 hover:text-white text-zinc-400"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setTool('brush')}
                className={`flex flex-col items-center py-1.5 rounded text-[10px] ${
                  tool === 'brush' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-700/60' : 'text-zinc-400'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5 mb-0.5" />
                <span>Brush</span>
              </button>
              <button
                onClick={() => setTool('pencil')}
                className={`flex flex-col items-center py-1.5 rounded text-[10px] ${
                  tool === 'pencil' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-700/60' : 'text-zinc-400'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 mb-0.5" />
                <span>Pencil</span>
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`flex flex-col items-center py-1.5 rounded text-[10px] ${
                  tool === 'eraser' ? 'bg-purple-950 text-purple-200 font-bold border border-purple-700/60' : 'text-zinc-400'
                }`}
              >
                <Eraser className="w-3.5 h-3.5 mb-0.5" />
                <span>Eraser</span>
              </button>
            </div>

            {/* Brush Size & Color */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>Brush Size</span>
                <span className="font-mono">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="36"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />

              <div className="flex items-center gap-1.5 pt-1">
                {(['#A855F7', '#EC4899', '#38BDF8', '#10B981', '#F59E0B', '#FFFFFF', '#000000'] as const).map(
                  (c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border ${
                        color === c ? 'ring-2 ring-white scale-110' : 'border-zinc-700'
                      }`}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* Animation Layers */}
          <div className="flex-1 flex flex-col overflow-hidden pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-1.5">
              <span>Animation Layers</span>
              <span className="text-zinc-500 font-normal">Independent</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-0.5">
              {layers.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setActiveLayerId(l.id)}
                  className={`p-1.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                    activeLayerId === l.id
                      ? 'bg-purple-950/60 border-purple-600 text-purple-200 font-medium'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="truncate text-[11px]">{l.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = layers.map((item) =>
                          item.id === l.id ? { ...item, visible: !item.visible } : item
                        );
                        onUpdateProject((prev) => ({ ...prev, animationLayers: updated }));
                      }}
                      className="p-0.5 hover:text-white"
                    >
                      {l.visible ? <Eye className="w-3 h-3 text-purple-400" /> : <EyeOff className="w-3 h-3 text-zinc-600" />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = layers.map((item) =>
                          item.id === l.id ? { ...item, locked: !item.locked } : item
                        );
                        onUpdateProject((prev) => ({ ...prev, animationLayers: updated }));
                      }}
                      className="p-0.5 hover:text-white"
                    >
                      {l.locked ? <Lock className="w-3 h-3 text-rose-400" /> : <Unlock className="w-3 h-3 text-zinc-600" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Main Drawing Canvas / X-Sheet View */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden flex flex-col items-center justify-center relative p-3">
          {viewMode === 'canvas' ? (
            <>
              <div className="relative aspect-video max-h-[62vh] max-w-full flex items-center justify-center shadow-2xl">
                {/* UNDERLAY: Real Multi-Frame Onion Skin Canvas */}
                <canvas
                  ref={ghostCanvasRef}
                  width={854}
                  height={480}
                  className="absolute inset-0 w-full h-full pointer-events-none rounded-lg select-none"
                />

                {/* FOREGROUND: Active Drawing Surface */}
                <canvas
                  ref={canvasRef}
                  width={854}
                  height={480}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={() => {
                    if (isDrawing.current) {
                      isDrawing.current = false;
                      saveCurrentFrameCanvas();
                    }
                  }}
                  className="relative z-10 w-full h-full bg-zinc-950/20 border border-zinc-800 rounded-lg cursor-crosshair select-none"
                />
              </div>

              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-xs px-3 py-1 rounded text-xs font-mono text-purple-300 border border-white/10 flex items-center gap-2">
                <span>FRAME {activeFrameIdx + 1} / {frames.length}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-zinc-400">Layer: {layers.find((l) => l.id === activeLayerId)?.name}</span>
                <span className="text-zinc-600">·</span>
                <span className="text-amber-400">Hold: {frames[activeFrameIdx]?.holdCount || 1}s</span>
              </div>
            </>
          ) : (
            /* X-Sheet Exposure Sheet View */
            <div className="w-full h-full bg-zinc-950 rounded-lg border border-zinc-800 p-3 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs">
                <span className="font-bold uppercase tracking-wider text-purple-400">
                  Animation Exposure Sheet (Dope Sheet / X-Sheet)
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">
                  Frame exposure timing and breakdowns
                </span>
              </div>

              <div className="mt-2 space-y-1">
                {frames.map((f, idx) => (
                  <div
                    key={f.id}
                    onClick={() => setActiveFrameIdx(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                      idx === activeFrameIdx
                        ? 'bg-purple-950/60 border-purple-600 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-purple-300">
                        F{idx + 1}
                      </span>
                      <span className="text-xs text-zinc-300">
                        {idx === 0 ? 'Keyframe 01 (Action Start)' : idx === frames.length - 1 ? 'Keyframe (Anticipation End)' : 'In-Between / Breakdown'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-zinc-500">Exposure:</span>
                        {[1, 2, 3].map((h) => (
                          <button
                            key={h}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetFrameHold(idx, h);
                            }}
                            className={`px-1.5 py-0.5 rounded font-mono ${
                              (f.holdCount || 1) === h
                                ? 'bg-purple-700 text-white font-bold'
                                : 'bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {h}s
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFrame(idx);
                        }}
                        className="text-zinc-500 hover:text-rose-400 text-xs ml-2"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Onion Skin Settings Panel */}
        <div className="w-60 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between flex-shrink-0 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-purple-400">
                <Sliders className="w-3.5 h-3.5" />
                <span>Onion Skin Controls</span>
              </div>
              <button
                onClick={() => {
                  const defaultSettings: OnionSkinSettings = {
                    enabled: true,
                    framesBefore: 2,
                    framesAfter: 2,
                    step: 1,
                    opacity: 0.35,
                    prevOpacity: 0.35,
                    nextOpacity: 0.35,
                    prevTint: '#EF4444',
                    nextTint: '#10B981',
                    showGhost: true,
                    enablePrevious: true,
                    enableNext: true,
                  };
                  setOnionSkin(defaultSettings);
                  onUpdateProject((p) => ({ ...p, onionSkinSettings: defaultSettings }));
                }}
                className="text-[10px] text-zinc-500 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                title="Reset Onion Skin Settings"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Master Toggle */}
            <label className="flex items-center justify-between text-xs text-zinc-300 font-semibold cursor-pointer p-1.5 rounded-lg bg-zinc-950 border border-zinc-800">
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                <span>Onion Skinning</span>
              </span>
              <input
                type="checkbox"
                checked={onionSkin.enabled}
                onChange={(e) =>
                  setOnionSkin((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="accent-purple-600 rounded cursor-pointer"
              />
            </label>

            {/* Frames Before */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span className="text-rose-400 font-semibold">Frames Before (Past)</span>
                <span className="font-mono">{onionSkin.framesBefore}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={onionSkin.framesBefore}
                onChange={(e) =>
                  setOnionSkin((prev) => ({ ...prev, framesBefore: parseInt(e.target.value) }))
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            {/* Frames After */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span className="text-emerald-400 font-semibold">Frames After (Future)</span>
                <span className="font-mono">{onionSkin.framesAfter}</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={onionSkin.framesAfter}
                onChange={(e) =>
                  setOnionSkin((prev) => ({ ...prev, framesAfter: parseInt(e.target.value) }))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Frame Step / Increment */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-zinc-400 text-[10px]">
                <span>Frame Step:</span>
                <span className="font-mono text-purple-300">
                  Step {onionSkin.step || 1} {onionSkin.step === 2 ? '(Keys only)' : '(Consecutive)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <button
                  onClick={() => setOnionSkin((prev) => ({ ...prev, step: 1 }))}
                  className={`py-1 rounded border text-center font-mono ${
                    (onionSkin.step || 1) === 1
                      ? 'bg-purple-950 border-purple-600 text-purple-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Step 1 (All)
                </button>
                <button
                  onClick={() => setOnionSkin((prev) => ({ ...prev, step: 2 }))}
                  className={`py-1 rounded border text-center font-mono ${
                    onionSkin.step === 2
                      ? 'bg-purple-950 border-purple-600 text-purple-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Step 2 (Keys)
                </button>
              </div>
            </div>

            {/* Ghost Opacity (Master, Prev, Next) */}
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Master Opacity</span>
                  <span className="font-mono">{(onionSkin.opacity * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.9"
                  step="0.05"
                  value={onionSkin.opacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setOnionSkin((prev) => ({ ...prev, opacity: val, prevOpacity: val, nextOpacity: val }));
                  }}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-zinc-500 block mb-0.5">Prev Opacity</span>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.05"
                    value={onionSkin.prevOpacity ?? onionSkin.opacity}
                    onChange={(e) => setOnionSkin((prev) => ({ ...prev, prevOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-zinc-500 block mb-0.5">Next Opacity</span>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.05"
                    value={onionSkin.nextOpacity ?? onionSkin.opacity}
                    onChange={(e) => setOnionSkin((prev) => ({ ...prev, nextOpacity: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Color-Coded Tints */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800 text-[10px]">
              <div>
                <span className="text-zinc-400 block mb-1">Previous Tint:</span>
                <div className="flex items-center gap-1">
                  {['#EF4444', '#F97316', '#F59E0B', '#A1A1AA'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setOnionSkin((prev) => ({ ...prev, prevTint: c }))}
                      className={`w-4 h-4 rounded-full border ${onionSkin.prevTint === c ? 'border-white scale-110' : 'border-zinc-800'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-zinc-400 block mb-1">Next Tint:</span>
                <div className="flex items-center gap-1">
                  {['#10B981', '#06B6D4', '#3B82F6', '#8B5CF6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setOnionSkin((prev) => ({ ...prev, nextTint: c }))}
                      className={`w-4 h-4 rounded-full border ${onionSkin.nextTint === c ? 'border-white scale-110' : 'border-zinc-800'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-1 pt-2 border-t border-zinc-800 text-[11px]">
              <label className="flex items-center justify-between text-zinc-400 cursor-pointer">
                <span>Enable Previous Ghost</span>
                <input
                  type="checkbox"
                  checked={onionSkin.enablePrevious}
                  onChange={(e) =>
                    setOnionSkin((prev) => ({ ...prev, enablePrevious: e.target.checked }))
                  }
                  className="accent-purple-600 rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between text-zinc-400 cursor-pointer">
                <span>Enable Next Ghost</span>
                <input
                  type="checkbox"
                  checked={onionSkin.enableNext}
                  onChange={(e) =>
                    setOnionSkin((prev) => ({ ...prev, enableNext: e.target.checked }))
                  }
                  className="accent-purple-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="p-2 rounded bg-zinc-950 border border-zinc-800/80 text-[10px] text-zinc-400">
            <span className="text-purple-300 font-semibold block mb-0.5">Pro Animator Tip:</span>
            Onion skinning updates instantaneously as you scrub or draw. Ghost frames are never included in the export.
          </div>
        </div>
      </div>

      {/* Bottom Frame Sequence Reel */}
      <div className="h-28 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-300">
              Animation Reel & Exposure Strip
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              Total: {frames.length} frames · {((frames.length / fps) * 1).toFixed(2)}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInsertInBetween}
              className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium"
              title="Insert Tween In-Between Drawing"
            >
              <Sparkles className="w-3 h-3" />
              <span>In-Between</span>
            </button>
            <button
              onClick={handleDuplicateFrame}
              className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white"
            >
              <Copy className="w-3 h-3" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleAddFrame}
              className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Frame</span>
            </button>
          </div>
        </div>

        {/* Frames Row */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
          {frames.map((frame, idx) => (
            <div
              key={frame.id}
              onClick={() => setActiveFrameIdx(idx)}
              className={`w-20 h-16 rounded-lg border transition-all flex-shrink-0 cursor-pointer p-1 flex flex-col justify-between ${
                idx === activeFrameIdx
                  ? 'border-purple-500 bg-purple-950/50 shadow-md ring-1 ring-purple-400'
                  : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400">
                <span className="font-bold text-zinc-300">F{idx + 1}</span>
                <span className="text-[8px] text-purple-400">{frame.holdCount || 1}s</span>
                {frames.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFrame(idx);
                    }}
                    className="hover:text-rose-400 text-[10px]"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex-1 rounded bg-zinc-900/80 overflow-hidden flex items-center justify-center">
                {frame.layers[activeLayerId] || Object.values(frame.layers)[0] ? (
                  <img
                    src={frame.layers[activeLayerId] || Object.values(frame.layers)[0]}
                    alt="frame thumb"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-[8px] text-zinc-600 font-mono">Blank</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
