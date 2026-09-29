import React, { useState, useRef } from 'react';
import {
  Scissors,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Plus,
  Layers,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Diamond,
  Flag,
  Activity,
  Sliders,
  Sparkles,
  FastForward,
} from 'lucide-react';
import {
  Project,
  TimelineTrack,
  TimelineClip,
  Keyframe,
  AnimProperty,
  TimelineMarker,
  TimingSettings,
} from '../types/studio';
import { GraphEditor } from './GraphEditor';

interface TimelineProps {
  project: Project;
  currentTime: number;
  onSeek: (time: number) => void;
  onUpdateTracks: (tracks: TimelineTrack[]) => void;
  onSelectShot?: (shotId: string) => void;
  onUpdateProject?: (updater: (prev: Project) => Project) => void;
}

const DEFAULT_ANIMATABLE_PROPERTIES: { prop: AnimProperty; label: string; defaultVal: number }[] = [
  { prop: 'positionX', label: 'Position X', defaultVal: 50 },
  { prop: 'positionY', label: 'Position Y', defaultVal: 50 },
  { prop: 'scale', label: 'Scale', defaultVal: 1.0 },
  { prop: 'rotation', label: 'Rotation', defaultVal: 0 },
  { prop: 'opacity', label: 'Opacity', defaultVal: 1.0 },
  { prop: 'cameraZoom', label: 'Camera Zoom / Lens', defaultVal: 35 },
  { prop: 'cameraTilt', label: 'Camera Tilt', defaultVal: 0 },
  { prop: 'cameraFocusDistance', label: 'Focus Distance', defaultVal: 50 },
  { prop: 'volume', label: 'Audio Volume', defaultVal: 1.0 },
];

export const Timeline: React.FC<TimelineProps> = ({
  project,
  currentTime,
  onSeek,
  onUpdateTracks,
  onSelectShot,
  onUpdateProject,
}) => {
  const [zoomLevel, setZoomLevel] = useState(28); // pixels per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [selectedKeyframeTrackId, setSelectedKeyframeTrackId] = useState<string | null>(null);
  const [isSnapEnabled, setIsSnapEnabled] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showKeyframeLanes, setShowKeyframeLanes] = useState(true);
  const [activeAnimProp, setActiveAnimProp] = useState<AnimProperty>('positionX');
  const [isGraphEditorOpen, setIsGraphEditorOpen] = useState(false);
  const [editingKeyframe, setEditingKeyframe] = useState<Keyframe | null>(null);
  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const totalDuration = activeScene?.shots.reduce((acc, s) => acc + s.duration, 0) || 45;
  const timelineWidth = Math.max(900, totalDuration * zoomLevel + 250);

  const markers: TimelineMarker[] = project.timelineMarkers || [
    { id: 'm_1', time: 0, label: 'Scene Start', color: '#A855F7' },
    { id: 'm_2', time: 5, label: 'First Hit', color: '#EC4899' },
    { id: 'm_3', time: 14, label: 'Camera Push', color: '#38BDF8' },
  ];

  const timing: TimingSettings = project.timingSettings || {
    playbackSpeed: 1,
    fps: 24,
    holdExposure: 1,
    loopMode: 'loop',
  };

  // Find currently selected keyframe object across tracks
  const getSelectedKeyframe = (): { kf: Keyframe; trackId: string } | null => {
    if (!selectedKeyframeId) return null;
    for (const track of project.timelineTracks) {
      if (track.keyframes) {
        const found = track.keyframes.find((k) => k.id === selectedKeyframeId);
        if (found) return { kf: found, trackId: track.id };
      }
    }
    return null;
  };

  // Split active or selected clip at playhead
  const handleSplitClip = () => {
    if (!selectedClipId) return;
    const tracks = project.timelineTracks.map((track) => {
      const clipIdx = track.clips.findIndex((c) => c.id === selectedClipId);
      if (clipIdx === -1) return track;
      const clip = track.clips[clipIdx];
      if (currentTime <= clip.start || currentTime >= clip.start + clip.duration) {
        return track;
      }
      const firstDuration = currentTime - clip.start;
      const secondDuration = clip.duration - firstDuration;

      const clip1: TimelineClip = { ...clip, duration: firstDuration };
      const clip2: TimelineClip = {
        ...clip,
        id: `clip_${Date.now()}`,
        name: `${clip.name} (Part 2)`,
        start: currentTime,
        duration: secondDuration,
      };

      const updatedClips = [...track.clips];
      updatedClips.splice(clipIdx, 1, clip1, clip2);
      return { ...track, clips: updatedClips };
    });
    onUpdateTracks(tracks);
  };

  // Delete selected clip or keyframe
  const handleDeleteSelected = () => {
    if (selectedKeyframeId && selectedKeyframeTrackId) {
      const updated = project.timelineTracks.map((t) =>
        t.id === selectedKeyframeTrackId
          ? {
              ...t,
              keyframes: (t.keyframes || []).filter((k) => k.id !== selectedKeyframeId),
            }
          : t
      );
      onUpdateTracks(updated);
      setSelectedKeyframeId(null);
      return;
    }

    if (selectedClipId) {
      const tracks = project.timelineTracks.map((track) => ({
        ...track,
        clips: track.clips.filter((c) => c.id !== selectedClipId),
      }));
      onUpdateTracks(tracks);
      setSelectedClipId(null);
    }
  };

  // Duplicate selected clip or keyframe
  const handleDuplicateSelected = () => {
    if (selectedKeyframeId && selectedKeyframeTrackId) {
      const track = project.timelineTracks.find((t) => t.id === selectedKeyframeTrackId);
      const kf = track?.keyframes?.find((k) => k.id === selectedKeyframeId);
      if (kf && track) {
        const copy: Keyframe = {
          ...kf,
          id: `kf_${Date.now()}`,
          time: Math.min(totalDuration, kf.time + 0.5),
        };
        const updated = project.timelineTracks.map((t) =>
          t.id === track.id
            ? { ...t, keyframes: [...(t.keyframes || []), copy] }
            : t
        );
        onUpdateTracks(updated);
        setSelectedKeyframeId(copy.id);
      }
      return;
    }

    if (selectedClipId) {
      const tracks = project.timelineTracks.map((track) => {
        const clip = track.clips.find((c) => c.id === selectedClipId);
        if (!clip) return track;
        const copy: TimelineClip = {
          ...clip,
          id: `clip_${Date.now()}`,
          name: `${clip.name} Copy`,
          start: clip.start + clip.duration + 0.5,
        };
        return { ...track, clips: [...track.clips, copy] };
      });
      onUpdateTracks(tracks);
    }
  };

  // Add Keyframe at playhead for active track & animatable property
  const handleAddKeyframeAtPlayhead = (trackId: string) => {
    const track = project.timelineTracks.find((t) => t.id === trackId);
    if (!track) return;

    const propConfig = DEFAULT_ANIMATABLE_PROPERTIES.find((p) => p.prop === activeAnimProp);
    const val = propConfig ? propConfig.defaultVal : 0;

    const newKf: Keyframe = {
      id: `kf_${Date.now()}`,
      property: activeAnimProp,
      time: Math.round(currentTime * 10) / 10,
      value: val,
      easing: 'ease-in-out',
      bezierHandles: [0.25, 0.1, 0.25, 1.0],
    };

    const updated = project.timelineTracks.map((t) =>
      t.id === trackId
        ? {
            ...t,
            keyframes: [...(t.keyframes || []), newKf],
          }
        : t
    );
    onUpdateTracks(updated);
    setSelectedKeyframeId(newKf.id);
    setSelectedKeyframeTrackId(trackId);
  };

  // Add Marker at playhead
  const handleAddMarker = () => {
    if (!onUpdateProject) return;
    const colors = ['#A855F7', '#EC4899', '#38BDF8', '#10B981', '#F59E0B'];
    const newMarker: TimelineMarker = {
      id: `m_${Date.now()}`,
      time: Math.round(currentTime * 10) / 10,
      label: `Beat ${markers.length + 1}`,
      color: colors[markers.length % colors.length],
    };
    onUpdateProject((prev) => ({
      ...prev,
      timelineMarkers: [...(prev.timelineMarkers || []), newMarker],
    }));
  };

  // Update speed & timing
  const handleUpdateTiming = (updates: Partial<TimingSettings>) => {
    if (!onUpdateProject) return;
    onUpdateProject((prev) => ({
      ...prev,
      timingSettings: {
        ...(prev.timingSettings || timing),
        ...updates,
      },
    }));
  };

  // Handle timeline ruler click
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    let sec = clickX / zoomLevel;
    if (isSnapEnabled) {
      sec = Math.round(sec * 2) / 2; // snap to 0.5s
    }
    onSeek(Math.max(0, Math.min(totalDuration, sec)));
  };

  // Open Graph Editor for keyframe
  const handleOpenGraphEditor = (kf: Keyframe, trackId: string) => {
    setEditingKeyframe(kf);
    setSelectedKeyframeTrackId(trackId);
    setIsGraphEditorOpen(true);
  };

  const handleUpdateEditedKeyframe = (updated: Keyframe) => {
    setEditingKeyframe(updated);
    if (!selectedKeyframeTrackId) return;
    const tracks = project.timelineTracks.map((t) =>
      t.id === selectedKeyframeTrackId
        ? {
            ...t,
            keyframes: (t.keyframes || []).map((k) => (k.id === updated.id ? updated : k)),
          }
        : t
    );
    onUpdateTracks(tracks);
  };

  return (
    <div
      className={`border-t border-zinc-800/80 bg-zinc-950 flex flex-col select-none transition-all duration-200 z-20 flex-shrink-0 ${
        isCollapsed ? 'h-9' : 'h-72'
      }`}
    >
      {/* Timeline Controls & Action Bar */}
      <div className="h-9 px-3 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 flex-shrink-0">
        {/* Left: Tools & Keyframe Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:text-zinc-200 text-zinc-400 rounded transition-colors mr-1 cursor-pointer"
            title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[11px] mr-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Timeline</span>
          </span>

          {/* 1. KEYFRAMES Toggle */}
          <button
            onClick={() => setShowKeyframeLanes(!showKeyframeLanes)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] border font-semibold transition-colors cursor-pointer ${
              showKeyframeLanes
                ? 'bg-purple-950 border-purple-600 text-purple-200'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Keyframe Animation Lanes"
          >
            <Diamond className="w-3 h-3 text-purple-400 fill-purple-400" />
            <span>Keyframes</span>
          </button>

          {/* Animatable Property Selector */}
          {showKeyframeLanes && (
            <select
              value={activeAnimProp}
              onChange={(e) => setActiveAnimProp(e.target.value as AnimProperty)}
              className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded px-1.5 py-0.5"
            >
              {DEFAULT_ANIMATABLE_PROPERTIES.map((p) => (
                <option key={p.prop} value={p.prop}>
                  {p.label}
                </option>
              ))}
            </select>
          )}

          {/* 2. GRAPH EDITOR Button (Accessible anytime across all channels) */}
          <button
            onClick={() => setIsGraphEditorOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-200 text-[11px] font-semibold transition-all shadow-sm cursor-pointer"
            title="Open Professional Motion Curves / Graph Editor"
          >
            <TrendingUp className="w-3.5 h-3.5 text-purple-300" />
            <span>Graph Editor</span>
          </button>

          {/* 3. MOTION PATH Button */}
          <button
            onClick={() => {
              if (onUpdateProject) {
                const currentPaths = project.motionPaths || [];
                if (currentPaths.length === 0) {
                  onUpdateProject((prev) => ({
                    ...prev,
                    motionPaths: [
                      {
                        id: `path_${Date.now()}`,
                        name: 'Trajectory Arc',
                        points: [
                          { id: 'p0', x: 20, y: 70, handleOut: { x: 35, y: 40 } },
                          { id: 'p1', x: 50, y: 30, handleIn: { x: 40, y: 35 }, handleOut: { x: 65, y: 25 } },
                          { id: 'p2', x: 80, y: 65, handleIn: { x: 75, y: 50 } },
                        ],
                        closed: false,
                        speedEasing: 'ease-in-out',
                      },
                    ],
                  }));
                }
              }
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium transition-colors cursor-pointer ${
              (project.motionPaths?.length || 0) > 0
                ? 'bg-purple-950/50 border-purple-700/60 text-purple-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Bézier Motion Path on Viewport Canvas"
          >
            <Activity className="w-3 h-3 text-purple-400" />
            <span>Motion Path</span>
          </button>

          {/* 4. ONION SKIN Toggle Button */}
          <button
            onClick={() => {
              if (onUpdateProject) {
                const cur = project.onionSkinSettings || {
                  enabled: true,
                  framesBefore: 2,
                  framesAfter: 2,
                  opacity: 0.35,
                  prevTint: '#EF4444',
                  nextTint: '#10B981',
                  showGhost: true,
                  enablePrevious: true,
                  enableNext: true,
                };
                const toggled = !cur.enabled;
                onUpdateProject((prev) => ({
                  ...prev,
                  onionSkinSettings: { ...cur, enabled: toggled },
                }));
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] border font-semibold transition-all cursor-pointer ${
              project.onionSkinSettings?.enabled
                ? 'bg-purple-950 border-purple-600 text-purple-200 shadow-xs'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Toggle Frame-by-Frame Onion Skinning"
          >
            <Eye className={`w-3 h-3 ${project.onionSkinSettings?.enabled ? 'text-purple-400' : 'text-zinc-500'}`} />
            <span>Onion Skin: {project.onionSkinSettings?.enabled ? 'ON' : 'OFF'}</span>
          </button>

          <div className="h-3.5 w-px bg-zinc-800 mx-0.5" />

          {/* Split / Duplicate / Delete */}
          <button
            onClick={handleSplitClip}
            disabled={!selectedClipId}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 transition-colors text-[11px]"
            title="Split Clip at Playhead"
          >
            <Scissors className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            onClick={handleDuplicateSelected}
            disabled={!selectedClipId && !selectedKeyframeId}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-40 transition-colors text-[11px]"
            title="Duplicate Selected Clip or Keyframe"
          >
            <Copy className="w-3 h-3" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedClipId && !selectedKeyframeId}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-zinc-300 hover:text-rose-300 disabled:opacity-40 transition-colors text-[11px]"
            title="Delete Selected Clip or Keyframe"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Delete</span>
          </button>

          {/* Add Marker */}
          <button
            onClick={handleAddMarker}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-300 transition-colors text-[11px]"
            title="Add Timeline Marker at Playhead"
          >
            <Flag className="w-3 h-3 text-amber-400" />
            <span className="hidden sm:inline">Marker</span>
          </button>
        </div>

        {/* Center: Playback Speed & Frame Rate controls */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-zinc-500 font-mono hidden md:inline">Speed:</span>
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              onClick={() => handleUpdateTiming({ playbackSpeed: s })}
              className={`px-1.5 py-0.5 rounded font-mono ${
                timing.playbackSpeed === s
                  ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {s}x
            </button>
          ))}

          <span className="text-zinc-500 font-mono ml-1 hidden md:inline">Hold:</span>
          {[1, 2, 3].map((h) => (
            <button
              key={h}
              onClick={() => handleUpdateTiming({ holdExposure: h as 1 | 2 | 3 })}
              className={`px-1 py-0.5 rounded font-mono ${
                timing.holdExposure === h
                  ? 'bg-sky-950 text-sky-300 font-bold border border-sky-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={`Animate on ${h}s (${24 / h} FPS effective)`}
            >
              {h}s
            </button>
          ))}
        </div>

        {/* Right: Zoom & Snap */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSnapEnabled(!isSnapEnabled)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              isSnapEnabled
                ? 'bg-purple-950/60 border-purple-800/60 text-purple-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500'
            }`}
            title="Magnetic Snap to Grid"
          >
            <Magnet className="w-3 h-3" />
            <span className="hidden sm:inline">Snap</span>
          </button>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded px-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(12, z - 4))}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono px-1.5 text-zinc-400">{zoomLevel}px/s</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(80, z + 4))}
              className="p-1 text-zinc-400 hover:text-zinc-200"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Track Headers Column */}
          <div className="w-48 bg-zinc-950 border-r border-zinc-900 flex flex-col flex-shrink-0 z-10 select-none">
            <div className="h-6 border-b border-zinc-900 bg-zinc-950/90 text-[10px] text-zinc-400 font-semibold px-2 flex items-center justify-between">
              <span>TRACKS & RIGS</span>
              <span className="text-[9px] text-zinc-600">ANIM</span>
            </div>

            {/* Track Label Rows */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {project.timelineTracks.map((track) => (
                <div key={track.id} className="flex flex-col border-b border-zinc-900">
                  {/* Main Track Row */}
                  <div className="h-10 px-2.5 flex items-center justify-between text-xs hover:bg-zinc-900/60 transition-colors">
                    <span className="truncate font-medium text-zinc-300 text-[11px] tracking-wide">
                      {track.name}
                    </span>
                    <div className="flex items-center gap-1 text-zinc-500">
                      {/* Add Keyframe on Track */}
                      {showKeyframeLanes && (
                        <button
                          onClick={() => handleAddKeyframeAtPlayhead(track.id)}
                          className="p-0.5 rounded hover:text-purple-300 hover:bg-purple-950"
                          title={`Add ${activeAnimProp} Keyframe at Playhead`}
                        >
                          <Plus className="w-3 h-3 text-purple-400" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const updated = project.timelineTracks.map((t) =>
                            t.id === track.id ? { ...t, muted: !t.muted } : t
                          );
                          onUpdateTracks(updated);
                        }}
                        className={`p-0.5 rounded hover:text-zinc-200 ${track.muted ? 'text-rose-400' : ''}`}
                        title={track.muted ? 'Unmute Track' : 'Mute Track'}
                      >
                        {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => {
                          const updated = project.timelineTracks.map((t) =>
                            t.id === track.id ? { ...t, locked: !t.locked } : t
                          );
                          onUpdateTracks(updated);
                        }}
                        className={`p-0.5 rounded hover:text-zinc-200 ${track.locked ? 'text-purple-400' : ''}`}
                        title={track.locked ? 'Unlock Track' : 'Lock Track'}
                      >
                        {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Sub-Lane: Animated Property Indicator */}
                  {showKeyframeLanes && (
                    <div className="h-5 px-3 bg-zinc-950/80 border-t border-zinc-900/50 flex items-center justify-between text-[9px] text-purple-400 font-mono">
                      <span>◆ {activeAnimProp}</span>
                      <span className="text-zinc-600">
                        {track.keyframes?.filter((k) => k.property === activeAnimProp).length || 0} kf
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Scrollable Timeline Canvas */}
          <div
            ref={containerRef}
            className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar bg-zinc-950/40"
          >
            <div style={{ width: `${timelineWidth}px` }} className="relative h-full">
              {/* Time Ruler & Markers */}
              <div
                onClick={handleRulerClick}
                className="h-6 border-b border-zinc-900 bg-zinc-950 sticky top-0 z-20 cursor-pointer flex items-end select-none text-[9px] font-mono text-zinc-500"
              >
                {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, sec) => (
                  <div
                    key={sec}
                    className="absolute border-l border-zinc-800 h-3 flex items-start pl-1 pointer-events-none"
                    style={{ left: `${sec * zoomLevel}px` }}
                  >
                    {sec % 5 === 0 && (
                      <span className="text-zinc-400 -mt-3">{sec}s</span>
                    )}
                  </div>
                ))}

                {/* Timeline Markers */}
                {markers.map((m) => (
                  <div
                    key={m.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeek(m.time);
                    }}
                    style={{ left: `${m.time * zoomLevel}px` }}
                    className="absolute top-0 flex flex-col items-center cursor-pointer group z-30"
                  >
                    <div
                      style={{ backgroundColor: m.color }}
                      className="w-2.5 h-2.5 rounded-sm rotate-45 -translate-y-1 shadow-sm"
                    />
                    <span className="text-[8px] font-sans px-1 rounded bg-black/80 text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap -mt-0.5 border border-white/10">
                      {m.label} ({m.time}s)
                    </span>
                  </div>
                ))}
              </div>

              {/* Red Playhead line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
                style={{ left: `${currentTime * zoomLevel}px` }}
              >
                <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -translate-x-[4px] -translate-y-1 shadow-md shadow-rose-950" />
              </div>

              {/* Track Lanes */}
              {project.timelineTracks.map((track) => (
                <div key={track.id} className="flex flex-col border-b border-zinc-900">
                  {/* Clip Lane */}
                  <div className="h-10 relative flex items-center bg-zinc-950/20">
                    {track.clips.map((clip) => {
                      const isSelected = clip.id === selectedClipId;
                      const left = clip.start * zoomLevel;
                      const width = Math.max(16, clip.duration * zoomLevel);

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClipId(clip.id);
                            setSelectedKeyframeId(null);
                            if (clip.shotId && onSelectShot) {
                              onSelectShot(clip.shotId);
                            }
                          }}
                          style={{
                            left: `${left}px`,
                            width: `${width}px`,
                            backgroundColor: clip.color || '#4F46E5',
                          }}
                          className={`absolute h-7 rounded px-2 flex items-center justify-between text-[10px] text-white font-medium cursor-pointer shadow-sm transition-all overflow-hidden border ${
                            isSelected
                              ? 'ring-2 ring-white border-white scale-[1.01] z-10'
                              : 'border-white/20 hover:brightness-110'
                          }`}
                          title={`${clip.name} (${clip.duration}s)`}
                        >
                          <span className="truncate">{clip.name}</span>
                          <span className="text-[9px] opacity-75 ml-1 font-mono flex-shrink-0">
                            {clip.duration}s
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Keyframe Sub-Lane */}
                  {showKeyframeLanes && (
                    <div className="h-5 bg-zinc-950/50 border-t border-zinc-900/60 relative flex items-center">
                      {(track.keyframes || [])
                        .filter((kf) => kf.property === activeAnimProp)
                        .map((kf) => {
                          const isKfSelected = kf.id === selectedKeyframeId;
                          const leftPx = kf.time * zoomLevel;

                          return (
                            <div
                              key={kf.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedKeyframeId(kf.id);
                                setSelectedKeyframeTrackId(track.id);
                                setSelectedClipId(null);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleOpenGraphEditor(kf, track.id);
                              }}
                              style={{ left: `${leftPx}px` }}
                              className={`absolute -translate-x-1/2 w-3.5 h-3.5 rotate-45 cursor-pointer transition-all flex items-center justify-center ${
                                isKfSelected
                                  ? 'bg-amber-400 border-2 border-white scale-125 z-20 shadow-md shadow-amber-950'
                                  : 'bg-purple-500 border border-purple-200/80 hover:bg-purple-400 hover:scale-110 z-10'
                              }`}
                              title={`${kf.property}: ${kf.value} at ${kf.time.toFixed(2)}s (${kf.easing}). Double click for Graph Editor.`}
                            />
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Interactive Graph Editor / Motion Curves */}
      {isGraphEditorOpen && (
        <GraphEditor
          project={project}
          currentTime={currentTime}
          onSeek={onSeek}
          onUpdateProject={onUpdateProject || (() => {})}
          onClose={() => setIsGraphEditorOpen(false)}
          initialProperty={activeAnimProp}
        />
      )}
    </div>
  );
};
