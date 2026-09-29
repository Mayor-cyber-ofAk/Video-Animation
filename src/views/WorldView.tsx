import React, { useState } from 'react';
import {
  Globe2,
  MapPin,
  Package,
  Plus,
  Lock,
  Unlock,
  Sparkles,
  Camera,
  Layers,
  Edit2,
  Copy,
  Trash2,
} from 'lucide-react';
import { Project, Location, Prop, World } from '../types/studio';
import { aiImageEngine } from '../services/aiProviders';

interface WorldViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  setActiveView: (view: string) => void;
}

export const WorldView: React.FC<WorldViewProps> = ({
  project,
  onUpdateProject,
  setActiveView,
}) => {
  const [activeTab, setActiveTab] = useState<'locations' | 'world' | 'props'>('locations');
  const [selectedLocId, setSelectedLocId] = useState<string>(project.locations[0]?.id || '');
  const [isGeneratingLocImg, setIsGeneratingLocImg] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const world = project.worlds[0] || {
    id: 'world_main',
    name: 'THE LAST CITY',
    description: 'A rain-soaked post-collapse metropolis',
    rules: 'Monsoon acid rain; electrical grids unstable',
    architecture: 'Neo-brutalist and cyber-industrial',
    technology: 'Quantum archives, cybernetics',
    climate: 'Heavy monsoon',
    culture: 'Shadow couriers vs corporate operatives',
    visualStyle: 'Photorealistic',
    timePeriod: 'Year 2108',
  };

  const selectedLoc = project.locations.find((l) => l.id === selectedLocId) || project.locations[0];

  const updateLocation = (locId: string, updates: Partial<Location>) => {
    onUpdateProject((prev) => ({
      ...prev,
      locations: prev.locations.map((l) => (l.id === locId ? { ...l, ...updates } : l)),
    }));
  };

  const handleAddNewLocation = () => {
    const newId = `loc_${Date.now()}`;
    const newLoc: Location = {
      id: newId,
      name: 'NEW LOCATION',
      description: 'Atmospheric scene setting...',
      timeOfDay: 'Night',
      weather: 'Rain',
      lighting: 'Flickering sodium vapor lamps',
      colorPalette: ['#101216', '#252B36', '#4A5B73'],
      style: project.visualStyle,
      props: [],
      locked: true,
    };
    onUpdateProject((prev) => ({
      ...prev,
      locations: [...prev.locations, newLoc],
    }));
    setSelectedLocId(newId);
  };

  // Generate reference image for location
  const handleGenerateLocationImage = async () => {
    if (!selectedLoc) return;
    setIsGeneratingLocImg(true);
    setStatusMsg('Generating high-res location reference image...');
    try {
      const prompt = `Cinematic establishing shot of ${selectedLoc.name}: ${selectedLoc.description}. Time: ${selectedLoc.timeOfDay}, Weather: ${selectedLoc.weather}, Lighting: ${selectedLoc.lighting}. Style: ${project.visualStyle} photography, 24mm wide angle lens.`;
      const res = await aiImageEngine.generateImage({
        prompt,
        aspectRatio: '16:9',
      });
      updateLocation(selectedLoc.id, { referenceImageUrl: res.imageUrl });
      setStatusMsg('Location reference image added to library');
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setStatusMsg(`Image error: ${err.message}`);
    } finally {
      setIsGeneratingLocImg(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Globe2 className="w-4 h-4" />
            <span>World & Environment Architecture</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            WORLDS, LOCATIONS & PROPS
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Store persistent environmental rules, lighting schemes, and reusable location sets across scenes.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-3 py-1.5 rounded transition-colors font-medium cursor-pointer ${
              activeTab === 'locations' ? 'bg-purple-950/80 border border-purple-800/60 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Location Library ({project.locations.length})
          </button>
          <button
            onClick={() => setActiveTab('world')}
            className={`px-3 py-1.5 rounded transition-colors font-medium cursor-pointer ${
              activeTab === 'world' ? 'bg-purple-950/80 border border-purple-800/60 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            World Rules & Lore
          </button>
          <button
            onClick={() => setActiveTab('props')}
            className={`px-3 py-1.5 rounded transition-colors font-medium cursor-pointer ${
              activeTab === 'props' ? 'bg-purple-950/80 border border-purple-800/60 text-purple-200' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Prop Library ({project.props.length})
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-2.5 bg-purple-950/80 border border-purple-700/60 text-purple-200 rounded-lg text-xs">
          {statusMsg}
        </div>
      )}

      {/* 1. LOCATIONS TAB */}
      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Location List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Saved Sets & Environments
              </span>
              <button
                onClick={handleAddNewLocation}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Location</span>
              </button>
            </div>

            <div className="space-y-2">
              {project.locations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocId(loc.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    loc.id === selectedLoc?.id
                      ? 'bg-purple-950/40 border-purple-700/80 shadow-md'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-100">{loc.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLocation(loc.id, { locked: !loc.locked });
                      }}
                      className="text-zinc-500 hover:text-zinc-300"
                      title={loc.locked ? 'Location locked for consistency' : 'Location unlocked'}
                    >
                      {loc.locked ? <Lock className="w-3.5 h-3.5 text-purple-400" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{loc.description}</div>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-500">
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">{loc.timeOfDay}</span>
                    <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">{loc.weather}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Detail & Reference Image */}
          {selectedLoc && (
            <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <input
                  type="text"
                  value={selectedLoc.name}
                  onChange={(e) => updateLocation(selectedLoc.id, { name: e.target.value.toUpperCase() })}
                  className="text-lg font-bold uppercase text-zinc-100 bg-transparent border-b border-transparent focus:border-purple-600 outline-none w-full max-w-md"
                />
                <button
                  onClick={handleGenerateLocationImage}
                  disabled={isGeneratingLocImg}
                  className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isGeneratingLocImg ? 'Generating...' : 'Generate Visual Set'}</span>
                </button>
              </div>

              {/* Reference Preview Image */}
              <div className="w-full aspect-video rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden relative flex items-center justify-center">
                {selectedLoc.referenceImageUrl ? (
                  <img
                    src={selectedLoc.referenceImageUrl}
                    alt={selectedLoc.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 text-zinc-600 text-xs">
                    <Camera className="w-10 h-10 mx-auto mb-2 text-zinc-700" />
                    <span>Click "Generate Visual Set" to produce a master environment plate</span>
                  </div>
                )}
              </div>

              {/* Description & Lighting Parameters */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                    Environment Description
                  </label>
                  <textarea
                    rows={3}
                    value={selectedLoc.description}
                    onChange={(e) => updateLocation(selectedLoc.id, { description: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-200 outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Time of Day</label>
                    <select
                      value={selectedLoc.timeOfDay}
                      onChange={(e) => updateLocation(selectedLoc.id, { timeOfDay: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                    >
                      <option value="Night">Night</option>
                      <option value="Golden Hour">Golden Hour</option>
                      <option value="Day">Day</option>
                      <option value="Dawn">Dawn</option>
                      <option value="Twilight">Twilight</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Weather</label>
                    <select
                      value={selectedLoc.weather}
                      onChange={(e) => updateLocation(selectedLoc.id, { weather: e.target.value as any })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                    >
                      <option value="Heavy Storm">Heavy Storm</option>
                      <option value="Rain">Rain</option>
                      <option value="Clear">Clear</option>
                      <option value="Snow">Snow</option>
                      <option value="Foggy">Foggy</option>
                      <option value="Overcast">Overcast</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Lighting Key</label>
                    <input
                      type="text"
                      value={selectedLoc.lighting}
                      onChange={(e) => updateLocation(selectedLoc.id, { lighting: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. WORLD RULES TAB */}
      {activeTab === 'world' && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4 max-w-3xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-purple-400">
            World Lore & Physical Constraints
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">World Name</label>
              <input
                type="text"
                value={world.name}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200 font-bold"
                readOnly
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Fundamental World Rules</label>
              <textarea
                rows={3}
                value={world.rules}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-zinc-200"
                readOnly
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Architecture Style</label>
                <input
                  type="text"
                  value={world.architecture}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  readOnly
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Time Period</label>
                <input
                  type="text"
                  value={world.timePeriod}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-zinc-200"
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROPS TAB */}
      {activeTab === 'props' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Reusable Movie Props
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {project.props.map((prop) => (
              <div
                key={prop.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-zinc-100">{prop.name}</span>
                  <span className="text-[9px] bg-zinc-800 text-purple-400 font-mono px-1.5 py-0.5 rounded">
                    {prop.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{prop.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
