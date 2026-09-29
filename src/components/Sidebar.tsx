import React from 'react';
import {
  Home,
  BookOpen,
  Users,
  Globe2,
  LayoutGrid,
  Clapperboard,
  PenTool,
  Film,
  Layers,
  Music,
  Sparkles,
  ShieldCheck,
  FolderOpen,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  category?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Studio Home', icon: Home, category: 'Overview' },
  { id: 'story', label: 'Story & Script', icon: BookOpen, category: 'Pre-Production' },
  { id: 'characters', label: 'Characters & Rig', icon: Users, category: 'Pre-Production' },
  { id: 'worlds', label: 'Worlds & Locations', icon: Globe2, category: 'Pre-Production' },
  { id: 'storyboard', label: 'Storyboard', icon: LayoutGrid, category: 'Production' },
  { id: 'scene_builder', label: 'AI Scene Builder', icon: Clapperboard, category: 'Production' },
  { id: 'drawing', label: 'Drawing & Inking', icon: PenTool, category: 'Production' },
  { id: 'animation', label: '2D Animation', icon: Film, category: 'Production' },
  { id: 'timeline', label: 'Multi-Track Timeline', icon: Layers, category: 'Post-Production' },
  { id: 'audio', label: 'Audio & Voices', icon: Music, category: 'Post-Production' },
  { id: 'vfx', label: 'Visual Effects', icon: Sparkles, category: 'Post-Production' },
  { id: 'continuity', label: 'Continuity Doctor', icon: ShieldCheck, category: 'Post-Production' },
  { id: 'assets', label: 'Asset Library', icon: FolderOpen, category: 'Assets' },
  { id: 'export', label: 'CapCut & Export', icon: Download, badge: 'CapCut', category: 'Export' },
  { id: 'settings', label: 'AI Engines & Settings', icon: Settings, category: 'System' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
}) => {
  return (
    <aside
      className={`bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-200 select-none z-20 flex-shrink-0 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Scrollable Nav List */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5 custom-scrollbar">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const showCategoryHeader =
            !collapsed && (idx === 0 || NAV_ITEMS[idx - 1].category !== item.category);

          return (
            <React.Fragment key={item.id}>
              {showCategoryHeader && item.category && (
                <div className="px-2.5 pt-3 pb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  {item.category}
                </div>
              )}
              <button
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all group relative cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/60 text-purple-200 border border-purple-800/50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-purple-400' : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}
                />
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.badge && (
                  <span className="text-[9px] bg-purple-900/60 text-purple-300 font-semibold px-1.5 py-0.5 rounded border border-purple-700/40">
                    {item.badge}
                  </span>
                )}

                {/* Floating tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-zinc-900 text-zinc-100 text-[11px] rounded shadow-xl border border-zinc-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Collapse/Expand Toggle Footer */}
      <div className="p-2 border-t border-zinc-900 flex items-center justify-between">
        {!collapsed && (
          <div className="text-[10px] text-zinc-400 px-2 tracking-tight">
            v1.0 · Ready to direct
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 rounded transition-colors ml-auto cursor-pointer"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
