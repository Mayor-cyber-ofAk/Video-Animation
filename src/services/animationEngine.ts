import {
  Keyframe,
  InterpolationType,
  MotionPath,
  MotionPathPoint,
  CharacterPose,
  PoseKeyframe,
  CameraRig,
  AnimProperty,
} from '../types/studio';

/**
 * Standard Cubic Bezier evaluation function using Newton's method
 */
function solveCubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x: number
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Binary search / Newton iteration to find t for given x
  let t = x;
  for (let i = 0; i < 8; i++) {
    const currentX =
      3 * (1 - t) * (1 - t) * t * x1 +
      3 * (1 - t) * t * t * x2 +
      t * t * t;
    const diff = currentX - x;
    if (Math.abs(diff) < 0.001) break;

    const derivativeX =
      3 * (1 - t) * (1 - t) * x1 +
      6 * (1 - t) * t * (x2 - x1) +
      3 * t * t * (1 - x2);
    if (Math.abs(derivativeX) < 1e-6) break;
    t -= diff / derivativeX;
    t = Math.max(0, Math.min(1, t));
  }

  // Calculate y from t
  return (
    3 * (1 - t) * (1 - t) * t * y1 +
    3 * (1 - t) * t * t * y2 +
    t * t * t
  );
}

/**
 * Calculates easing progress [0, 1] from normalized time [0, 1]
 */
export function evaluateEasing(
  t: number,
  easing: InterpolationType,
  bezierHandles?: [number, number, number, number]
): number {
  const clampedT = Math.max(0, Math.min(1, t));

  switch (easing) {
    case 'linear':
      return clampedT;
    case 'ease-in':
      return clampedT * clampedT;
    case 'ease-out':
      return clampedT * (2 - clampedT);
    case 'ease-in-out':
      return clampedT < 0.5
        ? 2 * clampedT * clampedT
        : -1 + (4 - 2 * clampedT) * clampedT;
    case 'smooth':
      // Smoothstep: 3t^2 - 2t^3
      return clampedT * clampedT * (3 - 2 * clampedT);
    case 'step':
      return clampedT >= 1 ? 1 : 0;
    case 'bezier':
      if (bezierHandles && bezierHandles.length === 4) {
        return solveCubicBezier(
          bezierHandles[0],
          bezierHandles[1],
          bezierHandles[2],
          bezierHandles[3],
          clampedT
        );
      }
      // Default nice ease bezier (0.25, 0.1, 0.25, 1.0)
      return solveCubicBezier(0.25, 0.1, 0.25, 1.0, clampedT);
    default:
      return clampedT;
  }
}

/**
 * Interpolates keyframe track for a specific property at a given time
 */
export function interpolateKeyframes(
  keyframes: Keyframe[],
  time: number,
  defaultValue: number = 0
): number {
  if (!keyframes || keyframes.length === 0) return defaultValue;

  // Sort keyframes chronologically
  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (time <= sorted[0].time) {
    return sorted[0].value;
  }

  // After last keyframe
  if (time >= sorted[sorted.length - 1].time) {
    return sorted[sorted.length - 1].value;
  }

  // Find surrounding keyframes
  for (let i = 0; i < sorted.length - 1; i++) {
    const kf1 = sorted[i];
    const kf2 = sorted[i + 1];

    if (time >= kf1.time && time <= kf2.time) {
      const duration = kf2.time - kf1.time;
      if (duration <= 0) return kf2.value;

      const normalizedTime = (time - kf1.time) / duration;
      const easedProgress = evaluateEasing(
        normalizedTime,
        kf2.easing,
        kf2.bezierHandles
      );

      return kf1.value + (kf2.value - kf1.value) * easedProgress;
    }
  }

  return defaultValue;
}

/**
 * Standard Default Pose Presets
 */
export const DEFAULT_POSE_PRESETS: CharacterPose[] = [
  {
    id: 'pose_standing_neutral',
    name: 'Pose 01 - Standing Neutral',
    headRotation: 0,
    headTilt: 0,
    bodyRotation: 0,
    bodyLean: 0,
    leftUpperArm: 15,
    leftForearm: 10,
    leftHand: 'relax',
    rightUpperArm: -15,
    rightForearm: -10,
    rightHand: 'relax',
    leftThigh: 0,
    leftCalf: 0,
    leftFoot: 0,
    rightThigh: 0,
    rightCalf: 0,
    rightFoot: 0,
    expression: 'Neutral',
    eyeDirection: 'center',
    eyeBlink: 0,
    mouthExpression: 'closed',
    isPreset: true,
  },
  {
    id: 'pose_walking',
    name: 'Pose 02 - Walking',
    headRotation: 2,
    headTilt: -2,
    bodyRotation: 5,
    bodyLean: 6,
    leftUpperArm: -30,
    leftForearm: 45,
    leftHand: 'relax',
    rightUpperArm: 25,
    rightForearm: 15,
    rightHand: 'open',
    leftThigh: 25,
    leftCalf: -15,
    leftFoot: 10,
    rightThigh: -20,
    rightCalf: 30,
    rightFoot: -10,
    expression: 'Neutral',
    eyeDirection: 'center',
    eyeBlink: 0,
    mouthExpression: 'closed',
    isPreset: true,
  },
  {
    id: 'pose_running',
    name: 'Pose 03 - Running',
    headRotation: 5,
    headTilt: 0,
    bodyRotation: 12,
    bodyLean: 18,
    leftUpperArm: -55,
    leftForearm: 90,
    leftHand: 'fist',
    rightUpperArm: 50,
    rightForearm: 85,
    rightHand: 'fist',
    leftThigh: 50,
    leftCalf: -30,
    leftFoot: 20,
    rightThigh: -45,
    rightCalf: 60,
    rightFoot: -20,
    expression: 'Angry',
    eyeDirection: 'center',
    eyeBlink: 0,
    mouthExpression: 'open',
    isPreset: true,
  },
  {
    id: 'pose_attacking',
    name: 'Pose 04 - Action / Attack',
    headRotation: -10,
    headTilt: 8,
    bodyRotation: -20,
    bodyLean: 14,
    leftUpperArm: -75,
    leftForearm: 110,
    leftHand: 'point',
    rightUpperArm: 60,
    rightForearm: 40,
    rightHand: 'fist',
    leftThigh: 35,
    leftCalf: 20,
    leftFoot: 0,
    rightThigh: -30,
    rightCalf: 10,
    rightFoot: 5,
    expression: 'Smirk',
    eyeDirection: 'left',
    eyeBlink: 0,
    mouthExpression: 'smile',
    isPreset: true,
  },
  {
    id: 'pose_talking',
    name: 'Pose 05 - Conversational Gesture',
    headRotation: 4,
    headTilt: -5,
    bodyRotation: 0,
    bodyLean: 2,
    leftUpperArm: -25,
    leftForearm: 60,
    leftHand: 'open',
    rightUpperArm: -10,
    rightForearm: 20,
    rightHand: 'relax',
    leftThigh: -5,
    leftCalf: 5,
    leftFoot: 0,
    rightThigh: 5,
    rightCalf: 0,
    rightFoot: 0,
    expression: 'Happy',
    eyeDirection: 'right',
    eyeBlink: 0,
    mouthExpression: 'phoneme_a',
    isPreset: true,
  },
  {
    id: 'pose_crouch',
    name: 'Pose 06 - Stealth / Crouch',
    headRotation: 0,
    headTilt: -8,
    bodyRotation: 0,
    bodyLean: 25,
    leftUpperArm: -20,
    leftForearm: 70,
    leftHand: 'fist',
    rightUpperArm: 15,
    rightForearm: 65,
    rightHand: 'relax',
    leftThigh: 60,
    leftCalf: -60,
    leftFoot: 20,
    rightThigh: 50,
    rightCalf: -50,
    rightFoot: 15,
    expression: 'Fearful',
    eyeDirection: 'up',
    eyeBlink: 0,
    mouthExpression: 'closed',
    isPreset: true,
  },
  {
    id: 'pose_hero',
    name: 'Pose 07 - Hero Stance',
    headRotation: 0,
    headTilt: 5,
    bodyRotation: 0,
    bodyLean: -4,
    leftUpperArm: -30,
    leftForearm: 85,
    leftHand: 'fist',
    rightUpperArm: 30,
    rightForearm: 85,
    rightHand: 'fist',
    leftThigh: 15,
    leftCalf: 0,
    leftFoot: 0,
    rightThigh: -15,
    rightCalf: 0,
    rightFoot: 0,
    expression: 'Neutral',
    eyeDirection: 'center',
    eyeBlink: 0,
    mouthExpression: 'closed',
    isPreset: true,
  },
];

/**
 * Interpolates smoothly between two character poses
 */
export function interpolatePose(
  poseA: CharacterPose,
  poseB: CharacterPose,
  progress: number,
  easing: InterpolationType = 'ease-in-out'
): CharacterPose {
  const t = evaluateEasing(progress, easing);

  const lerp = (a: number, b: number) => a + (b - a) * t;

  return {
    id: `interpolated_${Date.now()}`,
    name: 'Interpolated Pose',
    headRotation: lerp(poseA.headRotation, poseB.headRotation),
    headTilt: lerp(poseA.headTilt, poseB.headTilt),
    bodyRotation: lerp(poseA.bodyRotation, poseB.bodyRotation),
    bodyLean: lerp(poseA.bodyLean, poseB.bodyLean),
    leftUpperArm: lerp(poseA.leftUpperArm, poseB.leftUpperArm),
    leftForearm: lerp(poseA.leftForearm, poseB.leftForearm),
    leftHand: t > 0.5 ? poseB.leftHand : poseA.leftHand,
    rightUpperArm: lerp(poseA.rightUpperArm, poseB.rightUpperArm),
    rightForearm: lerp(poseA.rightForearm, poseB.rightForearm),
    rightHand: t > 0.5 ? poseB.rightHand : poseA.rightHand,
    leftThigh: lerp(poseA.leftThigh, poseB.leftThigh),
    leftCalf: lerp(poseA.leftCalf, poseB.leftCalf),
    leftFoot: lerp(poseA.leftFoot, poseB.leftFoot),
    rightThigh: lerp(poseA.rightThigh, poseB.rightThigh),
    rightCalf: lerp(poseA.rightCalf, poseB.rightCalf),
    rightFoot: lerp(poseA.rightFoot, poseB.rightFoot),
    expression: t > 0.5 ? poseB.expression : poseA.expression,
    eyeDirection: t > 0.5 ? poseB.eyeDirection : poseA.eyeDirection,
    eyeBlink: lerp(poseA.eyeBlink, poseB.eyeBlink),
    mouthExpression: t > 0.5 ? poseB.mouthExpression : poseA.mouthExpression,
  };
}

/**
 * Gets character pose at current time from pose keyframes
 */
export function getPoseAtTime(
  poseKeyframes: PoseKeyframe[] | undefined,
  time: number,
  defaultPose: CharacterPose = DEFAULT_POSE_PRESETS[0]
): CharacterPose {
  if (!poseKeyframes || poseKeyframes.length === 0) return defaultPose;

  const sorted = [...poseKeyframes].sort((a, b) => a.time - b.time);

  if (time <= sorted[0].time) return sorted[0].pose;
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1].pose;

  for (let i = 0; i < sorted.length - 1; i++) {
    const kf1 = sorted[i];
    const kf2 = sorted[i + 1];

    if (time >= kf1.time && time <= kf2.time) {
      const dur = kf2.time - kf1.time;
      const progress = dur > 0 ? (time - kf1.time) / dur : 1;
      return interpolatePose(kf1.pose, kf2.pose, progress, kf2.easing);
    }
  }

  return defaultPose;
}

/**
 * Evaluates position and tangent orientation along a Bézier motion path
 */
export function evaluateMotionPath(
  path: MotionPath,
  tProgress: number
): { x: number; y: number; angle: number } {
  if (!path || !path.points || path.points.length === 0) {
    return { x: 50, y: 50, angle: 0 };
  }

  const pts = path.points;
  if (pts.length === 1) {
    return { x: pts[0].x, y: pts[0].y, angle: 0 };
  }

  // Eased progress
  const eased = evaluateEasing(tProgress, path.speedEasing || 'ease-in-out');
  const totalSegments = path.closed ? pts.length : pts.length - 1;
  const rawIdx = eased * totalSegments;
  const segIdx = Math.min(totalSegments - 1, Math.floor(rawIdx));
  const segT = rawIdx - segIdx;

  const p0 = pts[segIdx];
  const p3 = pts[(segIdx + 1) % pts.length];

  // Control handles
  const hOut = p0.handleOut || { x: p0.x + (p3.x - p0.x) * 0.33, y: p0.y + (p3.y - p0.y) * 0.33 };
  const hIn = p3.handleIn || { x: p3.x - (p3.x - p0.x) * 0.33, y: p3.y - (p3.y - p0.y) * 0.33 };

  // Cubic Bezier evaluation
  const oneMinusT = 1 - segT;
  const x =
    oneMinusT * oneMinusT * oneMinusT * p0.x +
    3 * oneMinusT * oneMinusT * segT * hOut.x +
    3 * oneMinusT * segT * segT * hIn.x +
    segT * segT * segT * p3.x;

  const y =
    oneMinusT * oneMinusT * oneMinusT * p0.y +
    3 * oneMinusT * oneMinusT * segT * hOut.y +
    3 * oneMinusT * segT * segT * hIn.y +
    segT * segT * segT * p3.y;

  // Tangent derivative for auto-orient
  const dx =
    3 * oneMinusT * oneMinusT * (hOut.x - p0.x) +
    6 * oneMinusT * segT * (hIn.x - hOut.x) +
    3 * segT * segT * (p3.x - hIn.x);

  const dy =
    3 * oneMinusT * oneMinusT * (hOut.y - p0.y) +
    6 * oneMinusT * segT * (hIn.y - hOut.y) +
    3 * segT * segT * (p3.y - hIn.y);

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return { x, y, angle };
}

/**
 * Calculates Camera Shake waveform based on time and intensity
 */
export function calculateCameraShake(
  time: number,
  intensity: number,
  type: 'handheld' | 'earthquake' | 'vibration' | 'subtle' = 'handheld'
): { x: number; y: number; roll: number } {
  if (intensity <= 0) return { x: 0, y: 0, roll: 0 };

  let freq1 = 2.5;
  let freq2 = 4.1;
  let amp = intensity * 12;

  if (type === 'earthquake') {
    freq1 = 18.0;
    freq2 = 24.0;
    amp = intensity * 28;
  } else if (type === 'vibration') {
    freq1 = 35.0;
    freq2 = 42.0;
    amp = intensity * 6;
  } else if (type === 'subtle') {
    freq1 = 1.2;
    freq2 = 1.8;
    amp = intensity * 4;
  }

  const x = Math.sin(time * freq1) * amp * 0.7 + Math.sin(time * freq2 * 1.3) * (amp * 0.3);
  const y = Math.cos(time * freq2) * amp * 0.7 + Math.cos(time * freq1 * 1.5) * (amp * 0.3);
  const roll = Math.sin(time * (freq1 * 0.8)) * (intensity * 2.5);

  return { x, y, roll };
}
