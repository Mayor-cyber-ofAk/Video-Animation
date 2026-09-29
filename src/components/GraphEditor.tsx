import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Plus,
  Trash2,
  Camera,
  Layers,
  Volume2,
  User,
  Eye,
  EyeOff,
  Move,
  CornerDownRight,
} from 'lucide-react';
import {
  Project,
  Keyframe,
  InterpolationType,
  AnimProperty,
  TimelineTrack,
} from '../types/studio';
import { evaluateEasing, interpolateKeyframes } from '../services/animationEngine';

interface GraphEditorProps {
  project: Project;
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onClose: () => void;
  initialProperty?: AnimProperty;
}

interface ChannelDef {
  prop: AnimProperty;
  label: string;
  category: 'camera' | 'transform' | 'audio' | 'vfx';
  color: string;
  defaultVal: number;
  minVal: number;
  maxVal: number;
  unit: string;
}

const ALL_CHANNELS: ChannelDef[] = [
  // Camera channels
  { prop: 'cameraPanX', label: 'Camera Pan X', category: 'camera', color: '#EF4444', defaultVal: 0, minVal: -100, maxVal: 100, unit: 'px' },
  { prop: 'cameraPanY', label: 'Camera Pan Y', category: 'camera', color: '#F97316', defaultVal: 0, minVal: -100, maxVal: 100, unit: 'px' },
  { prop: 'cameraZoom', label: 'Camera Zoom / Lens', category: 'camera', color: '#3B82F6', defaultVal: 35, minVal: 18, maxVal: 135, unit: 'mm' },
  { prop: 'cameraTilt', label: 'Camera Tilt', category: 'camera', color: '#06B6D4', defaultVal: 0, minVal: -45, maxVal: 45, unit: '°' },
  { prop: 'cameraRoll', label: 'Camera Roll / Dutch', category: 'camera', color: '#8B5CF6', defaultVal: 0, minVal: -90, maxVal: 90, unit: '°' },
  { prop: 'cameraFocusDistance', label: 'Focus Distance', category: 'camera', color: '#EC4899', defaultVal: 50, minVal: 0, maxVal: 100, unit: '%' },
  { prop: 'cameraShake', label: 'Shake Intensity', category: 'camera', color: '#F59E0B', defaultVal: 0, minVal: 0, maxVal: 1, unit: '' },

  // Transform channels
  { prop: 'positionX', label: 'Position X', category: 'transform', color: '#10B981', defaultVal: 50, minVal: 0, maxVal: 100, unit: '%' },
  { prop: 'positionY', label: 'Position Y', category: 'transform', color: '#14B8A6', defaultVal: 50, minVal: 0, maxVal: 100, unit: '%' },
  { prop: 'scale', label: 'Scale Uniform', category: 'transform', color: '#84CC16', defaultVal: 1.0, minVal: 0.1, maxVal: 4.0, unit: 'x' },
  { prop: 'rotation', label: 'Rotation Z', category: 'transform', color: '#EAB308', defaultVal: 0, minVal: -360, maxVal: 360, unit: '°' },
  { prop: 'opacity', label: 'Opacity', category: 'transform', color: '#6366F1', defaultVal: 1.0, minVal: 0, maxVal: 1, unit: '' },

  // Audio / VFX channels
  { prop: 'volume', label: 'Audio Volume', category: 'audio', color: '#D946EF', defaultVal: 1.0, minVal: 0, maxVal: 1, unit: '' },
  { prop: 'vfxIntensity', label: 'VFX / Atmosphere', category: 'vfx', color: '#F43F5E', defaultVal: 0.8, minVal: 0, maxVal: 1, unit: '' },
];

const CURVE_PRESETS: {
  id: InterpolationType;
  label: string;
  desc: string;
  handles?: [number, number, number, number];
}[] = [
  { id: 'linear', label: 'Linear', desc: 'Mechanical, constant rate of change' },
  { id: 'ease-in', label: 'Ease In', desc: 'Slow acceleration into high speed' },
  { id: 'ease-out', label: 'Ease Out', desc: 'High speed decelerating to a gentle stop' },
  { id: 'ease-in-out', label: 'Ease In + Out', desc: 'Smooth acceleration and smooth deceleration' },
  { id: 'smooth', label: 'Smoothstep', desc: 'Organic S-curve bell transition' },
  { id: 'step', label: 'Step / Hold', desc: 'Instantaneous snap at keyframe boundary' },
  { id: 'bezier', label: 'Anime Snap', desc: 'Aggressive acceleration with rapid snap', handles: [0.05, 0.95, 0.15, 1.0] },
  { id: 'bezier', label: 'Cinematic Push', desc: 'Slow cinematic crawl into smooth finish', handles: [0.35, 0.05, 0.25, 1.0] },
  { id: 'bezier', label: 'Anticipation', desc: 'Slight reverse recoil before forward burst', handles: [0.36, -0.3, 0.24, 1.3] },
];

export const GraphEditor: React.FC<GraphEditorProps> = ({
  project,
  currentTime,
  onSeek,
  onUpdateProject,
  onClose,
  initialProperty = 'cameraPanX',
}) => {
  const [selectedProp, setSelectedProp] = useState<AnimProperty>(initialProperty);
  const [visibleProps, setVisibleProps] = useState<Set<AnimProperty>>(
    new Set(['cameraPanX', 'cameraPanY', 'cameraZoom', 'positionX', 'scale'])
  );
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [graphMode, setGraphMode] = useState<'value' | 'speed'>('value');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedHandles, setCopiedHandles] = useState<[number, number, number, number] | null>(null);
  const [copiedEasing, setCopiedEasing] = useState<InterpolationType | null>(null);

  // Viewport Zoom & Pan state
  const [timeZoom, setTimeZoom] = useState(30); // pixels per second
  const [timeOffset, setTimeOffset] = useState(0); // seconds from start
  const [valueZoom, setValueZoom] = useState(1.0); // value scale multiplier
  const [valueOffset, setValueOffset] = useState(0); // value vertical shift

  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingKeyframe = useRef(false);
  const isDraggingHandle = useRef<1 | 2 | null>(null);
  const isScrubbingPlayhead = useRef(false);
  const isPanningCanvas = useRef(false);
  const panStart = useRef({ x: 0, y: 0, timeOffset: 0, valueOffset: 0 });

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const totalDuration = activeScene?.shots.reduce((acc, s) => acc + s.duration, 0) || 40;

  const currentChannel = ALL_CHANNELS.find((c) => c.prop === selectedProp) || ALL_CHANNELS[0];

  // Collect all keyframes for a property across all timeline tracks
  const getKeyframesForProp = (prop: AnimProperty): { kf: Keyframe; trackId: string }[] => {
    const list: { kf: Keyframe; trackId: string }[] = [];
    project.timelineTracks.forEach((track) => {
      (track.keyframes || []).forEach((kf) => {
        if (kf.property === prop) {
          list.push({ kf, trackId: track.id });
        }
      });
    });
    return list.sort((a, b) => a.kf.time - b.kf.time);
  };

  const activeKeyframesWithTracks = useMemo(() => {
    return getKeyframesForProp(selectedProp);
  }, [project.timelineTracks, selectedProp]);

  const activeKeyframes = useMemo(() => {
    return activeKeyframesWithTracks.map((k) => k.kf);
  }, [activeKeyframesWithTracks]);

  const selectedKfObj = activeKeyframesWithTracks.find((k) => k.kf.id === selectedKeyframeId);

  // SVG Dimension Constants
  const width = 850;
  const height = 400;
  const paddingLeft = 60;
  const paddingBottom = 40;
  const plotWidth = width - paddingLeft - 20;
  const plotHeight = height - paddingBottom - 20;

  // Coordinate Conversion: Time/Value -> SVG Pixels
  const timeToSvgX = (t: number) => {
    return paddingLeft + ((t - timeOffset) * timeZoom);
  };

  const svgXToTime = (x: number) => {
    return timeOffset + ((x - paddingLeft) / timeZoom);
  };

  const valToSvgY = (v: number) => {
    const min = currentChannel.minVal;
    const max = currentChannel.maxVal;
    const span = max - min || 1;
    const norm = (v - min + valueOffset) / span;
    const scaledNorm = 0.5 + (norm - 0.5) * valueZoom;
    return height - paddingBottom - (scaledNorm * plotHeight);
  };

  const svgYToVal = (y: number) => {
    const min = currentChannel.minVal;
    const max = currentChannel.maxVal;
    const span = max - min || 1;
    const scaledNorm = (height - paddingBottom - y) / plotHeight;
    const norm = 0.5 + (scaledNorm - 0.5) / valueZoom;
    return min + norm * span - valueOffset;
  };

  // Auto-frame all active keyframes
  const handleFrameSelected = () => {
    if (activeKeyframes.length === 0) {
      setTimeZoom(plotWidth / Math.max(1, totalDuration));
      setTimeOffset(0);
      setValueZoom(1.0);
      setValueOffset(0);
      return;
    }
    const times = activeKeyframes.map((k) => k.time);
    const minTime = Math.max(0, Math.min(...times) - 1);
    const maxTime = Math.min(totalDuration, Math.max(...times) + 1);
    const timeSpan = Math.max(2, maxTime - minTime);

    setTimeOffset(minTime);
    setTimeZoom(plotWidth / timeSpan);
    setValueZoom(1.0);
    setValueOffset(0);
  };

  // Add Keyframe on current channel at playhead
  const handleAddKeyframeAtPlayhead = () => {
    const targetTrack = project.timelineTracks.find((t) =>
      currentChannel.category === 'camera' ? t.type === 'camera' : true
    ) || project.timelineTracks[0];

    const currentVal = interpolateKeyframes(activeKeyframes, currentTime, currentChannel.defaultVal);

    const newKf: Keyframe = {
      id: `kf_${Date.now()}`,
      property: selectedProp,
      time: Math.round(currentTime * 100) / 100,
      value: Math.round(currentVal * 10) / 10,
      easing: 'ease-in-out',
      bezierHandles: [0.25, 0.1, 0.25, 1.0],
    };

    onUpdateProject((prev) => ({
      ...prev,
      timelineTracks: prev.timelineTracks.map((t) =>
        t.id === targetTrack.id
          ? { ...t, keyframes: [...(t.keyframes || []), newKf] }
          : t
      ),
    }));

    setSelectedKeyframeId(newKf.id);
  };

  // Delete selected keyframe
  const handleDeleteKeyframe = () => {
    if (!selectedKeyframeId) return;
    onUpdateProject((prev) => ({
      ...prev,
      timelineTracks: prev.timelineTracks.map((t) => ({
        ...t,
        keyframes: (t.keyframes || []).filter((k) => k.id !== selectedKeyframeId),
      })),
    }));
    setSelectedKeyframeId(null);
  };

  // Update specific keyframe attributes
  const handleUpdateKeyframe = (kfId: string, updates: Partial<Keyframe>) => {
    onUpdateProject((prev) => ({
      ...prev,
      timelineTracks: prev.timelineTracks.map((t) => ({
        ...t,
        keyframes: (t.keyframes || []).map((k) =>
          k.id === kfId ? { ...k, ...updates } : k
        ),
      })),
    }));
  };

  // Change curve easing preset
  const handleApplyPreset = (preset: typeof CURVE_PRESETS[0]) => {
    if (!selectedKeyframeId) return;
    handleUpdateKeyframe(selectedKeyframeId, {
      easing: preset.id,
      bezierHandles: preset.handles || [0.25, 0.1, 0.25, 1.0],
    });
  };

  // Copy curve settings
  const handleCopyCurve = () => {
    if (!selectedKfObj) return;
    setCopiedHandles(selectedKfObj.kf.bezierHandles || [0.25, 0.1, 0.25, 1.0]);
    setCopiedEasing(selectedKfObj.kf.easing);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Paste curve settings
  const handlePasteCurve = () => {
    if (!selectedKeyframeId || !copiedEasing) return;
    handleUpdateKeyframe(selectedKeyframeId, {
      easing: copiedEasing,
      bezierHandles: copiedHandles || [0.25, 0.1, 0.25, 1.0],
    });
  };

  // Reset curve to default smooth ease-in-out
  const handleResetCurve = () => {
    if (!selectedKeyframeId) return;
    handleUpdateKeyframe(selectedKeyframeId, {
      easing: 'ease-in-out',
      bezierHandles: [0.25, 0.1, 0.25, 1.0],
    });
  };

  // Pointer Handlers for Interactive Graph Dragging
  const handlePointerDownCanvas = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.altKey) {
      // Middle click or Alt+Drag to pan canvas
      isPanningCanvas.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        timeOffset,
        valueOffset,
      };
      (e.target as Element).setPointerCapture(e.pointerId);
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left;

    // Click on timeline ruler area (bottom) to scrub playhead
    if (sx >= paddingLeft && sx <= width - 20) {
      const clickedTime = Math.max(0, Math.min(totalDuration, svgXToTime(sx)));
      onSeek(Math.round(clickedTime * 100) / 100);
      isScrubbingPlayhead.current = true;
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanningCanvas.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTimeOffset(Math.max(0, panStart.current.timeOffset - dx / timeZoom));
      setValueOffset(panStart.current.valueOffset + (dy / plotHeight) * (currentChannel.maxVal - currentChannel.minVal));
      return;
    }

    if (isScrubbingPlayhead.current && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const clickedTime = Math.max(0, Math.min(totalDuration, svgXToTime(sx)));
      onSeek(Math.round(clickedTime * 100) / 100);
      return;
    }

    if (isDraggingKeyframe.current && selectedKeyframeId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const newTime = Math.max(0, Math.min(totalDuration, svgXToTime(sx)));
      const rawVal = svgYToVal(sy);
      const newVal = Math.max(currentChannel.minVal, Math.min(currentChannel.maxVal, rawVal));

      handleUpdateKeyframe(selectedKeyframeId, {
        time: Math.round(newTime * 50) / 50,
        value: Math.round(newVal * 10) / 10,
      });
      return;
    }

    if (isDraggingHandle.current && selectedKfObj && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const kfX = timeToSvgX(selectedKfObj.kf.time);
      const kfY = valToSvgY(selectedKfObj.kf.value);

      // Relative offset normalized [0, 1]
      const deltaX = Math.max(0.01, Math.min(1.0, Math.abs(sx - kfX) / (timeZoom * 2)));
      const deltaY = Math.max(-0.5, Math.min(1.5, (kfY - sy) / 100));

      const cur = selectedKfObj.kf.bezierHandles || [0.25, 0.1, 0.25, 1.0];
      let updated: [number, number, number, number];

      if (isDraggingHandle.current === 1) {
        updated = [deltaX, deltaY, cur[2], cur[3]];
      } else {
        updated = [cur[0], cur[1], deltaX, deltaY];
      }

      handleUpdateKeyframe(selectedKfObj.kf.id, {
        easing: 'bezier',
        bezierHandles: updated,
      });
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent<SVGSVGElement>) => {
    isPanningCanvas.current = false;
    isScrubbingPlayhead.current = false;
    isDraggingKeyframe.current = false;
    isDraggingHandle.current = null;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Generate SVG Path String for a given property curve
  const generateCurvePath = (prop: AnimProperty) => {
    const kfs = getKeyframesForProp(prop).map((k) => k.kf);
    if (kfs.length === 0) {
      // Flat line at default
      const def = ALL_CHANNELS.find((c) => c.prop === prop)?.defaultVal || 0;
      const y = valToSvgY(def);
      return `M ${timeToSvgX(0)} ${y} L ${timeToSvgX(totalDuration)} ${y}`;
    }

    const segments: string[] = [];
    const stepSeconds = Math.max(0.05, 1 / (timeZoom * 0.8)); // adaptive sampling

    let first = true;
    for (let t = 0; t <= totalDuration; t += stepSeconds) {
      const v = interpolateKeyframes(kfs, t, kfs[0]?.value ?? 0);
      const px = timeToSvgX(t);
      const py = valToSvgY(v);

      if (first) {
        segments.push(`M ${px} ${py}`);
        first = false;
      } else {
        segments.push(`L ${px} ${py}`);
      }
    }

    return segments.join(' ');
  };

  // Calculate speed / velocity curve (derivative dV/dt)
  const generateSpeedPath = () => {
    if (activeKeyframes.length === 0) return '';
    const segments: string[] = [];
    const dt = 0.05;
    let first = true;

    for (let t = 0; t <= totalDuration; t += dt) {
      const v1 = interpolateKeyframes(activeKeyframes, t, activeKeyframes[0]?.value ?? 0);
      const v2 = interpolateKeyframes(activeKeyframes, t + dt, activeKeyframes[0]?.value ?? 0);
      const speed = Math.abs(v2 - v1) / dt;

      const px = timeToSvgX(t);
      const py = height - paddingBottom - Math.min(plotHeight - 10, speed * 2.5);

      if (first) {
        segments.push(`M ${px} ${py}`);
        first = false;
      } else {
        segments.push(`L ${px} ${py}`);
      }
    }
    return segments.join(' ');
  };

  // Evaluated value at current playhead
  const evaluatedCurrentValue = useMemo(() => {
    return interpolateKeyframes(activeKeyframes, currentTime, currentChannel.defaultVal);
  }, [activeKeyframes, currentTime, currentChannel]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Bar */}
        <div className="h-12 px-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Motion Curves & Graph Editor
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono">
              Professional Animation Curves
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Value vs Speed Graph Switch */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setGraphMode('value')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  graphMode === 'value'
                    ? 'bg-purple-900/70 text-purple-200 border border-purple-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Value Curve
              </button>
              <button
                onClick={() => setGraphMode('speed')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  graphMode === 'speed'
                    ? 'bg-purple-900/70 text-purple-200 border border-purple-700/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Velocity / Speed
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Close Graph Editor (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Channels & Animatable Properties Hierarchy */}
          <div className="w-64 border-r border-zinc-800/80 bg-zinc-950 p-2.5 flex flex-col justify-between flex-shrink-0 overflow-y-auto custom-scrollbar">
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Animation Channels</span>
                <span className="text-zinc-600 font-mono text-[10px]">
                  {ALL_CHANNELS.length} Props
                </span>
              </div>

              {/* Grouped by Category */}
              {(['camera', 'transform', 'audio', 'vfx'] as const).map((cat) => {
                const channels = ALL_CHANNELS.filter((c) => c.category === cat);
                const catLabel =
                  cat === 'camera'
                    ? 'Cinematic Camera'
                    : cat === 'transform'
                    ? 'Transforms & Spatial'
                    : cat === 'audio'
                    ? 'Audio & Dialogue'
                    : 'VFX & Atmosphere';

                return (
                  <div key={cat} className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 px-1.5">
                      {catLabel}
                    </span>
                    <div className="space-y-0.5">
                      {channels.map((chan) => {
                        const isSelected = selectedProp === chan.prop;
                        const isVisible = visibleProps.has(chan.prop);
                        const kfCount = getKeyframesForProp(chan.prop).length;

                        return (
                          <div
                            key={chan.prop}
                            onClick={() => setSelectedProp(chan.prop)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-950/70 border border-purple-700/60 text-purple-200'
                                : 'hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: chan.color }}
                              />
                              <span className="truncate">{chan.label}</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {kfCount > 0 && (
                                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-300">
                                  {kfCount}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVisibleProps((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(chan.prop)) next.delete(chan.prop);
                                    else next.add(chan.prop);
                                    return next;
                                  });
                                }}
                                className="text-zinc-500 hover:text-zinc-300 p-0.5"
                                title={isVisible ? 'Hide Curve' : 'Show Curve'}
                              >
                                {isVisible ? (
                                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-zinc-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Channel Readout */}
            <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] space-y-1 mt-2">
              <div className="flex items-center justify-between text-zinc-400 font-mono">
                <span>Current Value:</span>
                <span className="text-purple-300 font-semibold">
                  {evaluatedCurrentValue.toFixed(1)} {currentChannel.unit}
                </span>
              </div>
              <div className="flex items-center justify-between text-zinc-500 font-mono text-[10px]">
                <span>Playhead:</span>
                <span>{currentTime.toFixed(2)}s</span>
              </div>
            </div>
          </div>

          {/* Right Center: Graph Canvas & Curve Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
            {/* Graph Toolbar */}
            <div className="h-10 px-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 flex-shrink-0">
              {/* Easing & Curve Presets */}
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar py-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1">
                  Easing:
                </span>
                {CURVE_PRESETS.map((p) => {
                  const isActive = selectedKfObj?.kf.easing === p.id && (!p.handles || selectedKfObj?.kf.bezierHandles);
                  return (
                    <button
                      key={p.label}
                      onClick={() => handleApplyPreset(p)}
                      disabled={!selectedKeyframeId}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-purple-950 border border-purple-600 text-purple-200'
                          : 'bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-40'
                      }`}
                      title={p.desc}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Curve Operations */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleAddKeyframeAtPlayhead}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-purple-950 hover:bg-purple-900 border border-purple-700/60 text-purple-200 text-[11px] font-semibold transition-colors cursor-pointer"
                  title="Add Keyframe on Selected Channel at Playhead"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Keyframe</span>
                </button>

                <button
                  onClick={handleDeleteKeyframe}
                  disabled={!selectedKeyframeId}
                  className="p-1 rounded bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-400 hover:text-rose-300 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Delete Selected Keyframe"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleCopyCurve}
                  disabled={!selectedKeyframeId}
                  className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Copy Curve Easing Settings"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handlePasteCurve}
                  disabled={!selectedKeyframeId || !copiedEasing}
                  className="px-1.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 disabled:opacity-40 transition-colors text-[10px] font-mono cursor-pointer"
                  title="Paste Curve Settings"
                >
                  Paste
                </button>

                <button
                  onClick={handleResetCurve}
                  disabled={!selectedKeyframeId}
                  className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Reset Curve"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-zinc-800 mx-1" />

                <button
                  onClick={handleFrameSelected}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] transition-colors cursor-pointer"
                  title="Frame Selected Keyframes (Fit to Window)"
                >
                  <Crosshair className="w-3.5 h-3.5 text-purple-400" />
                  <span>Frame</span>
                </button>
              </div>
            </div>

            {/* Main Interactive SVG Graph Area */}
            <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center p-2">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full max-h-full bg-zinc-950/90 border border-zinc-900 rounded-lg shadow-inner cursor-crosshair select-none"
                onPointerDown={handlePointerDownCanvas}
                onPointerMove={handlePointerMoveCanvas}
                onPointerUp={handlePointerUpCanvas}
              >
                <defs>
                  {/* Subtle Grid Pattern */}
                  <pattern id="graph-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272A" strokeWidth="0.75" />
                  </pattern>
                  <linearGradient id="curve-glow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Background */}
                <rect x={paddingLeft} y={20} width={plotWidth} height={plotHeight} fill="url(#graph-grid-pattern)" />

                {/* Horizontal Value Axis & Center Line (0) */}
                <line
                  x1={paddingLeft}
                  y1={valToSvgY(0)}
                  x2={width - 20}
                  y2={valToSvgY(0)}
                  stroke="#3F3F46"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Value Axis Tick Labels */}
                {[-50, 0, 50, 100].map((v) => {
                  const y = valToSvgY(v);
                  if (y < 20 || y > height - paddingBottom) return null;
                  return (
                    <g key={v}>
                      <line x1={paddingLeft - 5} y1={y} x2={paddingLeft} y2={y} stroke="#52525B" strokeWidth="1" />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-zinc-500 font-mono text-[9px]"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* Time Axis Tick Labels */}
                {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }).map((_, i) => {
                  const t = i * 5;
                  const x = timeToSvgX(t);
                  if (x < paddingLeft || x > width - 20) return null;
                  return (
                    <g key={t}>
                      <line x1={x} y1={height - paddingBottom} x2={x} y2={height - paddingBottom + 5} stroke="#52525B" strokeWidth="1" />
                      <text
                        x={x}
                        y={height - paddingBottom + 16}
                        textAnchor="middle"
                        className="fill-zinc-500 font-mono text-[10px]"
                      >
                        {t}s
                      </text>
                    </g>
                  );
                })}

                {/* Visible Background Curves for Other Channels */}
                {Array.from(visibleProps).map((prop) => {
                  if (prop === selectedProp) return null;
                  const chan = ALL_CHANNELS.find((c) => c.prop === prop);
                  if (!chan) return null;
                  return (
                    <path
                      key={prop}
                      d={generateCurvePath(prop)}
                      fill="none"
                      stroke={chan.color}
                      strokeWidth="1.5"
                      strokeOpacity="0.4"
                    />
                  );
                })}

                {/* Active Selected Property Curve */}
                {graphMode === 'value' ? (
                  <path
                    d={generateCurvePath(selectedProp)}
                    fill="none"
                    stroke={currentChannel.color}
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all"
                  />
                ) : (
                  <path
                    d={generateSpeedPath()}
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                )}

                {/* Keyframe Nodes & Tangent Handles */}
                {activeKeyframes.map((kf) => {
                  const kfX = timeToSvgX(kf.time);
                  const kfY = valToSvgY(kf.value);
                  const isSelected = kf.id === selectedKeyframeId;

                  if (kfX < paddingLeft - 20 || kfX > width) return null;

                  // Tangent handles for selected keyframe
                  const handles = kf.bezierHandles || [0.25, 0.1, 0.25, 1.0];
                  const h1X = kfX - handles[0] * 70;
                  const h1Y = kfY + handles[1] * 50;
                  const h2X = kfX + handles[2] * 70;
                  const h2Y = kfY - handles[3] * 50;

                  return (
                    <g key={kf.id}>
                      {/* Tangent Handles (visible when keyframe selected) */}
                      {isSelected && (
                        <>
                          <line x1={kfX} y1={kfY} x2={h1X} y2={h1Y} stroke="#A855F7" strokeWidth="1.5" strokeDasharray="3 3" />
                          <line x1={kfX} y1={kfY} x2={h2X} y2={h2Y} stroke="#A855F7" strokeWidth="1.5" strokeDasharray="3 3" />
                          <circle
                            cx={h1X}
                            cy={h1Y}
                            r="5"
                            fill="#A855F7"
                            className="cursor-pointer hover:r-6 transition-all"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              isDraggingHandle.current = 1;
                              (e.target as Element).setPointerCapture(e.pointerId);
                            }}
                          />
                          <circle
                            cx={h2X}
                            cy={h2Y}
                            r="5"
                            fill="#A855F7"
                            className="cursor-pointer hover:r-6 transition-all"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              isDraggingHandle.current = 2;
                              (e.target as Element).setPointerCapture(e.pointerId);
                            }}
                          />
                        </>
                      )}

                      {/* Keyframe Diamond Marker */}
                      <g
                        transform={`translate(${kfX}, ${kfY}) rotate(45)`}
                        className="cursor-grab active:cursor-grabbing"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setSelectedKeyframeId(kf.id);
                          isDraggingKeyframe.current = true;
                          (e.target as Element).setPointerCapture(e.pointerId);
                        }}
                      >
                        <rect
                          x="-6"
                          y="-6"
                          width="12"
                          height="12"
                          fill={isSelected ? '#FACC15' : currentChannel.color}
                          stroke="#FFFFFF"
                          strokeWidth={isSelected ? '2' : '1'}
                          className="hover:scale-125 transition-transform"
                        />
                      </g>
                    </g>
                  );
                })}

                {/* Vertical Current Playhead Needle */}
                {(() => {
                  const playheadX = timeToSvgX(currentTime);
                  if (playheadX < paddingLeft || playheadX > width - 20) return null;
                  const currentValY = valToSvgY(evaluatedCurrentValue);

                  return (
                    <g>
                      <line
                        x1={playheadX}
                        y1={20}
                        x2={playheadX}
                        y2={height - paddingBottom}
                        stroke="#EF4444"
                        strokeWidth="2"
                        className="drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                      />
                      {/* Playhead Time Badge */}
                      <polygon
                        points={`${playheadX - 6},12 ${playheadX + 6},12 ${playheadX},20`}
                        fill="#EF4444"
                      />
                      {/* Intersecting Value Marker Dot */}
                      <circle
                        cx={playheadX}
                        cy={currentValY}
                        r="5"
                        fill="#EF4444"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </g>
                  );
                })()}
              </svg>

              {/* Lower Right Live Curve Response Preview Ball */}
              <div className="absolute bottom-4 right-4 bg-zinc-950/90 border border-zinc-800 rounded-lg p-2.5 shadow-xl flex items-center gap-3 pointer-events-none">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-zinc-500 tracking-wider">
                    Live Response
                  </span>
                  <span className="text-xs font-mono font-semibold text-purple-300">
                    {evaluatedCurrentValue.toFixed(1)} {currentChannel.unit}
                  </span>
                </div>
                {/* Visual displacement indicator */}
                <div className="w-16 h-8 bg-zinc-900 rounded border border-zinc-800 relative flex items-center justify-center overflow-hidden">
                  <div
                    className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-all duration-75"
                    style={{
                      transform: `translateX(${Math.max(-20, Math.min(20, (evaluatedCurrentValue / (currentChannel.maxVal || 1)) * 25))}px)`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Graph Status Bar */}
            <div className="h-8 px-4 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 flex-shrink-0 font-mono">
              <div className="flex items-center gap-3">
                <span>Hold Alt + Drag to Pan</span>
                <span>·</span>
                <span>Click Ruler to Scrub</span>
                <span>·</span>
                <span>Drag Tangents to Shape Acceleration</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400">
                <span>Selected: {selectedKfObj ? `T: ${selectedKfObj.kf.time.toFixed(2)}s, V: ${selectedKfObj.kf.value}` : 'None'}</span>
                <span>·</span>
                <span>Easing: {selectedKfObj?.kf.easing || 'Linear'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
