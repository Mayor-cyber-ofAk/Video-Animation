import React, { useState } from 'react';
import {
  FolderOpen,
  Search,
  Upload,
  Image as ImageIcon,
  Video,
  Music,
  Users,
  MapPin,
  Package,
  Trash2,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Project, Asset } from '../types/studio';

interface AssetManagerViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const AssetManagerView: React.FC<AssetManagerViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const assets = project.assets || [];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const type = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
        ? 'audio'
        : 'image';

      const newAsset: Asset = {
        id: `asset_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type,
        url: dataUrl,
        tags: ['uploaded', type],
        createdAt: Date.now(),
        sizeBytes: file.size,
      };

      onUpdateProject((prev) => ({
        ...prev,
        assets: [newAsset, ...(prev.assets || [])],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAsset = (id: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <FolderOpen className="w-4 h-4" />
            <span>Project Assets & Vault</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            ASSET LIBRARY
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage images, reference plates, synthesized audio stems, character portraits, and custom uploads.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-xs shadow-md shadow-purple-950 cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Media Asset</span>
          <input
            type="file"
            accept="image/*,audio/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assets by name or tag..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-zinc-200 outline-none focus:border-purple-600 text-xs"
          />
        </div>

        {/* Type pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {['all', 'character', 'location', 'image', 'audio', 'video'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                filterType === t
                  ? 'bg-purple-950 border border-purple-700/60 text-purple-200'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden flex flex-col justify-between group transition-all"
          >
            {/* Asset Preview */}
            <div className="aspect-square bg-zinc-950 relative overflow-hidden flex items-center justify-center border-b border-zinc-800/80">
              {asset.url && (asset.type === 'image' || asset.type === 'character' || asset.type === 'location') ? (
                <img
                  src={asset.url}
                  alt={asset.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : asset.type === 'audio' ? (
                <Music className="w-10 h-10 text-purple-400" />
              ) : (
                <Video className="w-10 h-10 text-indigo-400" />
              )}

              <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-xs text-[9px] font-mono uppercase px-2 py-0.5 rounded text-zinc-300 border border-white/10">
                {asset.type}
              </span>
            </div>

            {/* Asset Meta Info */}
            <div className="p-3 space-y-1.5 text-xs">
              <div className="font-semibold text-zinc-200 truncate">{asset.name}</div>
              <div className="flex flex-wrap gap-1">
                {asset.tags.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] text-zinc-500 bg-zinc-950 px-1.5 py-0.5 rounded"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-zinc-500">
                <span className="text-[10px]">{new Date(asset.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="p-1 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
