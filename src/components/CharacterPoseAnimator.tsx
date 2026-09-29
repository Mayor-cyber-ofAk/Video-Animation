import React, { useState } from 'react';
import {
  User,
  Sparkles,
  Save,
  Plus,
  Play,
  RotateCcw,
  Smile,
  Eye,
  Sliders,
  Check,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { Character, CharacterPose, PoseKeyframe } from '../types/studio';
import { DEFAULT_POSE_PRESETS, interpolatePose } from '../services/animationEngine';

interface CharacterPoseAnimatorProps {
  character: Character;
  currentTime: number;
  currentPose?: CharacterPose;
  savedPoses?: CharacterPose[];
  poseKeyframes?: PoseKeyframe[];
  onApplyPose: (pose: CharacterPose) => void;
  onAddPoseKeyframe: (keyframe: PoseKeyframe) => void;
  onSavePosePreset: (preset: CharacterPose) => void;
}

function computeMannequinJoints(p: CharacterPose) {
  const hipX = 120;
  const hipY = 160;
  const torsoLen = 50;
  const torsoAngleRad = ((-90 + p.bodyLean) * Math.PI) / 180;
  const chestX = hipX + Math.cos(torsoAngleRad) * torsoLen;
  const chestY = hipY + Math.sin(torsoAngleRad) * torsoLen;

  const neckLen = 22;
  const headAngleRad = ((-90 + p.headTilt) * Math.PI) / 180;
  const headX = chestX + Math.cos(headAngleRad) * neckLen;
  const headY = chestY + Math.sin(headAngleRad) * neckLen;

  const armLen = 32;
  const lUpperRad = ((90 + p.leftUpperArm) * Math.PI) / 180;
  const lElbowX = chestX - 18 + Math.cos(lUpperRad) * armLen;
  const lElbowY = chestY + 5 + Math.sin(lUpperRad) * armLen;
  const lForeRad = ((90 + p.leftUpperArm + p.leftForearm) * Math.PI) / 180;
  const lHandX = lElbowX + Math.cos(lForeRad) * armLen;
  const lHandY = lElbowY + Math.sin(lForeRad) * armLen;

  const rUpperRad = ((90 + p.rightUpperArm) * Math.PI) / 180;
  const rElbowX = chestX + 18 + Math.cos(rUpperRad) * armLen;
  const rElbowY = chestY + 5 + Math.sin(rUpperRad) * armLen;
  const rForeRad = ((90 + p.rightUpperArm + p.rightForearm) * Math.PI) / 180;
  const rHandX = rElbowX + Math.cos(rForeRad) * armLen;
  const rHandY = rElbowY + Math.sin(rForeRad) * armLen;

  const legLen = 38;
  const lThighRad = ((90 + p.leftThigh) * Math.PI) / 180;
  const lKneeX = hipX - 12 + Math.cos(lThighRad) * legLen;
  const lKneeY = hipY + Math.sin(lThighRad) * legLen;
  const lCalfRad = ((90 + p.leftThigh + p.leftCalf) * Math.PI) / 180;
  const lFootX = lKneeX + Math.cos(lCalfRad) * legLen;
  const lFootY = lKneeY + Math.sin(lCalfRad) * legLen;

  const rThighRad = ((90 + p.rightThigh) * Math.PI) / 180;
  const rKneeX = hipX + 12 + Math.cos(rThighRad) * legLen;
  const rKneeY = hipY + Math.sin(rThighRad) * legLen;
  const rCalfRad = ((90 + p.rightThigh + p.rightCalf) * Math.PI) / 180;
  const rFootX = rKneeX + Math.cos(rCalfRad) * legLen;
  const rFootY = rKneeY + Math.sin(rCalfRad) * legLen;

  return {
    hipX, hipY, chestX, chestY, headX, headY,
    lElbowX, lElbowY, lHandX, lHandY,
    rElbowX, rElbowY, rHandX, rHandY,
    lKneeX, lKneeY, lFootX, lFootY,
    rKneeX, rKneeY, rFootX, rFootY,
  };
}

export const CharacterPoseAnimator: React.FC<CharacterPoseAnimatorProps> = ({
  character,
  currentTime,
  currentPose = DEFAULT_POSE_PRESETS[0],
  savedPoses = [],
  poseKeyframes = [],
  onApplyPose,
  onAddPoseKeyframe,
  onSavePosePreset,
}) => {
  const [pose, setPose] = useState<CharacterPose>(currentPose);
  const [activeTab, setActiveTab] = useState<'rig' | 'face' | 'presets'>('rig');
  const [customPoseName, setCustomPoseName] = useState('');
  const [isSavedToast, setIsSavedToast] = useState(false);
  const [appliedToast, setAppliedToast] = useState(false);
  const [onionSkinPoses, setOnionSkinPoses] = useState(true);
  const [onionOpacity, setOnionOpacity] = useState(0.4);

  const allPresets = [...DEFAULT_POSE_PRESETS, ...savedPoses];

  // Find previous and upcoming pose keyframes for onion skinning
  const sortedKeyframes = [...poseKeyframes].sort((a, b) => a.time - b.time);
  const prevKf = sortedKeyframes.filter((k) => k.time < currentTime).pop() || (sortedKeyframes[0] && sortedKeyframes[0].time <= currentTime ? sortedKeyframes[0] : null);
  const nextKf = sortedKeyframes.find((k) => k.time > currentTime) || (sortedKeyframes.length > 1 ? sortedKeyframes[sortedKeyframes.length - 1] : null);

  const updatePoseField = <K extends keyof CharacterPose>(
    field: K,
    value: CharacterPose[K]
  ) => {
    const updated = { ...pose, [field]: value };
    setPose(updated);
    onApplyPose(updated);
  };

  const handleSelectPreset = (preset: CharacterPose) => {
    const copy = { ...preset, id: `pose_${Date.now()}` };
    setPose(copy);
    onApplyPose(copy);
  };

  const handleInsertKeyframe = () => {
    const kf: PoseKeyframe = {
      id: `pose_kf_${Date.now()}`,
      characterId: character.id,
      time: currentTime,
      pose: { ...pose },
      easing: 'ease-in-out',
    };
    onAddPoseKeyframe(kf);
    setAppliedToast(true);
    setTimeout(() => setAppliedToast(false), 1500);
  };

  const handleSavePreset = () => {
    if (!customPoseName.trim()) return;
    const newPreset: CharacterPose = {
      ...pose,
      id: `custom_pose_${Date.now()}`,
      name: customPoseName.trim(),
      isPreset: false,
    };
    onSavePosePreset(newPreset);
    setCustomPoseName('');
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 1500);
  };

  // Convert joint angles to SVG puppet coordinates
  // Origin (0,0) at hip center (120, 160)
  const hipX = 120;
  const hipY = 160;

  // Torso / Body
  const torsoLen = 50;
  const torsoAngleRad = ((-90 + pose.bodyLean) * Math.PI) / 180;
  const chestX = hipX + Math.cos(torsoAngleRad) * torsoLen;
  const chestY = hipY + Math.sin(torsoAngleRad) * torsoLen;

  // Head
  const neckLen = 22;
  const headAngleRad = ((-90 + pose.headTilt) * Math.PI) / 180;
  const headX = chestX + Math.cos(headAngleRad) * neckLen;
  const headY = chestY + Math.sin(headAngleRad) * neckLen;

  // Left Arm (upper arm, elbow, hand)
  const armLen = 32;
  const lUpperRad = ((90 + pose.leftUpperArm) * Math.PI) / 180;
  const lElbowX = chestX - 18 + Math.cos(lUpperRad) * armLen;
  const lElbowY = chestY + 5 + Math.sin(lUpperRad) * armLen;
  const lForeRad = ((90 + pose.leftUpperArm + pose.leftForearm) * Math.PI) / 180;
  const lHandX = lElbowX + Math.cos(lForeRad) * armLen;
  const lHandY = lElbowY + Math.sin(lForeRad) * armLen;

  // Right Arm
  const rUpperRad = ((90 + pose.rightUpperArm) * Math.PI) / 180;
  const rElbowX = chestX + 18 + Math.cos(rUpperRad) * armLen;
  const rElbowY = chestY + 5 + Math.sin(rUpperRad) * armLen;
  const rForeRad = ((90 + pose.rightUpperArm + pose.rightForearm) * Math.PI) / 180;
  const rHandX = rElbowX + Math.cos(rForeRad) * armLen;
  const rHandY = rElbowY + Math.sin(rForeRad) * armLen;

  // Left Leg (thigh, knee, foot)
  const legLen = 38;
  const lThighRad = ((90 + pose.leftThigh) * Math.PI) / 180;
  const lKneeX = hipX - 12 + Math.cos(lThighRad) * legLen;
  const lKneeY = hipY + Math.sin(lThighRad) * legLen;
  const lCalfRad = ((90 + pose.leftThigh + pose.leftCalf) * Math.PI) / 180;
  const lFootX = lKneeX + Math.cos(lCalfRad) * legLen;
  const lFootY = lKneeY + Math.sin(lCalfRad) * legLen;

  // Right Leg
  const rThighRad = ((90 + pose.rightThigh) * Math.PI) / 180;
  const rKneeX = hipX + 12 + Math.cos(rThighRad) * legLen;
  const rKneeY = hipY + Math.sin(rThighRad) * legLen;
  const rCalfRad = ((90 + pose.rightThigh + pose.rightCalf) * Math.PI) / 180;
  const rFootX = rKneeX + Math.cos(rCalfRad) * legLen;
  const rFootY = rKneeY + Math.sin(rCalfRad) * legLen;

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xl text-zinc-200">
      {/* Top Header */}
      <div className="h-11 px-3 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-purple-950 text-purple-400 border border-purple-800/50">
            <User className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
              POSE ANIMATOR: {character.name}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono ml-2">
              Time: {currentTime.toFixed(2)}s
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center bg-zinc-950 rounded p-0.5 border border-zinc-800 text-[11px]">
          <button
            onClick={() => setActiveTab('rig')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'rig' ? 'bg-purple-900/60 text-purple-200 font-medium' : 'text-zinc-400'
            }`}
          >
            Body Rig
          </button>
          <button
            onClick={() => setActiveTab('face')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'face' ? 'bg-purple-900/60 text-purple-200 font-medium' : 'text-zinc-400'
            }`}
          >
            Facial & Eyes
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTab === 'presets' ? 'bg-purple-900/60 text-purple-200 font-medium' : 'text-zinc-400'
            }`}
          >
            Presets
          </button>
        </div>
      </div>

      {/* Main Grid: Left Puppet Visualizer + Right Controls */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 p-3 overflow-hidden">
        {/* Left: 2D Puppet Canvas / SVG Viewport */}
        {/* Left: Interactive 2D Mannequin with Onion Skinning */}
        <div className="md:col-span-5 bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-2 flex flex-col items-center justify-between">
          <div className="flex items-center justify-between w-full text-[10px] text-zinc-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-purple-300">
              Interactive Skeleton Rig
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setOnionSkinPoses(!onionSkinPoses)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                  onionSkinPoses
                    ? 'bg-purple-950 border-purple-600 text-purple-200 font-semibold'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
                title="Toggle Ghost Onion Skinning of Adjacent Poses"
              >
                <Eye className="w-3 h-3" />
                <span>Ghost Poses: {onionSkinPoses ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* SVG Puppet with Multi-Pose Ghosting */}
          <div className="w-full flex-1 flex items-center justify-center py-2 relative">
            <svg
              viewBox="0 0 240 280"
              className="w-full h-56 max-h-64 drop-shadow-[0_0_12px_rgba(0,0,0,0.5)] select-none"
            >
              {/* Ground shadow */}
              <ellipse cx="120" cy="265" rx="55" ry="8" fill="rgba(0,0,0,0.4)" />

              {/* 1. GHOST: Previous Pose Keyframe (Warm / Red Tint) */}
              {onionSkinPoses && prevKf && (() => {
                const pj = computeMannequinJoints(prevKf.pose);
                return (
                  <g opacity={onionOpacity} stroke="#EF4444" strokeDasharray="3 3">
                    <line x1={pj.hipX - 12} y1={pj.hipY} x2={pj.lKneeX} y2={pj.lKneeY} strokeWidth="3" />
                    <line x1={pj.lKneeX} y1={pj.lKneeY} x2={pj.lFootX} y2={pj.lFootY} strokeWidth="2.5" />
                    <line x1={pj.hipX + 12} y1={pj.hipY} x2={pj.rKneeX} y2={pj.rKneeY} strokeWidth="3" />
                    <line x1={pj.rKneeX} y1={pj.rKneeY} x2={pj.rFootX} y2={pj.rFootY} strokeWidth="2.5" />
                    <line x1={pj.hipX} y1={pj.hipY} x2={pj.chestX} y2={pj.chestY} strokeWidth="4" />
                    <line x1={pj.chestX - 16} y1={pj.chestY + 4} x2={pj.lElbowX} y2={pj.lElbowY} strokeWidth="2.5" />
                    <line x1={pj.lElbowX} y1={pj.lElbowY} x2={pj.lHandX} y2={pj.lHandY} strokeWidth="2" />
                    <line x1={pj.chestX + 16} y1={pj.chestY + 4} x2={pj.rElbowX} y2={pj.rElbowY} strokeWidth="2.5" />
                    <line x1={pj.rElbowX} y1={pj.rElbowY} x2={pj.rHandX} y2={pj.rHandY} strokeWidth="2" />
                    <circle cx={pj.headX} cy={pj.headY} r="16" fill="none" strokeWidth="2" />
                  </g>
                );
              })()}

              {/* 2. GHOST: Next Pose Keyframe (Cool / Green Tint) */}
              {onionSkinPoses && nextKf && (() => {
                const nj = computeMannequinJoints(nextKf.pose);
                return (
                  <g opacity={onionOpacity} stroke="#10B981" strokeDasharray="3 3">
                    <line x1={nj.hipX - 12} y1={nj.hipY} x2={nj.lKneeX} y2={nj.lKneeY} strokeWidth="3" />
                    <line x1={nj.lKneeX} y1={nj.lKneeY} x2={nj.lFootX} y2={nj.lFootY} strokeWidth="2.5" />
                    <line x1={nj.hipX + 12} y1={nj.hipY} x2={nj.rKneeX} y2={nj.rKneeY} strokeWidth="3" />
                    <line x1={nj.rKneeX} y1={nj.rKneeY} x2={nj.rFootX} y2={nj.rFootY} strokeWidth="2.5" />
                    <line x1={nj.hipX} y1={nj.hipY} x2={nj.chestX} y2={nj.chestY} strokeWidth="4" />
                    <line x1={nj.chestX - 16} y1={nj.chestY + 4} x2={nj.lElbowX} y2={nj.lElbowY} strokeWidth="2.5" />
                    <line x1={nj.lElbowX} y1={nj.lElbowY} x2={nj.lHandX} y2={nj.lHandY} strokeWidth="2" />
                    <line x1={nj.chestX + 16} y1={nj.chestY + 4} x2={nj.rElbowX} y2={nj.rElbowY} strokeWidth="2.5" />
                    <line x1={nj.rElbowX} y1={nj.rElbowY} x2={nj.rHandX} y2={nj.rHandY} strokeWidth="2" />
                    <circle cx={nj.headX} cy={nj.headY} r="16" fill="none" strokeWidth="2" />
                  </g>
                );
              })()}

              {/* 3. CURRENT ACTIVE POSE MANNEQUIN */}
              {/* Left Leg */}
              <line x1={hipX - 12} y1={hipY} x2={lKneeX} y2={lKneeY} stroke="#A855F7" strokeWidth="5" strokeLinecap="round" />
              <line x1={lKneeX} y1={lKneeY} x2={lFootX} y2={lFootY} stroke="#C084FC" strokeWidth="4" strokeLinecap="round" />
              <circle cx={lKneeX} cy={lKneeY} r="4" fill="#FFFFFF" />
              <circle cx={lFootX} cy={lFootY} r="5" fill="#A855F7" />

              {/* Right Leg */}
              <line x1={hipX + 12} y1={hipY} x2={rKneeX} y2={rKneeY} stroke="#6366F1" strokeWidth="5" strokeLinecap="round" />
              <line x1={rKneeX} y1={rKneeY} x2={rFootX} y2={rFootY} stroke="#818CF8" strokeWidth="4" strokeLinecap="round" />
              <circle cx={rKneeX} cy={rKneeY} r="4" fill="#FFFFFF" />
              <circle cx={rFootX} cy={rFootY} r="5" fill="#6366F1" />

              {/* Pelvis */}
              <circle cx={hipX} cy={hipY} r="8" fill="#7E22CE" />

              {/* Torso Spine */}
              <line x1={hipX} y1={hipY} x2={chestX} y2={chestY} stroke="#9333EA" strokeWidth="8" strokeLinecap="round" />
              <circle cx={chestX} cy={chestY} r="9" fill="#A855F7" />

              {/* Arms */}
              {/* Left Arm */}
              <line x1={chestX - 16} y1={chestY + 4} x2={lElbowX} y2={lElbowY} stroke="#EC4899" strokeWidth="4.5" strokeLinecap="round" />
              <line x1={lElbowX} y1={lElbowY} x2={lHandX} y2={lHandY} stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx={lElbowX} cy={lElbowY} r="4" fill="#FFFFFF" />
              <circle cx={lHandX} cy={lHandY} r="5" fill="#EC4899" />

              {/* Right Arm */}
              <line x1={chestX + 16} y1={chestY + 4} x2={rElbowX} y2={rElbowY} stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" />
              <line x1={rElbowX} y1={rElbowY} x2={rHandX} y2={rHandY} stroke="#7DD3FC" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx={rElbowX} cy={rElbowY} r="4" fill="#FFFFFF" />
              <circle cx={rHandX} cy={rHandY} r="5" fill="#38BDF8" />

              {/* Neck & Head */}
              <line x1={chestX} y1={chestY} x2={headX} y2={headY} stroke="#A855F7" strokeWidth="4" strokeLinecap="round" />
              <circle cx={headX} cy={headY} r="18" fill="#3B0764" stroke="#C084FC" strokeWidth="2.5" />

              {/* Facial features on puppet head */}
              <circle cx={headX - 6 + (pose.eyeDirection === 'left' ? -2 : pose.eyeDirection === 'right' ? 2 : 0)} cy={headY - 3 + (pose.eyeDirection === 'up' ? -2 : pose.eyeDirection === 'down' ? 2 : 0)} r={pose.eyeBlink > 0.5 ? 1 : 2.5} fill="#FFFFFF" />
              <circle cx={headX + 6 + (pose.eyeDirection === 'left' ? -2 : pose.eyeDirection === 'right' ? 2 : 0)} cy={headY - 3 + (pose.eyeDirection === 'up' ? -2 : pose.eyeDirection === 'down' ? 2 : 0)} r={pose.eyeBlink > 0.5 ? 1 : 2.5} fill="#FFFFFF" />

              {/* Mouth */}
              {pose.mouthExpression === 'smile' ? (
                <path d={`M ${headX - 5} ${headY + 6} Q ${headX} ${headY + 11} ${headX + 5} ${headY + 6}`} fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
              ) : pose.mouthExpression === 'open' || pose.mouthExpression === 'phoneme_o' ? (
                <circle cx={headX} cy={headY + 8} r="3" fill="#FFFFFF" />
              ) : (
                <line x1={headX - 4} y1={headY + 7} x2={headX + 4} y2={headY + 7} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
              )}
            </svg>
          </div>

          {/* Action buttons */}
          <div className="w-full flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
            <button
              onClick={handleInsertKeyframe}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950 transition-colors"
            >
              {appliedToast ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{appliedToast ? 'Keyframe Placed!' : 'Place Pose on Timeline'}</span>
            </button>
          </div>
        </div>

        {/* Right: Controls based on active tab */}
        <div className="md:col-span-7 bg-zinc-900/30 border border-zinc-800/80 rounded-lg p-3 overflow-y-auto custom-scrollbar space-y-3">
          {activeTab === 'rig' && (
            <div className="space-y-3">
              {/* Torso & Head */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                  Head & Torso
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Head Tilt</span>
                      <span className="font-mono">{pose.headTilt}°</span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={pose.headTilt}
                      onChange={(e) => updatePoseField('headTilt', parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Body Lean</span>
                      <span className="font-mono">{pose.bodyLean}°</span>
                    </div>
                    <input
                      type="range"
                      min="-45"
                      max="45"
                      value={pose.bodyLean}
                      onChange={(e) => updatePoseField('bodyLean', parseInt(e.target.value))}
                      className="w-full accent-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Arms */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-pink-400 tracking-wider">
                  Arms & Hands
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Left Upper Arm</span>
                      <span className="font-mono">{pose.leftUpperArm}°</span>
                    </div>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={pose.leftUpperArm}
                      onChange={(e) => updatePoseField('leftUpperArm', parseInt(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Left Forearm</span>
                      <span className="font-mono">{pose.leftForearm}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="140"
                      value={pose.leftForearm}
                      onChange={(e) => updatePoseField('leftForearm', parseInt(e.target.value))}
                      className="w-full accent-pink-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Right Upper Arm</span>
                      <span className="font-mono">{pose.rightUpperArm}°</span>
                    </div>
                    <input
                      type="range"
                      min="-120"
                      max="120"
                      value={pose.rightUpperArm}
                      onChange={(e) => updatePoseField('rightUpperArm', parseInt(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Right Forearm</span>
                      <span className="font-mono">{pose.rightForearm}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="140"
                      value={pose.rightForearm}
                      onChange={(e) => updatePoseField('rightForearm', parseInt(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Legs */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                  Legs & Feet
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Left Thigh</span>
                      <span className="font-mono">{pose.leftThigh}°</span>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={pose.leftThigh}
                      onChange={(e) => updatePoseField('leftThigh', parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Left Calf</span>
                      <span className="font-mono">{pose.leftCalf}°</span>
                    </div>
                    <input
                      type="range"
                      min="-110"
                      max="40"
                      value={pose.leftCalf}
                      onChange={(e) => updatePoseField('leftCalf', parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Right Thigh</span>
                      <span className="font-mono">{pose.rightThigh}°</span>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={pose.rightThigh}
                      onChange={(e) => updatePoseField('rightThigh', parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400">
                      <span>Right Calf</span>
                      <span className="font-mono">{pose.rightCalf}°</span>
                    </div>
                    <input
                      type="range"
                      min="-110"
                      max="40"
                      value={pose.rightCalf}
                      onChange={(e) => updatePoseField('rightCalf', parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'face' && (
            <div className="space-y-3">
              {/* Expressions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                  Expression Preset
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Neutral', 'Happy', 'Angry', 'Sad', 'Fearful', 'Surprised', 'Smirk', 'Crying'] as const).map(
                    (expr) => (
                      <button
                        key={expr}
                        onClick={() => updatePoseField('expression', expr)}
                        className={`py-1 px-2 rounded text-[11px] border transition-colors ${
                          pose.expression === expr
                            ? 'bg-purple-950 border-purple-600 text-purple-200 font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {expr}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Eyes Controls */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-sky-400 tracking-wider">
                  Eye Direction & Blink
                </span>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {(['left', 'center', 'right', 'up', 'down'] as const).map((dir) => (
                    <button
                      key={dir}
                      onClick={() => updatePoseField('eyeDirection', dir)}
                      className={`py-1 rounded text-[10px] uppercase font-mono border transition-colors ${
                        pose.eyeDirection === dir
                          ? 'bg-sky-950 border-sky-600 text-sky-200 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Eyelid Blink</span>
                    <span className="font-mono">{(pose.eyeBlink * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={pose.eyeBlink}
                    onChange={(e) => updatePoseField('eyeBlink', parseFloat(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>

              {/* Mouth & Phonemes */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Mouth & Lip-Sync Phonemes
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(
                    [
                      { id: 'closed', label: 'Closed (M/B/P)' },
                      { id: 'open', label: 'Open (A/H)' },
                      { id: 'smile', label: 'Smile (E/I)' },
                      { id: 'frown', label: 'Frown' },
                      { id: 'phoneme_o', label: 'Phoneme O / W' },
                      { id: 'phoneme_e', label: 'Phoneme E / L' },
                      { id: 'phoneme_a', label: 'Phoneme AH' },
                      { id: 'phoneme_m', label: 'Resting' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updatePoseField('mouthExpression', m.id)}
                      className={`py-1 px-1.5 rounded text-[10px] border transition-colors ${
                        pose.mouthExpression === m.id
                          ? 'bg-amber-950 border-amber-600 text-amber-200 font-semibold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider block">
                Reusable Character Pose Presets
              </span>

              {/* Presets List */}
              <div className="grid grid-cols-1 gap-1.5">
                {allPresets.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => handleSelectPreset(pr)}
                    className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-purple-600 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-zinc-200 group-hover:text-purple-300">
                        {pr.name}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Expr: {pr.expression} · Lean: {pr.bodyLean}° · Arm: {pr.leftUpperArm}°
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                ))}
              </div>

              {/* Save New Preset Box */}
              <div className="pt-2 border-t border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-semibold text-zinc-400 block">
                  Save Current Rig as New Preset
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Pose 09 - Sneak Walk"
                    value={customPoseName}
                    onChange={(e) => setCustomPoseName(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-200"
                  />
                  <button
                    onClick={handleSavePreset}
                    disabled={!customPoseName.trim()}
                    className="flex items-center gap-1 px-3 py-1 rounded bg-purple-950 border border-purple-700 text-purple-300 text-xs disabled:opacity-40 hover:bg-purple-900"
                  >
                    {isSavedToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{isSavedToast ? 'Saved!' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
