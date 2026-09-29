import React, { useState } from 'react';
import {
  Download,
  Film,
  Sparkles,
  Layers,
  CheckCircle2,
  Play,
  RotateCcw,
  Sliders,
  Settings,
  HardDrive,
  FileText,
  FileVideo,
  FileAudio,
} from 'lucide-react';
import { Project, Scene } from '../types/studio';
import { sceneRenderer, RenderProgress } from '../services/videoRenderer';
import { exportProjectJson } from '../services/storage';

interface ExportViewProps {
  project: Project;
}

export const ExportView: React.FC<ExportViewProps> = ({ project }) => {
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [separateAudioStems, setSeparateAudioStems] = useState(false);
  const [cleanVideoOnly, setCleanVideoOnly] = useState(false);

  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [renderedBlobUrl, setRenderedBlobUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const activeScene = project.scenes.find((s) => s.id === project.activeSceneId) || project.scenes[0];
  const sceneFileName = `${project.title.replace(/\s+/g, '_').toUpperCase()}_SCENE_${activeScene.sceneNumber
    .toString()
    .padStart(2, '0')}.mp4`;

  // Start Real Video Render
  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderedBlobUrl(null);
    try {
      const blob = await sceneRenderer.renderScene(
        activeScene,
        (progress) => {
          setRenderProgress(progress);
        },
        fps,
        resolution
      );

      const url = URL.createObjectURL(blob);
      setRenderedBlobUrl(url);
    } catch (err) {
      console.error('Render error:', err);
      setRenderProgress((prev) =>
        prev
          ? { ...prev, status: 'error', errorMessage: 'Rendering encountered an error' }
          : null
      );
    } finally {
      setIsRendering(false);
    }
  };

  const handleDownloadRenderedFile = () => {
    if (!renderedBlobUrl) return;
    const a = document.createElement('a');
    a.href = renderedBlobUrl;
    a.download = sceneFileName;
    a.click();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 space-y-6 custom-scrollbar text-zinc-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
            <Download className="w-4 h-4" />
            <span>Master Render & CapCut Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 font-['Cinzel'] tracking-wide mt-1">
            EXPORT FOR CAPCUT
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Render cinematic shots into sequential clips matching resolution, frame rate, and audio ready for CapCut timeline assembly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportProjectJson(project)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-medium cursor-pointer transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            <span>Export Project JSON</span>
          </button>
        </div>
      </div>

      {/* CapCut Export Settings & Pipeline Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Render Settings */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Export Specifications
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Resolution
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['1080p', '720p'] as const).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={`py-1.5 rounded border text-center font-mono font-medium transition-colors cursor-pointer ${
                      resolution === res
                        ? 'bg-purple-950/80 border-purple-600 text-purple-200'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {res} {res === '1080p' ? '(FHD)' : '(HD)'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">
                Frame Rate (FPS)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([24, 30, 60] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFps(f)}
                    className={`py-1.5 rounded border text-center font-mono font-medium transition-colors cursor-pointer ${
                      fps === f
                        ? 'bg-purple-950/80 border-purple-600 text-purple-200'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                <span className="text-zinc-300">Burned Subtitles & Dialogue</span>
                <input
                  type="checkbox"
                  checked={burnSubtitles}
                  onChange={(e) => setBurnSubtitles(e.target.checked)}
                  className="accent-purple-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded bg-zinc-950 border border-zinc-800/80 cursor-pointer">
                <span className="text-zinc-300">Export Separate Audio Stems</span>
                <input
                  type="checkbox"
                  checked={separateAudioStems}
                  onChange={(e) => setSeparateAudioStems(e.target.checked)}
                  className="accent-purple-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Render Queue & Output */}
        <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-100 uppercase">{sceneFileName}</h3>
                  <p className="text-xs text-zinc-400">
                    {activeScene.title} · {activeScene.shots.length} shots · {activeScene.durationSeconds}s
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-800/60 px-2.5 py-1 rounded">
                CapCut Ready
              </span>
            </div>

            {/* Rendering Progress Bar */}
            {renderProgress && (
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Status: <strong className="text-purple-300 capitalize">{renderProgress.status}</strong> (Shot {renderProgress.currentShotIndex}/{renderProgress.totalShots})
                  </span>
                  <span className="font-mono text-purple-400 font-bold">{renderProgress.percentage}%</span>
                </div>

                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-100"
                    style={{ width: `${renderProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Video Player Preview once rendered */}
            {renderedBlobUrl && (
              <div className="rounded-xl overflow-hidden border border-purple-700/60 shadow-xl space-y-2">
                <video
                  src={renderedBlobUrl}
                  controls
                  className="w-full aspect-video bg-black rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-zinc-500">
              Output conforms to CapCut 16:9 / 1080p MP4 track standard.
            </div>

            <div className="flex items-center gap-2">
              {renderedBlobUrl ? (
                <button
                  onClick={handleDownloadRenderedFile}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 text-white font-medium px-5 py-2.5 rounded-lg text-xs shadow-lg shadow-emerald-950 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {sceneFileName}</span>
                </button>
              ) : (
                <button
                  onClick={handleStartRender}
                  disabled={isRendering}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 text-white font-medium px-6 py-2.5 rounded-lg text-xs shadow-lg shadow-purple-950 cursor-pointer disabled:opacity-50"
                >
                  <Film className="w-4 h-4" />
                  <span>{isRendering ? 'Rendering Scene in Browser...' : 'Render Movie Scene'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
