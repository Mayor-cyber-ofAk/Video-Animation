import { Project, Scene, Shot, Character, Location, Prop, World, TimelineTrack, DrawingLayer, AnimationFrame } from '../types/studio';
import { createSampleAnimationFrames } from './sampleFrames';

const STORAGE_KEY = 'animora_studio_active_project';
const PROJECTS_LIST_KEY = 'animora_studio_projects_meta';

// Pre-generated high-fidelity asset paths
export const DEMO_ASSETS = {
  jayAvatar: '/src/assets/images/character_jay_1790672273898.jpg',
  maskedManAvatar: '/src/assets/images/character_masked_man_1790672288312.jpg',
  abandonedCityLocation: '/src/assets/images/location_abandoned_city_1790672302710.jpg',
  encounterShot: '/src/assets/images/shot_encounter_1790672321230.jpg',
};

export function createInitialDemoProject(): Project {
  const jay: Character = {
    id: 'char_jay',
    name: 'JAY',
    role: 'Protagonist',
    age: 21,
    personality: 'Hyper-vigilant, determined, morally grounded scavenger',
    avatarUrl: DEMO_ASSETS.jayAvatar,
    face: {
      shape: 'Sharp angular jaw, defined cheekbones',
      eyes: 'Intense amber eyes, focused stare',
      eyebrows: 'Naturally straight, slightly furrowed',
      nose: 'Straight bridge',
      mouth: 'Neutral pressed lips',
      skinTone: 'Fair with weathered urban undertone',
    },
    hair: {
      style: 'Messy textured crop with damp strands falling over forehead',
      color: 'Charcoal black',
      length: 'Medium short',
    },
    body: {
      height: '5ft 11in (180cm)',
      build: 'Athletic, lean, fast reflexes',
      proportions: 'Cinematic heroic proportions',
      posture: 'Alert, slightly guarded fighting stance',
    },
    clothing: {
      top: 'Matte black weather-proof technical jacket with high collar over slate-gray shirt',
      bottom: 'Tapered charcoal tactical pants with reinforced knee seams',
      shoes: 'Waterproof high-top combat sneakers with grip tread',
      accessories: ['Silver micro-data pendant', 'Fingerless moisture-wicking gloves'],
    },
    lockedAttributes: {
      face: true,
      hair: true,
      outfit: true,
      colorPalette: true,
      style: true,
      identity: true,
    },
    colorPalette: ['#121316', '#2D3035', '#C4820A', '#E8E8EC'],
    referenceImages: [
      { view: 'Front', imageUrl: DEMO_ASSETS.jayAvatar },
      { view: '3/4', imageUrl: DEMO_ASSETS.jayAvatar },
      { view: 'Close-up', imageUrl: DEMO_ASSETS.jayAvatar },
    ],
    expressions: [
      { expression: 'Neutral', intensity: 0.8 },
      { expression: 'Angry', intensity: 0.9 },
      { expression: 'Fearful', intensity: 0.5 },
      { expression: 'Surprised', intensity: 0.7 },
    ],
    currentPose: 'Standing alert in rain',
    skeletonJoints: [
      { name: 'head', x: 200, y: 80 },
      { name: 'neck', x: 200, y: 110 },
      { name: 'leftShoulder', x: 170, y: 130 },
      { name: 'rightShoulder', x: 230, y: 130 },
      { name: 'leftElbow', x: 150, y: 180 },
      { name: 'rightElbow', x: 250, y: 170 },
      { name: 'leftHand', x: 140, y: 230 },
      { name: 'rightHand', x: 240, y: 220 },
      { name: 'spine', x: 200, y: 190 },
      { name: 'pelvis', x: 200, y: 240 },
      { name: 'leftKnee', x: 180, y: 310 },
      { name: 'rightKnee', x: 220, y: 310 },
      { name: 'leftFoot', x: 175, y: 390 },
      { name: 'rightFoot', x: 225, y: 390 },
    ],
    voiceProfile: {
      tone: 'Grounded, controlled, slightly strained by cold rain',
      suggestedVoice: 'Puck',
      pitch: 0.95,
      speed: 1.0,
    },
  };

  const maskedMan: Character = {
    id: 'char_masked_man',
    name: 'THE MASKED MAN',
    role: 'Antagonist',
    age: 32,
    personality: 'Cold, calculated, lethal corporate operative',
    avatarUrl: DEMO_ASSETS.maskedManAvatar,
    face: {
      shape: 'Concealed by white porcelain theater mask',
      eyes: 'Shadowed hollows behind mask with subtle red sensor glow',
      eyebrows: 'Concealed',
      nose: 'Smooth porcelain mask ridge',
      mouth: 'Painted crimson slit',
      skinTone: 'Unknown',
    },
    hair: {
      style: 'Covered by deep hooded mantle',
      color: 'Dark charcoal',
      length: 'Unknown',
    },
    body: {
      height: '6ft 3in (191cm)',
      build: 'Imposing, broad shoulders, motionless discipline',
      proportions: 'Intimidating, heavy presence',
      posture: 'Perfect upright still statue',
    },
    clothing: {
      top: 'Long tailored high-collar weatherproof trenchcoat with hidden ballistic plating',
      bottom: 'Reinforced dark armor weave pants',
      shoes: 'Silent tread steel-toe boots',
      accessories: ['White porcelain mask with red geometric crest', 'Silver katana hilt on back harness'],
    },
    lockedAttributes: {
      face: true,
      hair: true,
      outfit: true,
      colorPalette: true,
      style: true,
      identity: true,
    },
    colorPalette: ['#0B0B0D', '#1F2024', '#8E1818', '#EEEEF0'],
    referenceImages: [
      { view: 'Front', imageUrl: DEMO_ASSETS.maskedManAvatar },
      { view: 'Close-up', imageUrl: DEMO_ASSETS.maskedManAvatar },
    ],
    expressions: [
      { expression: 'Neutral', intensity: 1.0 },
      { expression: 'Smirk', intensity: 0.6 },
    ],
    currentPose: 'Standing dead still under streetlight',
    voiceProfile: {
      tone: 'Whispering baritone with slight synthetic vocal modulation',
      suggestedVoice: 'Charon',
      pitch: 0.82,
      speed: 0.9,
    },
  };

  const abandonedCity: Location = {
    id: 'loc_abandoned_city',
    name: 'ABANDONED METROPOLIS - SECTOR 7',
    description: 'Vast rain-swept district of towering brutalist skyscrapers, shuttered storefronts, and flickering amber halogen streetlamps reflected in endless asphalt puddles.',
    timeOfDay: 'Night',
    weather: 'Heavy Storm',
    lighting: 'Cold cyan ambient moonlight pierced by single flickering amber streetlight',
    colorPalette: ['#0A0D14', '#152238', '#D4881E', '#778899'],
    style: 'Photorealistic',
    props: ['Rusted delivery drone', 'Flickering streetlamp pole', 'Crumbling concrete barricade'],
    referenceImageUrl: DEMO_ASSETS.abandonedCityLocation,
    locked: true,
  };

  const world: World = {
    id: 'world_neo_sol',
    name: 'THE LAST CITY',
    description: 'Post-collapse Megacity divided into abandoned lower sectors and orbital arcologies where megacorporations hunt lost neural archives.',
    rules: 'Constant acidic rainfall; streetlights operate on erratic municipal relays; synthetic identities are currency.',
    architecture: 'Neo-brutalist monolithic concrete and retrofitted cyber-industrial infrastructure.',
    technology: 'Early 22nd century cybernetics, quantum data relics, optical camouflage.',
    climate: 'Perpetual monsoon season, dense cold atmospheric fog.',
    culture: 'Shadow scavenger guilds vs corporate hit squads.',
    visualStyle: 'Photorealistic',
    timePeriod: 'Year 2108',
  };

  const props: Prop[] = [
    {
      id: 'prop_data_core',
      name: 'Encrypted Quantum Drive',
      category: 'Electronics',
      description: 'Cylindrical brass and glass memory cylinder glowing with internal indigo filament.',
    },
    {
      id: 'prop_katana',
      name: 'Ceramic Edge Katana',
      category: 'Weapons',
      description: 'Matte black anti-reflective blade carried by corporate shadow operatives.',
    },
    {
      id: 'prop_flickering_lamp',
      name: 'Relay Streetlight Model 4B',
      category: 'Street Objects',
      description: 'Heavy industrial streetlight with humming amber ballast and rusted base.',
    },
  ];

  const shots: Shot[] = [
    {
      id: 'shot_01',
      shotNumber: 1,
      name: 'Establishing Wide - The Drowned Avenue',
      duration: 6,
      action: 'High-angle wide shot of the desolate four-lane avenue. Heavy rain pours diagonally through the air, creating concentric ripple rings in standing water. Distant neon signs sputter out.',
      charactersPresent: [],
      locationId: 'loc_abandoned_city',
      camera: {
        angle: 'Wide',
        movement: 'Dolly',
        lens: '24mm',
        depthOfField: 'Deep',
        aperture: 'f/4.0',
        shakeIntensity: 0.1,
      },
      lighting: 'Cold slate-blue overcast with distant pulsing amber streetlamp',
      weather: 'Heavy Storm',
      mood: 'Desolate, haunting, vast silence',
      visualStyle: 'Photorealistic',
      dialogue: '',
      soundEffects: 'Torrential downpour drumming against corrugated metal, distant wind howling through skyscrapers',
      musicCue: 'Sub-bass 35Hz rumble with solitary bowed cello note',
      negativePrompt: 'cartoon, low quality, oversaturated, warm sunny daytime',
      generatedImageUrl: DEMO_ASSETS.abandonedCityLocation,
      vfx: {
        rain: true,
        snow: false,
        fog: true,
        sparks: false,
        smoke: false,
        lightning: true,
        filmGrain: 0.15,
        vignette: 0.35,
        cameraShake: 0.1,
        letterbox: true,
      },
      textOverlay: {
        content: 'SECTOR 07 — THE DRIFT',
        type: 'title',
        position: 'center',
        style: 'cinematic',
      },
      continuityTags: ['Rain active', 'Street empty', 'Night 02:40 AM'],
    },
    {
      id: 'shot_02',
      shotNumber: 2,
      name: 'Low Angle Tracking - Jay in Motion',
      duration: 8,
      action: 'Tracking shot keeping pace with Jay as he walks swiftly down the rain-slicked sidewalk. Water splashes beneath his combat sneakers; steam rises softly from his breath.',
      charactersPresent: ['char_jay'],
      locationId: 'loc_abandoned_city',
      camera: {
        angle: 'Low angle',
        movement: 'Tracking',
        lens: '35mm',
        depthOfField: 'Medium',
        aperture: 'f/2.0',
        shakeIntensity: 0.25,
      },
      lighting: 'Raking side light catching water drops on Jay’s black jacket',
      weather: 'Heavy Storm',
      mood: 'Urgent, focused, secretive',
      visualStyle: 'Photorealistic',
      dialogue: 'Jay (thinking): "Three more blocks to the extraction point. Just keep moving."',
      soundEffects: 'Rhythmic wet footfalls on asphalt, fabric rustle, water droplets splashing',
      musicCue: 'Pulsing synth arpeggio slowly layering in',
      negativePrompt: 'extra arms, deformed fingers, blurry face, anime style',
      generatedImageUrl: DEMO_ASSETS.jayAvatar,
      vfx: {
        rain: true,
        snow: false,
        fog: true,
        sparks: false,
        smoke: false,
        lightning: false,
        filmGrain: 0.2,
        vignette: 0.3,
        cameraShake: 0.2,
        letterbox: true,
      },
      textOverlay: {
        content: 'Jay: "Three more blocks to the extraction point. Just keep moving."',
        type: 'subtitle',
        position: 'bottom',
        style: 'cinematic',
      },
      continuityTags: ['Jay wearing black technical jacket', 'No injuries', 'Wet hair'],
    },
    {
      id: 'shot_03',
      shotNumber: 3,
      name: 'Extreme Close-Up - Sudden Realization',
      duration: 5,
      action: 'Tight focus on Jay’s face. He suddenly halts mid-stride. His amber eyes flick sharply toward the reflection in a dark puddle. His jaw tenses.',
      charactersPresent: ['char_jay'],
      locationId: 'loc_abandoned_city',
      camera: {
        angle: 'Extreme close-up',
        movement: 'Push in',
        lens: '85mm',
        depthOfField: 'Shallow',
        aperture: 'f/1.4',
        shakeIntensity: 0.05,
      },
      lighting: 'Intense specular eye lights reflecting raindrops',
      weather: 'Heavy Storm',
      mood: 'Immediate tension, heart rate spike',
      visualStyle: 'Photorealistic',
      dialogue: 'Jay (whispering): "Footsteps..."',
      soundEffects: 'A heavy, deliberate boot step behind him. Water splash.',
      musicCue: 'Music drops to a dead stop. Sharp metallic tension riser.',
      negativePrompt: 'plastic eyes, cartoon eyelashes, doll face',
      generatedImageUrl: DEMO_ASSETS.jayAvatar,
      vfx: {
        rain: true,
        snow: false,
        fog: true,
        sparks: false,
        smoke: false,
        lightning: false,
        filmGrain: 0.25,
        vignette: 0.45,
        cameraShake: 0.05,
        letterbox: true,
      },
      textOverlay: {
        content: 'Jay: "Footsteps..."',
        type: 'subtitle',
        position: 'bottom',
        style: 'cinematic',
      },
      continuityTags: ['Jay halted', 'Hearing footsteps from rear'],
    },
    {
      id: 'shot_04',
      shotNumber: 4,
      name: 'Medium Dutch Angle - The Turn',
      duration: 6,
      action: 'Jay slowly spins 180 degrees, his left hand instinctively dropping to the pocket containing the quantum drive. The camera tilts slightly into a Dutch angle.',
      charactersPresent: ['char_jay'],
      locationId: 'loc_abandoned_city',
      camera: {
        angle: 'Dutch angle',
        movement: 'Pan',
        lens: '50mm',
        depthOfField: 'Medium',
        aperture: 'f/2.8',
        shakeIntensity: 0.3,
      },
      lighting: 'Flickering amber light swinging from overhead',
      weather: 'Heavy Storm',
      mood: 'Anticipation, dread',
      visualStyle: 'Photorealistic',
      dialogue: 'Jay: "Show yourself!"',
      soundEffects: 'Jacket whipping in sudden gust of wind, electrical buzzing from dying streetlight transformer',
      musicCue: 'Low sub-bass pulse syncing with Jay’s breath',
      negativePrompt: 'distorted anatomy, deformed hands',
      generatedImageUrl: DEMO_ASSETS.encounterShot,
      vfx: {
        rain: true,
        snow: false,
        fog: true,
        sparks: true,
        smoke: false,
        lightning: false,
        filmGrain: 0.2,
        vignette: 0.4,
        cameraShake: 0.25,
        letterbox: true,
      },
      textOverlay: {
        content: 'Jay: "Show yourself!"',
        type: 'subtitle',
        position: 'bottom',
        style: 'cinematic',
      },
      continuityTags: ['Jay facing rear', '180-degree axis flipped'],
    },
    {
      id: 'shot_05',
      shotNumber: 5,
      name: 'Slow Push-in - The Reveal of the Masked Man',
      duration: 8,
      action: 'Thirty yards down the dark street, a towering figure in a black trenchcoat stands motionless beneath a solitary cone of amber light. Water cascades off his gleaming white porcelain mask.',
      charactersPresent: ['char_masked_man'],
      locationId: 'loc_abandoned_city',
      camera: {
        angle: 'Medium',
        movement: 'Push in',
        lens: '85mm',
        depthOfField: 'Shallow',
        aperture: 'f/1.8',
        shakeIntensity: 0.1,
      },
      lighting: 'Single directional cone of amber light from above streetlight',
      weather: 'Heavy Storm',
      mood: 'Menacing, calm, predatory',
      visualStyle: 'Photorealistic',
      dialogue: 'The Masked Man: "You have walked far enough, Jay."',
      soundEffects: 'Deep synthetic-filtered voice resonating through the rain, electrical arc snap',
      musicCue: 'Massive brass hit followed by dissonant drone',
      negativePrompt: 'cartoon villain, blurry mask, low detail',
      generatedImageUrl: DEMO_ASSETS.maskedManAvatar,
      vfx: {
        rain: true,
        snow: false,
        fog: true,
        sparks: true,
        smoke: true,
        lightning: true,
        filmGrain: 0.25,
        vignette: 0.5,
        cameraShake: 0.15,
        letterbox: true,
      },
      textOverlay: {
        content: 'The Masked Man: "You have walked far enough, Jay."',
        type: 'subtitle',
        position: 'bottom',
        style: 'cinematic',
      },
      continuityTags: ['Masked Man revealed', 'Standing under streetlight 4B'],
    },
    {
      id: 'shot_06',
      shotNumber: 6,
      name: 'Over-The-Shoulder Standoff',
      duration: 7,
      action: 'Looking past Jay’s wet shoulder down the alley at the Masked Man. Jay squares his shoulders, refusing to retreat. Lightning flashes, freezing both combatants in stark white silhouette.',
      charactersPresent: ['char_jay', 'char_masked_man'],
      locationId: 'loc_abandoned_city',
      camera: {
        angle: 'Over-the-shoulder',
        movement: 'Static',
        lens: '50mm',
        depthOfField: 'Medium',
        aperture: 'f/2.0',
        shakeIntensity: 0.1,
      },
      lighting: 'Sudden high-contrast lightning flash exposing both figures',
      weather: 'Heavy Storm',
      mood: 'Climactic cliffhanger, impending duel',
      visualStyle: 'Photorealistic',
      dialogue: 'Jay: "If you want this drive... you’re going to have to take it from me."',
      soundEffects: 'Thunderclap rattling windows, high-pitched electrical hum of drawing a concealed blade',
      musicCue: 'Crescendo of rhythmic percussion building to cut',
      negativePrompt: 'cartoonish effects, flat lighting',
      generatedImageUrl: DEMO_ASSETS.encounterShot,
      vfx: {
        rain: true,
        snow: false,
        fog: true,
        sparks: true,
        smoke: false,
        lightning: true,
        filmGrain: 0.3,
        vignette: 0.5,
        cameraShake: 0.3,
        letterbox: true,
      },
      textOverlay: {
        content: 'Jay: "If you want this drive... you’re going to have to take it from me."',
        type: 'subtitle',
        position: 'bottom',
        style: 'cinematic',
      },
      continuityTags: ['Standoff established', 'Both characters locked in frame'],
    },
  ];

  const scene01: Scene = {
    id: 'scene_01',
    sceneNumber: 1,
    title: 'THE FIRST ENCOUNTER',
    summary: 'Jay attempts to slip through the flooded streets of Sector 7 with an encrypted quantum drive, only to be ambushed by The Masked Man in a dead-end avenue.',
    durationSeconds: 40,
    shots,
    continuityWarnings: [],
    version: 1,
  };

  const timelineTracks: TimelineTrack[] = [
    {
      id: 'track_video',
      name: 'VIDEO / SHOTS',
      type: 'video',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_vid_1', trackId: 'track_video', name: 'Shot 01: Establishing Wide', start: 0, duration: 6, shotId: 'shot_01', color: '#6366F1' },
        { id: 'c_vid_2', trackId: 'track_video', name: 'Shot 02: Tracking Jay', start: 6, duration: 8, shotId: 'shot_02', color: '#6366F1' },
        { id: 'c_vid_3', trackId: 'track_video', name: 'Shot 03: Close-up Stop', start: 14, duration: 5, shotId: 'shot_03', color: '#6366F1' },
        { id: 'c_vid_4', trackId: 'track_video', name: 'Shot 04: The Turn', start: 19, duration: 6, shotId: 'shot_04', color: '#6366F1' },
        { id: 'c_vid_5', trackId: 'track_video', name: 'Shot 05: Masked Man Reveal', start: 25, duration: 8, shotId: 'shot_05', color: '#6366F1' },
        { id: 'c_vid_6', trackId: 'track_video', name: 'Shot 06: Standoff OTS', start: 33, duration: 7, shotId: 'shot_06', color: '#6366F1' },
      ],
    },
    {
      id: 'track_character',
      name: 'CHARACTERS',
      type: 'character',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_char_1', trackId: 'track_character', name: 'Jay (Walking)', start: 6, duration: 8, shotId: 'shot_02', color: '#EC4899' },
        { id: 'c_char_2', trackId: 'track_character', name: 'Jay (Face Close-up)', start: 14, duration: 5, shotId: 'shot_03', color: '#EC4899' },
        { id: 'c_char_3', trackId: 'track_character', name: 'Jay (Turning)', start: 19, duration: 6, shotId: 'shot_04', color: '#EC4899' },
        { id: 'c_char_4', trackId: 'track_character', name: 'Masked Man (Still)', start: 25, duration: 8, shotId: 'shot_05', color: '#F43F5E' },
        { id: 'c_char_5', trackId: 'track_character', name: 'Jay & Masked Man (Duel)', start: 33, duration: 7, shotId: 'shot_06', color: '#EC4899' },
      ],
    },
    {
      id: 'track_camera',
      name: 'CAMERA MOVEMENT',
      type: 'camera',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_cam_1', trackId: 'track_camera', name: 'Dolly Forward (24mm)', start: 0, duration: 6, shotId: 'shot_01', color: '#3B82F6' },
        { id: 'c_cam_2', trackId: 'track_camera', name: 'Tracking Walk (35mm)', start: 6, duration: 8, shotId: 'shot_02', color: '#3B82F6' },
        { id: 'c_cam_3', trackId: 'track_camera', name: 'Push In Sudden (85mm)', start: 14, duration: 5, shotId: 'shot_03', color: '#3B82F6' },
        { id: 'c_cam_4', trackId: 'track_camera', name: 'Dutch Pan 180°', start: 19, duration: 6, shotId: 'shot_04', color: '#3B82F6' },
        { id: 'c_cam_5', trackId: 'track_camera', name: 'Slow Push In (85mm)', start: 25, duration: 8, shotId: 'shot_05', color: '#3B82F6' },
        { id: 'c_cam_6', trackId: 'track_camera', name: 'OTS Static Lock', start: 33, duration: 7, shotId: 'shot_06', color: '#3B82F6' },
      ],
      keyframes: [
        { id: 'kf_cam_1', property: 'cameraPanX', time: 0, value: -20, easing: 'ease-in-out' },
        { id: 'kf_cam_2', property: 'cameraPanX', time: 6, value: 20, easing: 'smooth' },
        { id: 'kf_cam_3', property: 'cameraZoom', time: 14, value: 1.0, easing: 'ease-in' },
        { id: 'kf_cam_4', property: 'cameraZoom', time: 19, value: 1.25, easing: 'ease-out' },
        { id: 'kf_cam_5', property: 'cameraTilt', time: 25, value: -4, easing: 'bezier', bezierHandles: [0.25, 0.1, 0.25, 1.0] },
      ],
    },
    {
      id: 'track_dialogue',
      name: 'DIALOGUE / VO',
      type: 'dialogue',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_dia_1', trackId: 'track_dialogue', name: 'Jay: "Three more blocks..."', start: 8, duration: 4, shotId: 'shot_02', text: 'Three more blocks to the extraction point...', color: '#10B981' },
        { id: 'c_dia_2', trackId: 'track_dialogue', name: 'Jay: "Footsteps..."', start: 15.5, duration: 2, shotId: 'shot_03', text: 'Footsteps...', color: '#10B981' },
        { id: 'c_dia_3', trackId: 'track_dialogue', name: 'Jay: "Show yourself!"', start: 21, duration: 2.5, shotId: 'shot_04', text: 'Show yourself!', color: '#10B981' },
        { id: 'c_dia_4', trackId: 'track_dialogue', name: 'Masked Man: "You have walked far enough"', start: 27, duration: 4.5, shotId: 'shot_05', text: 'You have walked far enough, Jay.', color: '#059669' },
        { id: 'c_dia_5', trackId: 'track_dialogue', name: 'Jay: "Take it from me"', start: 34.5, duration: 4, shotId: 'shot_06', text: 'If you want this drive, you take it.', color: '#10B981' },
      ],
    },
    {
      id: 'track_sfx',
      name: 'SOUND EFFECTS (SFX)',
      type: 'sfx',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_sfx_1', trackId: 'track_sfx', name: 'Heavy Monsoon Rain Loop', start: 0, duration: 40, color: '#06B6D4' },
        { id: 'c_sfx_2', trackId: 'track_sfx', name: 'Wet Bootsteps Echo', start: 14, duration: 3, color: '#0891B2' },
        { id: 'c_sfx_3', trackId: 'track_sfx', name: 'Electrical Hum & Arc', start: 20, duration: 5, color: '#0891B2' },
        { id: 'c_sfx_4', trackId: 'track_sfx', name: 'Subwoofer Impact Hit', start: 25, duration: 4, color: '#0891B2' },
        { id: 'c_sfx_5', trackId: 'track_sfx', name: 'Thunderstrike Blast', start: 35, duration: 5, color: '#0891B2' },
      ],
    },
    {
      id: 'track_music',
      name: 'MUSIC BED',
      type: 'music',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_mus_1', trackId: 'track_music', name: 'Dark Cyberpunk Drone (35Hz Cello)', start: 0, duration: 14, color: '#8B5CF6' },
        { id: 'c_mus_2', trackId: 'track_music', name: 'Sudden Silence Stinger', start: 14, duration: 5, color: '#7C3AED' },
        { id: 'c_mus_3', trackId: 'track_music', name: 'Rising Tension Arpeggios', start: 19, duration: 14, color: '#8B5CF6' },
        { id: 'c_mus_4', trackId: 'track_music', name: 'Orchestral Standoff Hit', start: 33, duration: 7, color: '#6D28D9' },
      ],
    },
    {
      id: 'track_vfx',
      name: 'VFX / ATMOSPHERE',
      type: 'vfx',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_vfx_1', trackId: 'track_vfx', name: 'Volumetric Rain + Fog', start: 0, duration: 40, color: '#EAB308' },
        { id: 'c_vfx_2', trackId: 'track_vfx', name: 'Transformer Sparks', start: 19, duration: 8, color: '#CA8A04' },
        { id: 'c_vfx_3', trackId: 'track_vfx', name: 'Lightning Flash Silhouette', start: 35, duration: 2, color: '#EAB308' },
      ],
    },
    {
      id: 'track_text',
      name: 'SUBTITLES & TITLES',
      type: 'text',
      locked: false,
      muted: false,
      solo: false,
      clips: [
        { id: 'c_txt_1', trackId: 'track_text', name: 'Title: SECTOR 07', start: 1, duration: 4, text: 'SECTOR 07 — THE DRIFT', color: '#F97316' },
        { id: 'c_txt_2', trackId: 'track_text', name: 'Sub: Jay monologue', start: 8, duration: 4, text: 'Three more blocks to the extraction point...', color: '#FB923C' },
        { id: 'c_txt_3', trackId: 'track_text', name: 'Sub: Show yourself!', start: 21, duration: 2.5, text: 'Show yourself!', color: '#FB923C' },
        { id: 'c_txt_4', trackId: 'track_text', name: 'Sub: Masked Man', start: 27, duration: 4.5, text: 'You have walked far enough, Jay.', color: '#FB923C' },
        { id: 'c_txt_5', trackId: 'track_text', name: 'Sub: Standoff reply', start: 34.5, duration: 4, text: 'If you want this drive... take it from me.', color: '#FB923C' },
      ],
    },
  ];

  const drawingLayers: DrawingLayer[] = [
    { id: 'layer_bg', name: 'Background Rough', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
    { id: 'layer_char', name: 'Character Poses', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
    { id: 'layer_ink', name: 'Keyframe Inking', visible: true, locked: false, opacity: 1, blendMode: 'source-over' },
    { id: 'layer_fx', name: 'Atmosphere FX', visible: true, locked: false, opacity: 0.8, blendMode: 'screen' },
  ];

  const animationFrames: AnimationFrame[] = createSampleAnimationFrames();

  return {
    id: 'proj_last_city',
    title: 'THE LAST CITY',
    genre: 'Cyberpunk / Cinematic Live Action',
    logline: 'In the rain-drowned ruins of Sector 7, a courier with a stolen memory core confronts a silent masked assassin.',
    beginning: 'Jay navigates the flooded abandoned boulevard under heavy rain.',
    middle: 'Jay hears footfalls, turns around, and encounters The Masked Man.',
    ending: 'Both draw weapons in a lightning-lit standoff.',
    themes: ['Identity', 'Survival', 'Memory', 'Urban Isolation'],
    mood: 'Dark, tense, photorealistic cinematic suspense',
    targetDuration: '40 seconds',
    visualStyle: 'Photorealistic',
    styleLocked: true,
    globalStyleNotes: 'Shot on 35mm / 85mm anamorphic prime lenses, natural skin pores, physically plausible rain droplets, wet asphalt reflections, moody amber halogen against cold blue night.',
    scenes: [scene01],
    activeSceneId: 'scene_01',
    activeShotId: 'shot_01',
    characters: [jay, maskedMan],
    locations: [abandonedCity],
    worlds: [world],
    props,
    assets: [
      { id: 'asset_1', name: 'Jay Character Portrait', type: 'character', url: DEMO_ASSETS.jayAvatar, tags: ['jay', 'portrait', 'protagonist'], createdAt: Date.now() },
      { id: 'asset_2', name: 'The Masked Man Portrait', type: 'character', url: DEMO_ASSETS.maskedManAvatar, tags: ['antagonist', 'masked', 'assassin'], createdAt: Date.now() },
      { id: 'asset_3', name: 'Abandoned Metropolis Sector 7', type: 'location', url: DEMO_ASSETS.abandonedCityLocation, tags: ['city', 'rain', 'night', 'street'], createdAt: Date.now() },
      { id: 'asset_4', name: 'The Standoff Encounter Frame', type: 'image', url: DEMO_ASSETS.encounterShot, tags: ['shot', 'encounter', 'streetlight'], createdAt: Date.now() },
    ],
    timelineTracks,
    drawingLayers,
    animationFrames,
    activeFrameIndex: 0,
    motionPaths: [
      {
        id: 'path_demo',
        name: 'Sector 7 Alley Trajectory',
        points: [
          { id: 'p0', x: 20, y: 70, handleOut: { x: 32, y: 45 } },
          { id: 'p1', x: 55, y: 35, handleIn: { x: 44, y: 42 }, handleOut: { x: 68, y: 30 } },
          { id: 'p2', x: 82, y: 65, handleIn: { x: 76, y: 52 } },
        ],
        closed: false,
        speedEasing: 'ease-in-out',
      },
    ],
    timelineMarkers: [
      { id: 'm_1', time: 0, label: 'Scene Start', color: '#A855F7' },
      { id: 'm_2', time: 6, label: 'Footsteps', color: '#EC4899' },
      { id: 'm_3', time: 14, label: 'Camera Turn', color: '#38BDF8' },
      { id: 'm_4', time: 25, label: 'Reveal', color: '#10B981' },
      { id: 'm_5', time: 33, label: 'Standoff Peak', color: '#F59E0B' },
    ],
    timingSettings: {
      playbackSpeed: 1,
      fps: 24,
      holdExposure: 1,
      loopMode: 'loop',
    },
    onionSkinSettings: {
      enabled: true,
      framesBefore: 2,
      framesAfter: 1,
      opacity: 0.35,
      prevTint: '#EF4444',
      nextTint: '#10B981',
      showGhost: true,
      enablePrevious: true,
      enableNext: true,
    },
    continuityNotes: [],
    versions: [
      {
        id: 'ver_init',
        timestamp: Date.now(),
        name: 'Initial Master Scene',
        sceneCount: 1,
        shotCount: 6,
        snapshotJson: '',
      },
    ],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  };
}

export function loadActiveProject(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && parsed.scenes?.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not parse stored project, loading demo project:', err);
  }

  const demo = createInitialDemoProject();
  saveProject(demo);
  return demo;
}

export function saveProject(project: Project): void {
  try {
    const updated = { ...project, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Also update project list metadata
    const listRaw = localStorage.getItem(PROJECTS_LIST_KEY);
    const list = listRaw ? JSON.parse(listRaw) : [];
    const existingIdx = list.findIndex((p: any) => p.id === project.id);
    const meta = {
      id: project.id,
      title: project.title,
      genre: project.genre,
      visualStyle: project.visualStyle,
      sceneCount: project.scenes.length,
      shotCount: project.scenes.reduce((acc, s) => acc + s.shots.length, 0),
      updatedAt: Date.now(),
    };
    if (existingIdx >= 0) {
      list[existingIdx] = meta;
    } else {
      list.unshift(meta);
    }
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save project to localStorage:', err);
  }
}

export function exportProjectJson(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/\s+/g, '_').toUpperCase()}_PROJECT.animora.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function createSnapshotVersion(project: Project, versionName: string): Project {
  const version = {
    id: `ver_${Date.now()}`,
    timestamp: Date.now(),
    name: versionName,
    sceneCount: project.scenes.length,
    shotCount: project.scenes.reduce((acc, s) => acc + s.shots.length, 0),
    snapshotJson: JSON.stringify(project),
  };
  const updated = {
    ...project,
    versions: [version, ...(project.versions || [])],
  };
  saveProject(updated);
  return updated;
}
