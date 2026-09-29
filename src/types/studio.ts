export type VisualStyle =
  | 'Photorealistic'
  | 'Cinematic Live Action'
  | 'Hyperrealistic'
  | 'Documentary'
  | 'Anime'
  | 'Manga'
  | '2D Cartoon'
  | '3D Animation'
  | 'Stylized 3D'
  | 'Pixar-like 3D'
  | 'Disney-like Fantasy'
  | 'Stop-Motion'
  | 'Comic Book'
  | 'Graphic Novel'
  | 'Dark Fantasy'
  | 'Sci-Fi Cyberpunk'
  | 'Horror Animation'
  | 'High-Octane Action'
  | 'Hybrid 2D/3D'
  | 'Retro'
  | 'Custom';

export type ProjectFormat =
  | 'Feature Film'
  | 'Anime Episode'
  | 'Cartoon Episode'
  | 'Short Film'
  | 'Music Video'
  | 'Cinematic Sequence'
  | 'Game Cinematic'
  | 'Short Animation';

export interface StyleBible {
  artStyle: string;
  characterDesignRules: string;
  colorPalette: string[];
  lightingStyle: string;
  cameraStyle: string;
  environmentStyle: string;
  animationStyle: string;
  renderingStyle: string;
  lineStyle: string;
  facialStyle: string;
  negativeStyleRules: string;
}

export interface ActionBeat {
  id: string;
  beatNumber: number;
  title: string;
  type: 'notice' | 'attack' | 'dodge' | 'counter' | 'impact' | 'blast' | 'transformation' | 'climax';
  description: string;
  characterAttacking?: string;
  characterDefending?: string;
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  vfx: string[];
  speedLines: boolean;
  impactFrame: boolean;
}

export interface StructuredPrompt {
  id: string;
  name: string;
  subject: string;
  action: string;
  environment: string;
  camera: string;
  lighting: string;
  style: string;
  mood: string;
  motion: string;
  composition: string;
  detail: string;
  negativePrompt: string;
}

export interface SceneVersion {
  id: string;
  sceneId: string;
  versionNumber: number;
  label: string;
  createdAt: number;
  shotCount: number;
  summary: string;
  shotsSnapshot: Shot[];
}

export type CameraAngle =
  | 'Wide'
  | 'Medium'
  | 'Close-up'
  | 'Extreme close-up'
  | 'POV'
  | 'Over-the-shoulder'
  | 'Low angle'
  | 'High angle'
  | 'Dutch angle';

export type CameraMovement =
  | 'Static'
  | 'Pan'
  | 'Tilt'
  | 'Dolly'
  | 'Push in'
  | 'Pull out'
  | 'Tracking'
  | 'Orbit'
  | 'Crane'
  | 'Handheld';

export type CameraLens = '18mm' | '24mm' | '35mm' | '50mm' | '85mm' | '135mm';

export interface CameraSettings {
  angle: CameraAngle;
  movement: CameraMovement;
  lens: CameraLens;
  depthOfField: 'Deep' | 'Medium' | 'Shallow' | 'Extreme Bokeh';
  aperture?: string;
  focusDistance?: number;
  shakeIntensity?: number;
}

export interface VFXSettings {
  rain: boolean;
  snow: boolean;
  fog: boolean;
  sparks: boolean;
  smoke: boolean;
  lightning: boolean;
  filmGrain: number; // 0 - 1
  vignette: number; // 0 - 1
  cameraShake: number; // 0 - 1
  letterbox: boolean; // cinematic bars
}

export interface TextOverlay {
  content: string;
  type: 'subtitle' | 'caption' | 'title' | 'comic_bubble' | 'credits';
  position: 'bottom' | 'top' | 'center';
  style: 'cinematic' | 'anime' | 'comic';
}

export interface Shot {
  id: string;
  shotNumber: number;
  name: string;
  duration: number; // in seconds
  action: string;
  charactersPresent: string[];
  locationId: string;
  camera: CameraSettings;
  lighting: string;
  weather: string;
  mood: string;
  visualStyle: VisualStyle;
  dialogue?: string;
  soundEffects?: string;
  musicCue?: string;
  negativePrompt?: string;
  seed?: number;
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  generatedAudioUrl?: string;
  isGenerating?: boolean;
  generationProgress?: string;
  vfx: VFXSettings;
  textOverlay?: TextOverlay;
  continuityTags?: string[];
}

export interface Scene {
  id: string;
  sceneNumber: number;
  actNumber?: number; // 1, 2, 3
  chapterTitle?: string;
  title: string;
  summary: string;
  durationSeconds: number;
  shots: Shot[];
  continuityWarnings: string[];
  version: number;
  actionBeats?: ActionBeat[];
  versions?: SceneVersion[];
}

export interface CharacterReference {
  view: 'Front' | 'Back' | 'Left' | 'Right' | '3/4' | 'Close-up';
  imageUrl: string;
}

export interface CharacterExpression {
  expression: 'Neutral' | 'Happy' | 'Angry' | 'Sad' | 'Fearful' | 'Surprised' | 'Smirk' | 'Crying' | 'Laughing';
  intensity: number;
}

export interface SkeletonJoint {
  name: string;
  x: number;
  y: number;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  age: number;
  personality: string;
  face: {
    shape: string;
    eyes: string;
    eyebrows: string;
    nose: string;
    mouth: string;
    skinTone: string;
  };
  hair: {
    style: string;
    color: string;
    length: string;
  };
  body: {
    height: string;
    build: string;
    proportions: string;
    posture: string;
  };
  clothing: {
    top: string;
    bottom: string;
    shoes: string;
    accessories: string[];
  };
  lockedAttributes: {
    face: boolean;
    hair: boolean;
    outfit: boolean;
    colorPalette: boolean;
    style: boolean;
    identity: boolean;
  };
  colorPalette: string[];
  referenceImages: CharacterReference[];
  expressions: CharacterExpression[];
  currentPose: string;
  skeletonJoints?: SkeletonJoint[];
  voiceProfile: {
    tone: string;
    suggestedVoice: string;
    pitch: number;
    speed: number;
  };
  avatarUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  timeOfDay: 'Day' | 'Golden Hour' | 'Night' | 'Dawn' | 'Twilight';
  weather: 'Clear' | 'Rain' | 'Heavy Storm' | 'Snow' | 'Foggy' | 'Overcast';
  lighting: string;
  colorPalette: string[];
  style: VisualStyle;
  props: string[];
  referenceImageUrl?: string;
  locked: boolean;
}

export interface World {
  id: string;
  name: string;
  description: string;
  rules: string;
  architecture: string;
  technology: string;
  climate: string;
  culture: string;
  visualStyle: VisualStyle;
  timePeriod: string;
}

export interface Prop {
  id: string;
  name: string;
  category: 'Vehicles' | 'Weapons' | 'Electronics' | 'Furniture' | 'Tools' | 'Sci-Fi' | 'Fantasy' | 'Street Objects' | 'Custom';
  description: string;
  imageUrl?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'character' | 'location' | 'prop' | 'style' | 'prompt';
  url: string;
  tags: string[];
  createdAt: number;
  sizeBytes?: number;
}

export type TrackType =
  | 'video'
  | 'character'
  | 'background'
  | 'props'
  | 'camera'
  | 'dialogue'
  | 'voice'
  | 'music'
  | 'sfx'
  | 'text'
  | 'vfx';

export interface TimelineClip {
  id: string;
  trackId: string;
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  shotId?: string;
  mediaUrl?: string;
  color?: string;
  volume?: number;
  opacity?: number;
  text?: string;
  keyframes?: Keyframe[];
}

export type InterpolationType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'smooth'
  | 'step'
  | 'bezier';

export type AnimProperty =
  | 'positionX'
  | 'positionY'
  | 'positionZ'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
  | 'rotationX'
  | 'rotationY'
  | 'rotationZ'
  | 'opacity'
  | 'cameraPanX'
  | 'cameraPanY'
  | 'cameraZoom'
  | 'cameraTilt'
  | 'cameraRoll'
  | 'cameraFocusDistance'
  | 'cameraShake'
  | 'volume'
  | 'blur'
  | 'vfxIntensity';

export interface Keyframe {
  id: string;
  property: AnimProperty;
  time: number; // in seconds
  value: number;
  easing: InterpolationType;
  bezierHandles?: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface MotionPathPoint {
  id: string;
  x: number; // 0 to 100 percentage of viewport width
  y: number; // 0 to 100 percentage of viewport height
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

export interface MotionPath {
  id: string;
  name: string;
  points: MotionPathPoint[];
  closed: boolean;
  speedEasing: InterpolationType;
  attachedObjectId?: string;
}

export interface CharacterPose {
  id: string;
  name: string;
  headRotation: number;
  headTilt: number;
  bodyRotation: number;
  bodyLean: number;
  leftUpperArm: number;
  leftForearm: number;
  leftHand: 'open' | 'fist' | 'point' | 'relax' | 'wave';
  rightUpperArm: number;
  rightForearm: number;
  rightHand: 'open' | 'fist' | 'point' | 'relax' | 'wave';
  leftThigh: number;
  leftCalf: number;
  leftFoot: number;
  rightThigh: number;
  rightCalf: number;
  rightFoot: number;
  expression: 'Neutral' | 'Happy' | 'Angry' | 'Sad' | 'Fearful' | 'Surprised' | 'Smirk' | 'Crying';
  eyeDirection: 'left' | 'center' | 'right' | 'up' | 'down';
  eyeBlink: number; // 0 to 1
  mouthExpression: 'closed' | 'open' | 'smile' | 'frown' | 'phoneme_a' | 'phoneme_o' | 'phoneme_e' | 'phoneme_m';
  isPreset?: boolean;
}

export interface PoseKeyframe {
  id: string;
  characterId: string;
  time: number;
  pose: CharacterPose;
  easing: InterpolationType;
}

export interface OnionSkinSettings {
  enabled: boolean;
  framesBefore: number;
  framesAfter: number;
  step?: number;
  opacity: number;
  prevOpacity?: number;
  nextOpacity?: number;
  prevTint: string;
  nextTint: string;
  showGhost: boolean;
  enablePrevious: boolean;
  enableNext: boolean;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface CameraRig {
  panX: number;
  panY: number;
  tilt: number;
  roll: number;
  dollyZ: number;
  zoomFov: number; // 18 to 135
  focusDistance: number; // 0 to 100
  dofBlur: number; // 0 to 1
  shakeIntensity: number;
  shakeType: 'handheld' | 'earthquake' | 'vibration' | 'subtle';
  rackFocusTarget?: 'foreground' | 'subject' | 'background';
  multiView: 'single' | 'split-camera' | 'top-down';
}

export interface AnimationLayerItem {
  id: string;
  name: string;
  type: 'body' | 'facial' | 'camera' | 'clothing' | 'effects' | 'background' | 'custom';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: 'source-over' | 'multiply' | 'screen' | 'overlay';
}

export interface TimingSettings {
  playbackSpeed: number; // 0.25, 0.5, 1, 1.5, 2
  fps: number;
  holdExposure: 1 | 2 | 3;
  loopMode: 'loop' | 'bounce' | 'once';
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  locked: boolean;
  muted: boolean;
  solo: boolean;
  clips: TimelineClip[];
  keyframes?: Keyframe[];
}

export interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: 'source-over' | 'multiply' | 'screen' | 'overlay';
  canvasDataUrl?: string;
}

export interface AnimationFrame {
  id: string;
  frameIndex: number;
  durationMs: number;
  holdCount?: number; // e.g. 1, 2, 3 frames exposure
  layers: { [layerId: string]: string }; // dataURLs
}

export interface ContinuityNote {
  id: string;
  shotId: string;
  severity: 'high' | 'medium' | 'low';
  issue: string;
  suggestedFix: string;
  resolved: boolean;
}

export interface ProjectVersion {
  id: string;
  timestamp: number;
  name: string;
  sceneCount: number;
  shotCount: number;
  snapshotJson: string;
}

export interface Project {
  id: string;
  title: string;
  format?: ProjectFormat;
  genre: string;
  logline: string;
  beginning?: string;
  middle?: string;
  ending?: string;
  themes: string[];
  mood: string;
  targetDuration: string;
  visualStyle: VisualStyle;
  styleLocked: boolean;
  globalStyleNotes: string;
  styleBible?: StyleBible;
  promptLibrary?: StructuredPrompt[];
  resolution?: '1080p' | '4K' | '720p';
  aspectRatio?: '16:9' | '9:16' | '2.39:1' | '4:3';
  targetFps?: 12 | 24 | 30 | 60;
  scenes: Scene[];
  activeSceneId: string;
  activeShotId: string | null;
  characters: Character[];
  locations: Location[];
  worlds: World[];
  props: Prop[];
  assets: Asset[];
  timelineTracks: TimelineTrack[];
  drawingLayers: DrawingLayer[];
  animationFrames: AnimationFrame[];
  activeFrameIndex: number;
  animationLayers?: AnimationLayerItem[];
  motionPaths?: MotionPath[];
  poseKeyframes?: PoseKeyframe[];
  onionSkinSettings?: OnionSkinSettings;
  cameraRig?: CameraRig;
  timelineMarkers?: TimelineMarker[];
  timingSettings?: TimingSettings;
  savedPoses?: CharacterPose[];
  continuityNotes: ContinuityNote[];
  versions: ProjectVersion[];
  createdAt: number;
  updatedAt: number;
}

export interface AIProviderConfig {
  textProvider: 'gemini' | 'local';
  imageProvider: 'gemini' | 'local';
  videoProvider: 'veo' | 'client-canvas';
  voiceProvider: 'gemini-tts' | 'web-speech';
  audioProvider: 'procedural' | 'lyria';
  realismModeEnabled: boolean;
  geminiModel: string;
  imageModel: string;
  videoModel: string;
}

export interface CapCutExportSettings {
  resolution: '1080p' | '4K' | '720p';
  fps: 24 | 30 | 60;
  format: 'mp4' | 'webm';
  separateAudioStems: boolean;
  burnSubtitles: boolean;
  cleanVideoOnly: boolean;
  exportAllScenesIndividually: boolean;
}
