import React, { useState } from 'react';
import {
  Users,
  Plus,
  Lock,
  Unlock,
  Sparkles,
  Camera,
  Wand2,
  Trash2,
  Copy,
  CheckCircle2,
  Sliders,
  Volume2,
  Eye,
  Activity,
} from 'lucide-react';
import { Character, CharacterReference, CharacterExpression, Project, CharacterPose, PoseKeyframe } from '../types/studio';
import { aiImageEngine, aiVoiceEngine, GeminiTextGenerator } from '../services/aiProviders';
import { CharacterPoseAnimator } from '../components/CharacterPoseAnimator';

interface CharacterCreatorViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  activeCharacterId?: string | null;
}

const POSE_PRESETS = [
  'Standing alert',
  'Walking forward',
  'Running sprint',
  'Crouching stealth',
  'Fighting stance',
  'Punching right',
  'Drawing weapon',
  'Looking back over shoulder',
  'Sitting weary',
  'Aiming gun',
];

const EXPRESSION_PRESETS = [
  'Neutral',
  'Happy',
  'Angry',
  'Sad',
  'Fearful',
  'Surprised',
  'Smirk',
  'Crying',
  'Laughing',
];

export const CharacterCreatorView: React.FC<CharacterCreatorViewProps> = ({
  project,
  onUpdateProject,
  activeCharacterId,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<string>(
    activeCharacterId || project.characters[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'profile' | 'reference' | 'pose' | 'voice'>('profile');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [isGeneratingRefImage, setIsGeneratingRefImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const character = project.characters.find((c) => c.id === selectedCharId) || project.characters[0];

  const updateCharacter = (updates: Partial<Character>) => {
    if (!character) return;
    onUpdateProject((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => (c.id === character.id ? { ...c, ...updates } : c)),
    }));
  };

  const handleAddNewCharacter = () => {
    const newId = `char_${Date.now()}`;
    const newChar: Character = {
      id: newId,
      name: 'NEW CHARACTER',
      role: 'Supporting',
      age: 24,
      personality: 'Bold, mysterious, resolute',
      face: {
        shape: 'Oval',
        eyes: 'Dark brown, observant',
        eyebrows: 'Arched',
        nose: 'Straight',
        mouth: 'Neutral',
        skinTone: 'Warm olive',
      },
      hair: {
        style: 'Short textured undercut',
        color: 'Dark brown',
        length: 'Short',
      },
      body: {
        height: '5ft 10in (178cm)',
        build: 'Athletic lean',
        proportions: 'Realistic human',
        posture: 'Alert upright',
      },
      clothing: {
        top: 'Dark technical trenchcoat over knit shirt',
        bottom: 'Cargo trousers',
        shoes: 'Combat boots',
        accessories: ['Comms earpiece'],
      },
      lockedAttributes: {
        face: true,
        hair: true,
        outfit: true,
        colorPalette: true,
        style: true,
        identity: true,
      },
      colorPalette: ['#1A1A1E', '#3A3D40', '#9C6F3B', '#E5E5E5'],
      referenceImages: [],
      expressions: [
        { expression: 'Neutral', intensity: 1 },
        { expression: 'Angry', intensity: 0.8 },
      ],
      currentPose: 'Standing alert',
      skeletonJoints: [
        { name: 'head', x: 150, y: 50 },
        { name: 'neck', x: 150, y: 75 },
        { name: 'leftShoulder', x: 120, y: 90 },
        { name: 'rightShoulder', x: 180, y: 90 },
        { name: 'spine', x: 150, y: 140 },
        { name: 'pelvis', x: 150, y: 180 },
        { name: 'leftFoot', x: 130, y: 290 },
        { name: 'rightFoot', x: 170, y: 290 },
      ],
      voiceProfile: {
        tone: 'Calm, measured, clear',
        suggestedVoice: 'Kore',
        pitch: 1.0,
        speed: 1.0,
      },
    };

    onUpdateProject((prev) => ({
      ...prev,
      characters: [...prev.characters, newChar],
    }));
    setSelectedCharId(newId);
  };

  // AI Character Creator from prose prompt
  const handleGenerateAICharacter = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingProfile(true);
    setStatusMessage('Generating rich consistent character bible...');
    try {
      const res = await fetch('/api/ai/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: character?.name || 'Hero',
          promptDescription: aiPrompt,
          visualStyle: project.visualStyle,
        }),
      });
      const data = await res.json();
      updateCharacter({
        name: data.name,
        age: data.age,
        personality: data.personality,
        face: data.face,
        hair: data.hair,
        body: data.body,
        clothing: data.clothing,
        colorPalette: data.colorPalette,
        voiceProfile: data.voiceProfile,
      });
      setStatusMessage('Character bible populated with persistent visual attributes');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // Generate Reference Sheet View Image
  const handleGenerateReferenceView = async (viewName: 'Front' | 'Back' | 'Left' | 'Right' | '3/4' | 'Close-up') => {
    if (!character) return;
    setIsGeneratingRefImage(true);
    setStatusMessage(`Generating ${viewName} reference angle...`);
    try {
      const prompt = `Character reference sheet: ${character.name}, ${viewName} angle view, neutral background.
Face: ${character.face.shape}, ${character.face.eyes}, ${character.hair.style} ${character.hair.color}.
Clothing: ${character.clothing.top}, ${character.clothing.bottom}.
Style: ${project.visualStyle} character turnaround, high quality consistent design.`;

      const res = await aiImageEngine.generateImage({
        prompt,
        aspectRatio: viewName === 'Close-up' ? '1:1' : '3:4' as any,
      });

      const currentRefs = character.referenceImages || [];
      const updatedRefs = currentRefs.filter((r) => r.view !== viewName);
      updatedRefs.push({ view: viewName, imageUrl: res.imageUrl });

      updateCharacter({
        referenceImages: updatedRefs,
        avatarUrl: viewName === 'Front' || !character.avatarUrl ? res.imageUrl : character.avatarUrl,
      });

      setStatusMessage(`${viewName} angle added to character bible`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(`Ref image error: ${err.message}`);
    } finally {
      setIsGeneratingRefImage(false);
    }
  };

  if (!character) return null;

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-950 text-zinc-200">
      {/* Left Roster Column */}
      <div className="w-full md:w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400">
            <Users className="w-4 h-4" />
            <span>Cast & Characters</span>
          </div>
          <button
            onClick={handleAddNewCharacter}
            className="p-1 hover:bg-zinc-800 rounded text-purple-400 cursor-pointer"
            title="Create New Character"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {project.characters.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCharId(c.id)}
              className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                c.id === character.id
                  ? 'bg-purple-950/60 border border-purple-800/60 text-purple-200'
                  : 'hover:bg-zinc-900 border border-transparent text-zinc-400'
              }`}
            >
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-zinc-700 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 flex-shrink-0">
                  {c.name[0]}
                </div>
              )}
              <div className="truncate">
                <div className="font-semibold text-xs text-zinc-100 truncate">{c.name}</div>
                <div className="text-[10px] text-zinc-400 truncate">{c.role} · {c.age} yrs</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Character Workspace */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
        {statusMessage && (
          <div className="bg-purple-950/80 border border-purple-700/60 text-purple-200 p-2.5 rounded-lg text-xs flex items-center justify-between">
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Character Title Bar & Consistency Locks */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border border-purple-600 shadow-lg shadow-purple-950/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center text-xl font-bold text-purple-300">
                {character.name[0]}
              </div>
            )}
            <div>
              <input
                type="text"
                value={character.name}
                onChange={(e) => updateCharacter({ name: e.target.value.toUpperCase() })}
                className="text-xl font-bold uppercase text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-purple-600 outline-none"
              />
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={character.role}
                  onChange={(e) => updateCharacter({ role: e.target.value })}
                  placeholder="Role (Protagonist, Antagonist...)"
                  className="text-xs text-purple-400 bg-transparent outline-none w-36"
                />
                <span className="text-zinc-600">·</span>
                <span className="text-xs text-zinc-400">{character.age} years old</span>
              </div>
            </div>
          </div>

          {/* Identity Lock Toggles */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900 border border-zinc-800 p-1.5 rounded-lg text-xs">
            {(
              [
                { key: 'face', label: 'Face' },
                { key: 'hair', label: 'Hair' },
                { key: 'outfit', label: 'Outfit' },
                { key: 'colorPalette', label: 'Palette' },
                { key: 'identity', label: 'Identity' },
              ] as const
            ).map((item) => {
              const isLocked = Boolean(character.lockedAttributes[item.key]);
              return (
                <button
                  key={item.key}
                  onClick={() =>
                    updateCharacter({
                      lockedAttributes: {
                        ...character.lockedAttributes,
                        [item.key]: !isLocked,
                      },
                    })
                  }
                  className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors text-[11px] font-medium cursor-pointer ${
                    isLocked
                      ? 'bg-purple-950/80 border border-purple-700/60 text-purple-300'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={`Lock ${item.label} to enforce across all generated scenes`}
                >
                  {isLocked ? <Lock className="w-3 h-3 text-purple-400" /> : <Unlock className="w-3 h-3" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Character Generator Prompt */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Character Design Assistant</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. 21-year-old anime protagonist with black messy hair, brown eyes, black weather jacket and white sneakers..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 outline-none focus:border-purple-600"
            />
            <button
              onClick={handleGenerateAICharacter}
              disabled={isGeneratingProfile || !aiPrompt.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer flex-shrink-0"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isGeneratingProfile ? 'Designing...' : 'Generate Profile'}</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-zinc-800 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Physical Profile & Clothing
          </button>
          <button
            onClick={() => setActiveTab('reference')}
            className={`pb-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'reference'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Turnaround Reference Sheet (6 Views)
          </button>
          <button
            onClick={() => setActiveTab('pose')}
            className={`pb-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'pose'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Poses & 2D Rig
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`pb-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'voice'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Voice & Dialogue Profile
          </button>
        </div>

        {/* TAB 1: Profile & Clothing */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Face & Hair */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Face & Hair Architecture
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Face Shape</label>
                  <input
                    type="text"
                    value={character.face.shape}
                    onChange={(e) =>
                      updateCharacter({ face: { ...character.face, shape: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Eyes</label>
                  <input
                    type="text"
                    value={character.face.eyes}
                    onChange={(e) =>
                      updateCharacter({ face: { ...character.face, eyes: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Hair Style</label>
                  <input
                    type="text"
                    value={character.hair.style}
                    onChange={(e) =>
                      updateCharacter({ hair: { ...character.hair, style: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Hair Color</label>
                  <input
                    type="text"
                    value={character.hair.color}
                    onChange={(e) =>
                      updateCharacter({ hair: { ...character.hair, color: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Clothing & Wardrobe */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Wardrobe & Apparel
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Jacket / Shirt</label>
                  <input
                    type="text"
                    value={character.clothing.top}
                    onChange={(e) =>
                      updateCharacter({ clothing: { ...character.clothing, top: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Pants / Bottom</label>
                  <input
                    type="text"
                    value={character.clothing.bottom}
                    onChange={(e) =>
                      updateCharacter({ clothing: { ...character.clothing, bottom: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Footwear</label>
                  <input
                    type="text"
                    value={character.clothing.shoes}
                    onChange={(e) =>
                      updateCharacter({ clothing: { ...character.clothing, shoes: e.target.value } })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-xs text-zinc-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Turnaround Reference Sheet */}
        {activeTab === 'reference' && (
          <div className="space-y-4">
            <div className="text-xs text-zinc-400">
              Generate 6 key reference camera angles for character consistency across all scenes:
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {(['Front', 'Back', 'Left', 'Right', '3/4', 'Close-up'] as const).map((view) => {
                const existing = character.referenceImages?.find((r) => r.view === view);
                return (
                  <div
                    key={view}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex flex-col justify-between h-48 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-400">
                      <span>{view}</span>
                      {existing && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>

                    <div className="flex-1 rounded-lg bg-zinc-950 border border-zinc-800/80 overflow-hidden flex items-center justify-center relative">
                      {existing ? (
                        <img
                          src={existing.imageUrl}
                          alt={`${character.name} ${view}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-zinc-700" />
                      )}
                    </div>

                    <button
                      onClick={() => handleGenerateReferenceView(view)}
                      disabled={isGeneratingRefImage}
                      className="w-full py-1 bg-zinc-800 hover:bg-purple-900/60 text-zinc-200 hover:text-purple-200 text-[10px] rounded transition-colors cursor-pointer"
                    >
                      {existing ? 'Regenerate' : 'Generate View'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Poses & 2D Rig */}
        {activeTab === 'pose' && (
          <div className="h-[480px]">
            <CharacterPoseAnimator
              character={character}
              currentTime={0}
              savedPoses={project.savedPoses || []}
              poseKeyframes={project.poseKeyframes || []}
              onApplyPose={(pose: CharacterPose) => {
                updateCharacter({ currentPose: pose.name });
              }}
              onAddPoseKeyframe={(kf: PoseKeyframe) => {
                onUpdateProject((prev) => ({
                  ...prev,
                  poseKeyframes: [...(prev.poseKeyframes || []), kf],
                }));
              }}
              onSavePosePreset={(preset: CharacterPose) => {
                onUpdateProject((prev) => ({
                  ...prev,
                  savedPoses: [...(prev.savedPoses || []), preset],
                }));
              }}
            />
          </div>
        )}

        {/* TAB 4: Voice & Dialogue Profile */}
        {activeTab === 'voice' && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4 max-w-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Gemini Voice Profile & Speech Model
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Assigned Voice Persona (Gemini TTS)
                </label>
                <select
                  value={character.voiceProfile.suggestedVoice}
                  onChange={(e) =>
                    updateCharacter({
                      voiceProfile: {
                        ...character.voiceProfile,
                        suggestedVoice: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                >
                  <option value="Puck">Puck (Energetic / Young Male Protagonist)</option>
                  <option value="Charon">Charon (Deep / Mysterious Baritone Antagonist)</option>
                  <option value="Kore">Kore (Clear / Steady Female Lead)</option>
                  <option value="Fenrir">Fenrir (Heavy / Gritty Warrior)</option>
                  <option value="Zephyr">Zephyr (Soft / Whispering Calm)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                  Vocal Tone Description
                </label>
                <input
                  type="text"
                  value={character.voiceProfile.tone}
                  onChange={(e) =>
                    updateCharacter({
                      voiceProfile: {
                        ...character.voiceProfile,
                        tone: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
