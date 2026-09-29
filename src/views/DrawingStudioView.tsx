import React, { useState, useRef, useEffect } from 'react';
import {
  PenTool,
  Paintbrush,
  Eraser,
  Square,
  Circle,
  Minus,
  Pipette,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  RotateCw,
  Download,
  Trash2,
  Plus,
  Sparkles,
  Camera,
  Upload,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Split,
  Grid,
  Check,
  User,
  Shield,
  Save,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Copy,
  Sliders,
  Settings2,
  RefreshCw,
} from 'lucide-react';
import {
  Project,
  DrawingLayer,
  Character,
  AnimationFrame,
  OnionSkinSettings,
} from '../types/studio';
import { renderOnionSkin } from '../services/onionSkinRenderer';

interface DrawingStudioViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onSelectShot: (shotId: string) => void;
}

type Tool =
  | 'brush'
  | 'pen'
  | 'pencil'
  | 'marker'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'eyedropper';

const DEFAULT_ONION_SETTINGS: OnionSkinSettings = {
  enabled: true,
  framesBefore: 2,
  framesAfter: 2,
  step: 1,
  opacity: 0.35,
  prevOpacity: 0.35,
  nextOpacity: 0.35,
  prevTint: '#EF4444', // Warm Red for previous frames
  nextTint: '#10B981', // Cool Green for upcoming frames
  showGhost: true,
  enablePrevious: true,
  enableNext: true,
};

export const DrawingStudioView: React.FC<DrawingStudioViewProps> = ({
  project,
  onUpdateProject,
  onSelectShot,
}) => {
  const [activeTool, setActiveTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#A855F7');
  const [brushSize, setBrushSize] = useState(6);
  const [opacity, setOpacity] = useState(1);
  const [symmetryMode, setSymmetryMode] = useState<'none' | 'vertical' | 'horizontal'>('none');
  const [showGuides, setShowGuides] = useState(false);
  const [showOnionPanel, setShowOnionPanel] = useState(false);

  // Frames & Onion Skin state
  const [activeFrameIdx, setActiveFrameIdx] = useState(project.activeFrameIndex || 0);
  const [isPlayingFrames, setIsPlayingFrames] = useState(false);
  const [onionSettings, setOnionSettings] = useState<OnionSkinSettings>(
    project.onionSkinSettings || DEFAULT_ONION_SETTINGS
  );

  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(project.characters[0]?.id || '');
  const [referenceViewType, setReferenceViewType] = useState<'Front' | 'Back' | 'Left' | 'Right' | '3/4' | 'Close-up'>('Front');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ghostCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const undoStack = useRef<ImageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playTimer = useRef<number | null>(null);

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const activeShot = activeScene.shots.find((s) => s.id === project.activeShotId) || activeScene.shots[0];

  const frames: AnimationFrame[] = project.animationFrames && project.animationFrames.length > 0
    ? project.animationFrames
    : [
        { id: 'f_0', frameIndex: 0, durationMs: 125, holdCount: 1, layers: {} },
        { id: 'f_1', frameIndex: 1, durationMs: 125, holdCount: 1, layers: {} },
        { id: 'f_2', frameIndex: 2, durationMs: 125, holdCount: 1, layers: {} },
      ];

  const layers: DrawingLayer[] = project.drawingLayers || [
    { id: 'layer_1', name: 'Rough Sketch', visible: true, locked: false, opacity: 0.6, blendMode: 'source-over' },
    { id: 'layer_2', name: 'Clean Lineart', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
    { id: 'layer_3', name: 'Base Colors', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
    { id: 'layer_4', name: 'Shading & Highlights', visible: true, locked: false, opacity: 0.85, blendMode: 'source-over' },
  ];

  // Helper notification toast
  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Re-draw Onion Skin Ghost frames on ghost canvas
  const updateGhostCanvas = () => {
    const ghostCanvas = ghostCanvasRef.current;
    if (!ghostCanvas) return;
    const ctx = ghostCanvas.getContext('2d');
    if (!ctx) return;

    renderOnionSkin(
      ctx,
      ghostCanvas.width,
      ghostCanvas.height,
      frames,
      activeFrameIdx,
      [
        { id: 'layer_body', name: 'Body', type: 'body', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
        { id: 'layer_facial', name: 'Facial', type: 'facial', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
        { id: 'layer_2', name: 'Clean Lineart', type: 'effects', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
      ],
      onionSettings,
      () => {
        // Callback if image loaded asynchronously: re-render immediately
        updateGhostCanvas();
      }
    );
  };

  // Load Active Frame Drawing onto primary drawing canvas
  const loadFrameOntoCanvas = (frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const targetFrame = frames[frameIdx];
    if (!targetFrame) return;

    // Check if frame has drawn strokes
    const frameDataUrl = targetFrame.layers['layer_body'] || targetFrame.layers['layer_2'];
    if (frameDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = frameDataUrl;
    }
  };

  // Synchronize canvas and onion skins whenever active frame or settings change
  useEffect(() => {
    loadFrameOntoCanvas(activeFrameIdx);
    updateGhostCanvas();
  }, [activeFrameIdx, onionSettings, frames]);

  // Frame Playback Loop
  useEffect(() => {
    if (!isPlayingFrames) {
      if (playTimer.current) clearInterval(playTimer.current);
      return;
    }
    const interval = 1000 / 12; // 12 fps
    playTimer.current = window.setInterval(() => {
      setActiveFrameIdx((prev) => (prev + 1) % frames.length);
    }, interval);

    return () => {
      if (playTimer.current) clearInterval(playTimer.current);
    };
  }, [isPlayingFrames, frames.length]);

  // Save current active frame's strokes
  const saveCurrentFrameStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const updated = frames.map((f, idx) =>
      idx === activeFrameIdx
        ? {
            ...f,
            layers: {
              ...f.layers,
              layer_body: dataUrl,
            },
          }
        : f
    );

    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: updated,
      activeFrameIndex: activeFrameIdx,
      onionSkinSettings: onionSettings,
    }));
  };

  // Switch Frame with autosave
  const handleSelectFrame = (targetIdx: number) => {
    if (targetIdx === activeFrameIdx) return;
    saveCurrentFrameStrokes();
    setActiveFrameIdx(targetIdx);
  };

  // Add Frame
  const handleAddFrame = () => {
    saveCurrentFrameStrokes();
    const newFrame: AnimationFrame = {
      id: `f_${Date.now()}`,
      frameIndex: frames.length,
      durationMs: 125,
      holdCount: 1,
      layers: {},
    };
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: [...frames, newFrame],
    }));
    setActiveFrameIdx(frames.length);
    showNotification(`Added Frame ${frames.length + 1}`);
  };

  // Duplicate Frame
  const handleDuplicateFrame = () => {
    saveCurrentFrameStrokes();
    const cur = frames[activeFrameIdx];
    const newFrame: AnimationFrame = {
      id: `f_${Date.now()}`,
      frameIndex: frames.length,
      durationMs: cur.durationMs || 125,
      holdCount: cur.holdCount || 1,
      layers: { ...cur.layers },
    };
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: [...frames, newFrame],
    }));
    setActiveFrameIdx(frames.length);
    showNotification(`Duplicated Frame ${activeFrameIdx + 1}`);
  };

  // Insert In-Between
  const handleInsertInBetween = () => {
    saveCurrentFrameStrokes();
    const newFrame: AnimationFrame = {
      id: `f_inbetween_${Date.now()}`,
      frameIndex: activeFrameIdx + 1,
      durationMs: 125,
      holdCount: 1,
      layers: {},
    };
    const updated = [...frames];
    updated.splice(activeFrameIdx + 1, 0, newFrame);
    updated.forEach((f, i) => (f.frameIndex = i));
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: updated,
    }));
    setActiveFrameIdx(activeFrameIdx + 1);
    showNotification(`Inserted In-Between Frame ${activeFrameIdx + 2}`);
  };

  // Delete Frame
  const handleDeleteFrame = (idx: number) => {
    if (frames.length <= 1) return;
    const filtered = frames.filter((_, i) => i !== idx);
    filtered.forEach((f, i) => (f.frameIndex = i));
    onUpdateProject((prev) => ({
      ...prev,
      animationFrames: filtered,
    }));
    setActiveFrameIdx(Math.max(0, idx - 1));
    showNotification('Frame deleted');
  };

  // Reset Onion Skin Settings
  const handleResetOnionSkin = () => {
    setOnionSettings(DEFAULT_ONION_SETTINGS);
    onUpdateProject((prev) => ({
      ...prev,
      onionSkinSettings: DEFAULT_ONION_SETTINGS,
    }));
    showNotification('Reset Onion Skin settings to default');
  };

  // Undo Stack
  const saveUndoState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.current.length > 25) {
      undoStack.current.shift();
    }
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || undoStack.current.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const prev = undoStack.current.pop();
    if (prev) {
      ctx.putImageData(prev, 0, 0);
      saveCurrentFrameStrokes();
    }
  };

  // Drawing Mouse Handlers (ONLY affects canvasRef, never ghostCanvasRef)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'eyedropper') {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
      setColor(hex);
      setActiveTool('brush');
      return;
    }

    if (activeTool === 'fill') {
      saveUndoState();
      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveCurrentFrameStrokes();
      return;
    }

    saveUndoState();
    isDrawing.current = true;
    startX.current = x;
    startY.current = y;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = brushSize * 2.5;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity;

      if (activeTool === 'pen') {
        ctx.lineWidth = Math.max(1, brushSize * 0.4);
      } else if (activeTool === 'pencil') {
        ctx.lineWidth = Math.max(1, brushSize * 0.6);
      } else if (activeTool === 'marker') {
        ctx.lineWidth = brushSize * 2;
        ctx.globalAlpha = opacity * 0.7;
      } else {
        ctx.lineWidth = brushSize;
      }
    }
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

    if (['brush', 'pen', 'pencil', 'marker', 'eraser'].includes(activeTool)) {
      ctx.lineTo(x, y);
      ctx.stroke();

      if (symmetryMode === 'vertical') {
        const mirrorX = canvas.width - x;
        const prevMirrorX = canvas.width - startX.current;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(prevMirrorX, startY.current);
        ctx.lineTo(mirrorX, y);
        ctx.stroke();
        ctx.restore();
      } else if (symmetryMode === 'horizontal') {
        const mirrorY = canvas.height - y;
        const prevMirrorY = canvas.height - startY.current;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(startX.current, prevMirrorY);
        ctx.lineTo(x, mirrorY);
        ctx.stroke();
        ctx.restore();
      }

      startX.current = x;
      startY.current = y;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX.current, startY.current);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (activeTool === 'rectangle') {
      const w = x - startX.current;
      const h = y - startY.current;
      ctx.strokeRect(startX.current, startY.current, w, h);
    } else if (activeTool === 'circle') {
      const radius = Math.hypot(x - startX.current, y - startY.current);
      ctx.beginPath();
      ctx.arc(startX.current, startY.current, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Save strokes cleanly
    saveCurrentFrameStrokes();
  };

  // Flip Canvas
  const handleFlip = (axis: 'horizontal' | 'vertical') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveUndoState();
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    temp.getContext('2d')?.drawImage(canvas, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (axis === 'horizontal') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
    }
    ctx.drawImage(temp, 0, 0);
    ctx.restore();
    saveCurrentFrameStrokes();
    showNotification(`Flipped ${axis}`);
  };

  // Import Sketch Image file
  const handleImportImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        saveUndoState();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveCurrentFrameStrokes();
        showNotification('Imported sketch onto frame');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Save Character Reference Sheet
  const handleSaveAsCharacterReference = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    onUpdateProject((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => {
        if (c.id === selectedCharacterId) {
          const filtered = c.referenceImages.filter((r) => r.view !== referenceViewType);
          return {
            ...c,
            referenceImages: [...filtered, { view: referenceViewType, imageUrl: dataUrl }],
          };
        }
        return c;
      }),
    }));
    showNotification(`Saved as ${referenceViewType} Reference View!`);
  };

  // Apply to Shot
  const handleApplyToShot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    onUpdateProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === prev.activeSceneId
          ? {
              ...s,
              shots: s.shots.map((sh) =>
                sh.id === activeShot.id ? { ...sh, generatedImageUrl: dataUrl } : sh
              ),
            }
          : s
      ),
    }));
    showNotification(`Artwork applied to Shot ${activeShot.shotNumber}!`);
  };

  // Clear Canvas
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveUndoState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveCurrentFrameStrokes();
    showNotification('Frame cleared');
  };

  // Download artwork as clean PNG (pure strokes without ghost frames)
  const handleDownloadArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `ANIMORA_FRAME_${activeFrameIdx + 1}_${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-zinc-950 text-zinc-200 select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImportImage}
        className="hidden"
      />

      {/* Left Tools & Palette Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-800/80 p-3 flex flex-col justify-between flex-shrink-0 overflow-y-auto custom-scrollbar space-y-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-purple-400">
              <PenTool className="w-4 h-4" />
              <span>Drawing & Inking Studio</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Frame {activeFrameIdx + 1}/{frames.length}
            </span>
          </div>

          {/* Tools Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Brushes & Tools
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'brush', label: 'Brush', icon: Paintbrush },
                { id: 'pen', label: 'Ink Pen', icon: PenTool },
                { id: 'pencil', label: 'Pencil', icon: Minus },
                { id: 'marker', label: 'Marker', icon: Paintbrush },
                { id: 'eraser', label: 'Eraser', icon: Eraser },
                { id: 'fill', label: 'Fill', icon: Sparkles },
                { id: 'eyedropper', label: 'Pick', icon: Pipette },
                { id: 'line', label: 'Line', icon: Minus },
                { id: 'rectangle', label: 'Rect', icon: Square },
                { id: 'circle', label: 'Circle', icon: Circle },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTool(t.id as Tool)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-purple-950/80 border-purple-600 text-purple-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                    title={t.label}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[9px] font-medium truncate w-full text-center">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Palette */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Color Palette
            </span>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-zinc-300 uppercase">{color}</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[
                '#000000', '#FFFFFF', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
                '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#71717A', '#3F3F46',
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border transition-transform ${
                    color.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 border-white shadow-sm'
                      : 'border-zinc-800 hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Stroke Size & Opacity */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>Stroke Width</span>
                <span className="font-mono text-zinc-300">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-zinc-300">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Transforms & Symmetry */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800">
            <span className="text-[10px] font-bold uppercase text-zinc-400 block">
              Transforms & Guides
            </span>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <button
                onClick={() => handleFlip('horizontal')}
                className="py-1 px-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1 text-zinc-300"
              >
                <FlipHorizontal className="w-3 h-3" />
                <span>Flip H</span>
              </button>
              <button
                onClick={() => handleFlip('vertical')}
                className="py-1 px-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1 text-zinc-300"
              >
                <FlipVertical className="w-3 h-3" />
                <span>Flip V</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-1 px-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center gap-1 text-purple-300"
              >
                <Upload className="w-3 h-3" />
                <span>Import</span>
              </button>
            </div>
          </div>

          {/* Save As Character Reference */}
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold uppercase text-purple-400 block">
              Save as Character Reference
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedCharacterId}
                onChange={(e) => setSelectedCharacterId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-200"
              >
                {project.characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={referenceViewType}
                onChange={(e) => setReferenceViewType(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-200"
              >
                {(['Front', 'Back', 'Left', 'Right', '3/4', 'Close-up'] as const).map((v) => (
                  <option key={v} value={v}>
                    {v} View
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSaveAsCharacterReference}
              className="w-full py-1.5 bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-200 rounded text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-purple-400" />
              <span>Save Reference Sheet</span>
            </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-1.5 pt-2 border-t border-zinc-800">
          <button
            onClick={handleApplyToShot}
            className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-purple-950 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Apply to Shot {activeShot?.shotNumber}</span>
          </button>

          <button
            onClick={handleClearCanvas}
            className="w-full py-1.5 bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-300 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Frame</span>
          </button>
        </div>
      </div>

      {/* Main Center: Drawing Canvas, Onion Skin Underlay, and Animation Timeline Ribbon */}
      <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 p-3 space-y-2">
        {toastMessage && (
          <div className="bg-purple-950/90 border border-purple-600 text-purple-200 px-3 py-1.5 rounded text-xs flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Control Bar: Undo, Guides, and ONION SKIN CONTROLS */}
        <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="p-1 hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
              title="Undo Stroke"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <span className="text-zinc-600">·</span>
            <button
              onClick={() => setShowGuides(!showGuides)}
              className={`p-1 rounded flex items-center gap-1 transition-colors ${
                showGuides ? 'text-purple-300 bg-purple-950' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Proportions Guide</span>
            </button>
          </div>

          {/* Onion Skinning Controls Group */}
          <div className="flex items-center gap-2 relative">
            {/* Master Onion Skin Toggle */}
            <button
              onClick={() => {
                const nextState = !onionSettings.enabled;
                const next = { ...onionSettings, enabled: nextState };
                setOnionSettings(next);
                onUpdateProject((p) => ({ ...p, onionSkinSettings: next }));
                showNotification(`Onion Skin ${nextState ? 'ENABLED' : 'DISABLED'}`);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs border font-semibold transition-all cursor-pointer ${
                onionSettings.enabled
                  ? 'bg-purple-950 border-purple-600 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
              title="Toggle Multi-Frame Onion Skinning"
            >
              <Eye className={`w-3.5 h-3.5 ${onionSettings.enabled ? 'text-purple-400' : 'text-zinc-500'}`} />
              <span>ONION SKIN: {onionSettings.enabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Onion Skin Quick Details & Drawer Toggle */}
            {onionSettings.enabled && (
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: onionSettings.prevTint }} />
                  <span className="text-zinc-400 font-mono">-{onionSettings.framesBefore}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: onionSettings.nextTint }} />
                  <span className="text-zinc-400 font-mono">+{onionSettings.framesAfter}</span>
                </div>
                <span className="text-zinc-500 font-mono">
                  {Math.round(onionSettings.opacity * 100)}%
                </span>
                <button
                  onClick={() => setShowOnionPanel(!showOnionPanel)}
                  className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded cursor-pointer"
                  title="Configure Onion Skin Parameters"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={handleDownloadArtwork}
              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-xs text-zinc-300 transition-colors cursor-pointer"
              title="Download pure frame stroke artwork (without ghost images)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PNG</span>
            </button>

            {/* Expandable Onion Skin Parameters Flyout Panel */}
            {showOnionPanel && (
              <div className="absolute right-0 top-9 w-80 bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-2xl z-30 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-xs font-bold text-zinc-200">
                  <div className="flex items-center gap-1.5 text-purple-400">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Onion Skin Configuration</span>
                  </div>
                  <button
                    onClick={handleResetOnionSkin}
                    className="text-[10px] text-zinc-500 hover:text-purple-300 flex items-center gap-1"
                    title="Reset to defaults"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Frames Before / After Count */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                      <span>Previous Frames:</span>
                      <span className="font-mono text-purple-300">{onionSettings.framesBefore}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={onionSettings.framesBefore}
                      onChange={(e) => {
                        const next = { ...onionSettings, framesBefore: parseInt(e.target.value) };
                        setOnionSettings(next);
                      }}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                      <span>Next Frames:</span>
                      <span className="font-mono text-purple-300">{onionSettings.framesAfter}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={onionSettings.framesAfter}
                      onChange={(e) => {
                        const next = { ...onionSettings, framesAfter: parseInt(e.target.value) };
                        setOnionSettings(next);
                      }}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>

                {/* Frame Step / Increment */}
                <div className="text-xs space-y-1">
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Frame Step / Increment:</span>
                    <span className="font-mono text-purple-300">
                      Step {onionSettings.step || 1} {onionSettings.step === 2 ? '(Keys only)' : '(Consecutive)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <button
                      onClick={() => setOnionSettings({ ...onionSettings, step: 1 })}
                      className={`py-1 rounded border text-center font-mono ${
                        (onionSettings.step || 1) === 1
                          ? 'bg-purple-950 border-purple-600 text-purple-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Step 1 (All)
                    </button>
                    <button
                      onClick={() => setOnionSettings({ ...onionSettings, step: 2 })}
                      className={`py-1 rounded border text-center font-mono ${
                        onionSettings.step === 2
                          ? 'bg-purple-950 border-purple-600 text-purple-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                      }`}
                    >
                      Step 2 (Keys)
                    </button>
                  </div>
                </div>

                {/* Opacity Controls */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-zinc-400 text-[11px] mb-1">
                      <span>Master Ghost Opacity:</span>
                      <span className="font-mono text-purple-300">{Math.round(onionSettings.opacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={onionSettings.opacity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setOnionSettings({ ...onionSettings, opacity: val, prevOpacity: val, nextOpacity: val });
                      }}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Prev Ghost Opacity</span>
                      <input
                        type="range"
                        min="0.05"
                        max="1.0"
                        step="0.05"
                        value={onionSettings.prevOpacity ?? onionSettings.opacity}
                        onChange={(e) => setOnionSettings({ ...onionSettings, prevOpacity: parseFloat(e.target.value) })}
                        className="w-full accent-red-500"
                      />
                    </div>
                    <div>
                      <span className="text-zinc-500 block mb-0.5">Next Ghost Opacity</span>
                      <input
                        type="range"
                        min="0.05"
                        max="1.0"
                        step="0.05"
                        value={onionSettings.nextOpacity ?? onionSettings.opacity}
                        onChange={(e) => setOnionSettings({ ...onionSettings, nextOpacity: parseFloat(e.target.value) })}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Color-Coded Tints */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-800 text-[11px]">
                  <div>
                    <span className="text-zinc-400 block mb-1">Previous Tint:</span>
                    <div className="flex items-center gap-1">
                      {['#EF4444', '#F97316', '#F59E0B', '#A1A1AA'].map((c) => (
                        <button
                          key={c}
                          onClick={() => setOnionSettings({ ...onionSettings, prevTint: c })}
                          className={`w-5 h-5 rounded-full border ${onionSettings.prevTint === c ? 'border-white scale-110' : 'border-zinc-800'}`}
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
                          onClick={() => setOnionSettings({ ...onionSettings, nextTint: c })}
                          className={`w-5 h-5 rounded-full border ${onionSettings.nextTint === c ? 'border-white scale-110' : 'border-zinc-800'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Viewport Container: Canvas Stack */}
        <div className="flex-1 bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden flex items-center justify-center relative p-2">
          {/* Anatomy Proportions Guide Overlay */}
          {showGuides && (
            <div className="absolute inset-4 pointer-events-none z-20 flex flex-col justify-between border border-purple-500/30">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-purple-500/40 border-r border-dashed border-purple-400/50" />
              {['Head (1/8)', 'Chest (2/8)', 'Waist (3/8)', 'Hips (4/8)', 'Mid-Thigh (5/8)', 'Knees (6/8)', 'Calves (7/8)', 'Feet (8/8)'].map(
                (label, idx) => (
                  <div key={idx} className="border-b border-purple-500/20 text-[8px] font-mono text-purple-400/50 pl-2 pt-0.5">
                    {label}
                  </div>
                )
              )}
            </div>
          )}

          {/* Symmetrical Mirror Line */}
          {symmetryMode === 'vertical' && (
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-pink-500/50 pointer-events-none z-20 shadow-[0_0_8px_rgba(236,72,153,0.5)]" />
          )}

          {/* CANVAS STACK:
              1. ghostCanvasRef: Renders all previous and upcoming ghost frames with distance attenuation & tints.
                 NEVER receives mouse events. NEVER saved into user strokes.
              2. canvasRef: Real interactive drawing canvas where user draws normally.
          */}
          <div className="relative max-h-[76vh] max-w-full aspect-video flex items-center justify-center shadow-2xl">
            {/* UNDERLAY: Real Multi-Frame Onion Skin Canvas */}
            <canvas
              ref={ghostCanvasRef}
              width={1280}
              height={720}
              className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-lg select-none"
            />

            {/* FOREGROUND: Active Drawing Surface */}
            <canvas
              ref={canvasRef}
              width={1280}
              height={720}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => {
                isDrawing.current = false;
              }}
              className="relative z-10 w-full h-full bg-zinc-950/30 border border-zinc-800 rounded-lg cursor-crosshair select-none"
            />
          </div>
        </div>

        {/* BOTTOM: Professional Animation Frame Ribbon & Timeline */}
        <div className="h-16 bg-zinc-950 border border-zinc-800/80 rounded-lg px-3 py-1.5 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Playback & Step Controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setIsPlayingFrames(!isPlayingFrames)}
              className={`p-2 rounded-lg border font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                isPlayingFrames
                  ? 'bg-purple-950 border-purple-600 text-purple-200 shadow-sm'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
              title="Play/Pause Frame Playback (Space)"
            >
              {isPlayingFrames ? <Pause className="w-3.5 h-3.5 fill-purple-400" /> : <Play className="w-3.5 h-3.5 fill-zinc-300" />}
              <span>{isPlayingFrames ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={() => handleSelectFrame(Math.max(0, activeFrameIdx - 1))}
              disabled={activeFrameIdx <= 0}
              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer"
              title="Step to Previous Frame (A)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleSelectFrame(Math.min(frames.length - 1, activeFrameIdx + 1))}
              disabled={activeFrameIdx >= frames.length - 1}
              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 cursor-pointer"
              title="Step to Next Frame (D)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Horizontal Frames Strip */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1 px-2">
            {frames.map((frame, idx) => {
              const isActive = idx === activeFrameIdx;
              const hasDrawing = Boolean(frame.layers['layer_body'] || frame.layers['layer_2']);

              return (
                <div
                  key={frame.id}
                  onClick={() => handleSelectFrame(idx)}
                  className={`flex-shrink-0 w-16 h-12 rounded border p-1 flex flex-col justify-between cursor-pointer transition-all ${
                    isActive
                      ? 'bg-purple-950/80 border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono">
                    <span className={isActive ? 'text-purple-300 font-bold' : 'text-zinc-500'}>
                      #{idx + 1}
                    </span>
                    {hasDrawing && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Has Drawn Artwork" />
                    )}
                  </div>
                  <div className="text-[8px] font-mono text-center text-zinc-500 truncate">
                    {isActive ? 'CURRENT' : idx < activeFrameIdx ? 'PREV' : 'NEXT'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Frame Actions: Add, In-Between, Duplicate, Delete */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleInsertInBetween}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-xs font-semibold cursor-pointer"
              title="Insert In-Between Frame for Smooth Transition"
            >
              <Plus className="w-3.5 h-3.5 text-purple-400" />
              <span>In-Between</span>
            </button>

            <button
              onClick={handleDuplicateFrame}
              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
              title="Duplicate Current Frame"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleAddFrame}
              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 cursor-pointer"
              title="Add New Blank Frame"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleDeleteFrame(activeFrameIdx)}
              disabled={frames.length <= 1}
              className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-300 disabled:opacity-40 cursor-pointer"
              title="Delete Active Frame"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
