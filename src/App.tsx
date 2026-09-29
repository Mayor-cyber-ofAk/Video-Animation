import React, { useState, useEffect } from 'react';
import { Project, Shot, Character, TimelineTrack } from './types/studio';
import {
  loadActiveProject,
  saveProject,
  createInitialDemoProject,
  createSnapshotVersion,
} from './services/storage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ScenePlayer } from './components/ScenePlayer';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline';
import { CommandPalette } from './components/CommandPalette';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';

// Specialized Views
import { HomeView } from './views/HomeView';
import { StoryView } from './views/StoryView';
import { CharacterCreatorView } from './views/CharacterCreatorView';
import { WorldView } from './views/WorldView';
import { StoryboardView } from './views/StoryboardView';
import { SceneBuilderView } from './views/SceneBuilderView';
import { DrawingStudioView } from './views/DrawingStudioView';
import { AnimationStudioView } from './views/AnimationStudioView';
import { AudioStudioView } from './views/AudioStudioView';
import { VFXStudioView } from './views/VFXStudioView';
import { ContinuityView } from './views/ContinuityView';
import { AssetManagerView } from './views/AssetManagerView';
import { ExportView } from './views/ExportView';
import { SettingsView } from './views/SettingsView';

export default function App() {
  const [project, setProject] = useState<Project>(() => loadActiveProject());
  const [activeView, setActiveView] = useState<string>('scene_builder');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Debounced Autosave
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProject(project);
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject(project);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const activeShot = activeScene?.shots.find((s) => s.id === project.activeShotId) || activeScene?.shots[0] || null;
  const activeCharacter = project.characters[0] || null;

  // Shot updater
  const handleUpdateShot = (shotId: string, updates: Partial<Shot>) => {
    setProject((prev) => ({
      ...prev,
      scenes: prev.scenes.map((s) =>
        s.id === prev.activeSceneId
          ? {
              ...s,
              shots: s.shots.map((sh) => (sh.id === shotId ? { ...sh, ...updates } : sh)),
            }
          : s
      ),
    }));
  };

  // Character updater
  const handleUpdateCharacter = (charId: string, updates: Partial<Character>) => {
    setProject((prev) => ({
      ...prev,
      characters: prev.characters.map((c) => (c.id === charId ? { ...c, ...updates } : c)),
    }));
  };

  // Timeline track updater
  const handleUpdateTracks = (tracks: TimelineTrack[]) => {
    setProject((prev) => ({
      ...prev,
      timelineTracks: tracks,
    }));
  };

  const handleSelectShot = (shotId: string) => {
    setProject((prev) => ({
      ...prev,
      activeShotId: shotId,
    }));
  };

  const handleQuickSave = () => {
    saveProject(project);
  };

  const handleExportCapCut = () => {
    setActiveView('export');
  };

  const handleResetToDemo = () => {
    const demo = createInitialDemoProject();
    setProject(demo);
    saveProject(demo);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-none">
      {/* Top Header */}
      <Header
        project={project}
        activeView={activeView}
        setActiveView={setActiveView}
        onUpdateProject={setProject}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        isAssistantOpen={isAssistantOpen}
        onQuickSave={handleQuickSave}
        onExportCapCut={handleExportCapCut}
      />

      {/* Main Studio Body (Sidebar + Content Workspace + Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Studio Navigation Sidebar */}
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          collapsed={isSidebarCollapsed}
          setCollapsed={setIsSidebarCollapsed}
        />

        {/* Center Workspace View Routing */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-zinc-950">
          {activeView === 'home' && (
            <HomeView
              project={project}
              onUpdateProject={setProject}
              setActiveView={setActiveView}
              onNewProject={handleResetToDemo}
            />
          )}

          {activeView === 'story' && (
            <StoryView
              project={project}
              onUpdateProject={setProject}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'characters' && (
            <CharacterCreatorView
              project={project}
              onUpdateProject={setProject}
              activeCharacterId={activeCharacter?.id}
            />
          )}

          {activeView === 'worlds' && (
            <WorldView
              project={project}
              onUpdateProject={setProject}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'storyboard' && (
            <StoryboardView
              project={project}
              onUpdateProject={setProject}
              onSelectShot={handleSelectShot}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'drawing' && (
            <DrawingStudioView
              project={project}
              onUpdateProject={setProject}
              onSelectShot={handleSelectShot}
            />
          )}

          {activeView === 'animation' && (
            <AnimationStudioView
              project={project}
              onUpdateProject={setProject}
            />
          )}

          {activeView === 'audio' && (
            <AudioStudioView
              project={project}
              onUpdateProject={setProject}
            />
          )}

          {activeView === 'vfx' && (
            <VFXStudioView
              project={project}
              onUpdateProject={setProject}
            />
          )}

          {activeView === 'continuity' && (
            <ContinuityView
              project={project}
              onUpdateProject={setProject}
              onSelectShot={handleSelectShot}
              setActiveView={setActiveView}
            />
          )}

          {activeView === 'assets' && (
            <AssetManagerView
              project={project}
              onUpdateProject={setProject}
            />
          )}

          {activeView === 'export' && (
            <ExportView project={project} />
          )}

          {activeView === 'settings' && (
            <SettingsView />
          )}

          {/* Dedicated Scene Builder & Directing Workspace */}
          {activeView === 'scene_builder' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScenePlayer
                scene={activeScene}
                activeShot={activeShot}
                onSelectShot={handleSelectShot}
                visualStyle={project.visualStyle}
                project={project}
                currentTime={currentTime}
                onSeek={setCurrentTime}
                onUpdateProject={setProject}
              />
              <Timeline
                project={project}
                currentTime={currentTime}
                onSeek={setCurrentTime}
                onUpdateTracks={handleUpdateTracks}
                onSelectShot={handleSelectShot}
                onUpdateProject={setProject}
              />
            </div>
          )}

          {activeView === 'timeline' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScenePlayer
                scene={activeScene}
                activeShot={activeShot}
                onSelectShot={handleSelectShot}
                visualStyle={project.visualStyle}
                project={project}
                currentTime={currentTime}
                onSeek={setCurrentTime}
                onUpdateProject={setProject}
              />
              <Timeline
                project={project}
                currentTime={currentTime}
                onSeek={setCurrentTime}
                onUpdateTracks={handleUpdateTracks}
                onSelectShot={handleSelectShot}
                onUpdateProject={setProject}
              />
            </div>
          )}
        </main>

        {/* Right Context Inspector (Visible on Scene Builder, Timeline, Storyboard, VFX) */}
        {(activeView === 'scene_builder' ||
          activeView === 'timeline' ||
          activeView === 'storyboard' ||
          activeView === 'vfx') && (
          <Inspector
            project={project}
            activeShot={activeShot}
            onUpdateShot={handleUpdateShot}
            activeCharacter={activeCharacter}
            onUpdateCharacter={handleUpdateCharacter}
          />
        )}
      </div>

      {/* Floating / Slide-out Modals & Drawers */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setActiveView={setActiveView}
        project={project}
        onUpdateProject={setProject}
        onQuickSave={handleQuickSave}
      />

      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        project={project}
        onUpdateProject={setProject}
      />
    </div>
  );
}
