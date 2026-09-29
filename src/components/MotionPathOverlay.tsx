import React, { useRef, useState } from 'react';
import {
  Plus,
  Trash2,
  Navigation,
  Move,
  RotateCw,
  Maximize2,
  Check,
  Sparkles,
} from 'lucide-react';
import { MotionPath, MotionPathPoint, InterpolationType } from '../types/studio';
import { evaluateMotionPath } from '../services/animationEngine';

interface MotionPathOverlayProps {
  motionPath?: MotionPath;
  currentTime: number;
  duration: number;
  onUpdatePath: (path: MotionPath) => void;
  showGizmo?: boolean;
  transform?: {
    x: number; // percentage
    y: number; // percentage
    scale: number;
    rotation: number;
  };
  onUpdateTransform?: (t: { x: number; y: number; scale: number; rotation: number }) => void;
}

export const MotionPathOverlay: React.FC<MotionPathOverlayProps> = ({
  motionPath,
  currentTime,
  duration,
  onUpdatePath,
  showGizmo = true,
  transform = { x: 50, y: 50, scale: 1, rotation: 0 },
  onUpdateTransform,
}) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const [activeDrag, setActiveDrag] = useState<{
    type: 'point' | 'handleOut' | 'handleIn' | 'gizmo_translate' | 'gizmo_rotate';
    pointId?: string;
  } | null>(null);

  // If no motion path exists, create a default 3-point spline
  const path: MotionPath = motionPath || {
    id: 'path_main',
    name: 'Primary Action Path',
    points: [
      { id: 'p0', x: 20, y: 70, handleOut: { x: 30, y: 40 } },
      { id: 'p1', x: 55, y: 35, handleIn: { x: 42, y: 40 }, handleOut: { x: 70, y: 30 } },
      { id: 'p2', x: 80, y: 65, handleIn: { x: 75, y: 50 } },
    ],
    closed: false,
    speedEasing: 'ease-in-out',
  };

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const currentPos = evaluateMotionPath(path, progress);

  // Dragging event handlers
  const handlePointerDown = (
    type: 'point' | 'handleOut' | 'handleIn' | 'gizmo_translate' | 'gizmo_rotate',
    pointId?: string,
    e?: React.PointerEvent
  ) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
    }
    setActiveDrag({ type, pointId });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    if (activeDrag.type === 'point' && activeDrag.pointId) {
      const updatedPts = path.points.map((p) => {
        if (p.id === activeDrag.pointId) {
          const dx = xPct - p.x;
          const dy = yPct - p.y;
          return {
            ...p,
            x: xPct,
            y: yPct,
            handleIn: p.handleIn ? { x: p.handleIn.x + dx, y: p.handleIn.y + dy } : undefined,
            handleOut: p.handleOut ? { x: p.handleOut.x + dx, y: p.handleOut.y + dy } : undefined,
          };
        }
        return p;
      });
      onUpdatePath({ ...path, points: updatedPts });
    } else if (activeDrag.type === 'handleOut' && activeDrag.pointId) {
      const updatedPts = path.points.map((p) =>
        p.id === activeDrag.pointId ? { ...p, handleOut: { x: xPct, y: yPct } } : p
      );
      onUpdatePath({ ...path, points: updatedPts });
    } else if (activeDrag.type === 'handleIn' && activeDrag.pointId) {
      const updatedPts = path.points.map((p) =>
        p.id === activeDrag.pointId ? { ...p, handleIn: { x: xPct, y: yPct } } : p
      );
      onUpdatePath({ ...path, points: updatedPts });
    } else if (activeDrag.type === 'gizmo_translate' && onUpdateTransform) {
      onUpdateTransform({
        ...transform,
        x: xPct,
        y: yPct,
      });
    } else if (activeDrag.type === 'gizmo_rotate' && onUpdateTransform) {
      const angle = (Math.atan2(yPct - transform.y, xPct - transform.x) * 180) / Math.PI;
      onUpdateTransform({
        ...transform,
        rotation: Math.round(angle),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (activeDrag) {
      setActiveDrag(null);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    }
  };

  const handleAddPoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lastPt = path.points[path.points.length - 1];
    const newPt: MotionPathPoint = {
      id: `pt_${Date.now()}`,
      x: Math.min(95, lastPt.x + 10),
      y: Math.min(95, lastPt.y + 10),
      handleIn: { x: lastPt.x + 5, y: lastPt.y + 5 },
    };
    onUpdatePath({ ...path, points: [...path.points, newPt] });
  };

  // Build SVG path data string
  let pathD = '';
  if (path.points.length > 0) {
    pathD = `M ${path.points[0].x} ${path.points[0].y}`;
    for (let i = 0; i < path.points.length - 1; i++) {
      const p0 = path.points[i];
      const p1 = path.points[i + 1];
      const hOut = p0.handleOut || { x: p0.x + (p1.x - p0.x) * 0.33, y: p0.y + (p1.y - p0.y) * 0.33 };
      const hIn = p1.handleIn || { x: p1.x - (p1.x - p0.x) * 0.33, y: p1.y - (p1.y - p0.y) * 0.33 };
      pathD += ` C ${hOut.x} ${hOut.y}, ${hIn.x} ${hIn.y}, ${p1.x} ${p1.y}`;
    }
    if (path.closed && path.points.length > 2) {
      pathD += ' Z';
    }
  }

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 w-full h-full pointer-events-auto select-none z-30"
    >
      <defs>
        {/* Glow filters */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Tangent Handle Lines */}
      {path.points.map((p) => (
        <g key={`lines_${p.id}`}>
          {p.handleOut && (
            <line
              x1={p.x}
              y1={p.y}
              x2={p.handleOut.x}
              y2={p.handleOut.y}
              stroke="rgba(168, 85, 247, 0.6)"
              strokeWidth="0.4"
              strokeDasharray="0.8 0.8"
            />
          )}
          {p.handleIn && (
            <line
              x1={p.x}
              y1={p.y}
              x2={p.handleIn.x}
              y2={p.handleIn.y}
              stroke="rgba(56, 189, 248, 0.6)"
              strokeWidth="0.4"
              strokeDasharray="0.8 0.8"
            />
          )}
        </g>
      ))}

      {/* Main Motion Path Curve */}
      <path
        d={pathD}
        fill="none"
        stroke="#A855F7"
        strokeWidth="0.8"
        strokeDasharray="1.5 1"
        filter="url(#glow)"
        className="opacity-80"
      />

      {/* Moving Actor Token on Path */}
      <g
        transform={`translate(${currentPos.x}, ${currentPos.y}) rotate(${currentPos.angle})`}
        className="transition-transform duration-75"
      >
        <circle r="2.2" fill="#EC4899" stroke="#FFFFFF" strokeWidth="0.4" filter="url(#glow)" />
        {/* Direction arrow */}
        <polygon points="1.8,0 -0.8,-1.2 -0.8,1.2" fill="#FFFFFF" />
      </g>

      {/* Anchor Points & Draggable Tangent Handles */}
      {path.points.map((p, idx) => (
        <g key={`pt_handles_${p.id}`}>
          {/* Main Anchor Point */}
          <circle
            cx={p.x}
            cy={p.y}
            r="1.6"
            fill="#FFFFFF"
            stroke="#9333EA"
            strokeWidth="0.6"
            onPointerDown={(e) => handlePointerDown('point', p.id, e)}
            className="cursor-move hover:scale-125 transition-transform"
          />

          {/* Outgoing Handle */}
          {p.handleOut && (
            <circle
              cx={p.handleOut.x}
              cy={p.handleOut.y}
              r="1.1"
              fill="#A855F7"
              stroke="#FFFFFF"
              strokeWidth="0.3"
              onPointerDown={(e) => handlePointerDown('handleOut', p.id, e)}
              className="cursor-pointer hover:scale-125 transition-transform"
            />
          )}

          {/* Incoming Handle */}
          {p.handleIn && (
            <circle
              cx={p.handleIn.x}
              cy={p.handleIn.y}
              r="1.1"
              fill="#38BDF8"
              stroke="#FFFFFF"
              strokeWidth="0.3"
              onPointerDown={(e) => handlePointerDown('handleIn', p.id, e)}
              className="cursor-pointer hover:scale-125 transition-transform"
            />
          )}
        </g>
      ))}

      {/* Interactive Transform Gizmo (Translate, Scale, Rotate) */}
      {showGizmo && (
        <g transform={`translate(${transform.x}, ${transform.y}) rotate(${transform.rotation})`}>
          {/* Rotation Ring */}
          <circle
            r="8"
            fill="none"
            stroke="rgba(56, 189, 248, 0.4)"
            strokeWidth="0.4"
            strokeDasharray="1 0.5"
            onPointerDown={(e) => handlePointerDown('gizmo_rotate', undefined, e)}
            className="cursor-grab active:cursor-grabbing hover:stroke-sky-400"
          />

          {/* Translation Arrows */}
          {/* X Axis Red */}
          <line
            x1="0"
            y1="0"
            x2="6"
            y2="0"
            stroke="#EF4444"
            strokeWidth="0.6"
            onPointerDown={(e) => handlePointerDown('gizmo_translate', undefined, e)}
            className="cursor-move"
          />
          <polygon points="6,0 4.5,-0.8 4.5,0.8" fill="#EF4444" />

          {/* Y Axis Green */}
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-6"
            stroke="#10B981"
            strokeWidth="0.6"
            onPointerDown={(e) => handlePointerDown('gizmo_translate', undefined, e)}
            className="cursor-move"
          />
          <polygon points="0,-6 -0.8,-4.5 0.8,-4.5" fill="#10B981" />

          {/* Center Origin Dot */}
          <circle
            r="1.2"
            fill="#FFFFFF"
            stroke="#3B82F6"
            strokeWidth="0.4"
            onPointerDown={(e) => handlePointerDown('gizmo_translate', undefined, e)}
            className="cursor-move"
          />
        </g>
      )}
    </svg>
  );
};
