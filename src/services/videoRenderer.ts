import { Scene, Shot, VFXSettings } from '../types/studio';

export interface RenderProgress {
  currentShotIndex: number;
  totalShots: number;
  currentSecond: number;
  totalSeconds: number;
  percentage: number;
  status: 'idle' | 'rendering' | 'encoding' | 'completed' | 'error';
  errorMessage?: string;
}

export class SceneVideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1920;
    this.canvas.height = 1080;
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Preloads images for shots
  private async preloadShotImages(shots: Shot[]): Promise<Map<string, HTMLImageElement>> {
    const map = new Map<string, HTMLImageElement>();
    const promises = shots.map((shot) => {
      const url = shot.generatedImageUrl || '/src/assets/images/location_abandoned_city_1790672302710.jpg';
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
          map.set(shot.id, img);
          resolve();
        };
        img.onerror = () => {
          // If fail, create a fallback canvas
          map.set(shot.id, img);
          resolve();
        };
        img.src = url;
      });
    });
    await Promise.all(promises);
    return map;
  }

  // Draw procedural VFX directly onto the frame
  private renderVFX(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    vfx: VFXSettings,
    time: number
  ) {
    // 1. Rain
    if (vfx.rain) {
      ctx.strokeStyle = 'rgba(180, 210, 255, 0.4)';
      ctx.lineWidth = 1.5;
      const dropCount = 180;
      for (let i = 0; i < dropCount; i++) {
        const seed = (i * 9301 + 49297) % 233280;
        const x = (seed % width + time * 350) % width;
        const y = (seed * 7 + time * 1200) % height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y + 28);
        ctx.stroke();
      }
    }

    // 2. Atmospheric Fog
    if (vfx.fog) {
      const fogGrad = ctx.createLinearGradient(0, height * 0.4, 0, height);
      fogGrad.addColorStop(0, 'rgba(10, 15, 25, 0)');
      fogGrad.addColorStop(1, 'rgba(20, 28, 45, 0.45)');
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Lightning Flash
    if (vfx.lightning && Math.sin(time * 8) > 0.94) {
      ctx.fillStyle = 'rgba(220, 240, 255, 0.35)';
      ctx.fillRect(0, 0, width, height);
    }

    // 4. Vignette
    if (vfx.vignette > 0) {
      const radius = Math.max(width, height) * 0.7;
      const vig = ctx.createRadialGradient(width / 2, height / 2, radius * 0.4, width / 2, height / 2, radius);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, `rgba(0,0,0,${Math.min(vfx.vignette, 0.85)})`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);
    }

    // 5. Film Grain
    if (vfx.filmGrain > 0) {
      const grainAmount = Math.floor(vfx.filmGrain * 1500);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let g = 0; g < grainAmount; g++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillRect(gx, gy, 2, 2);
      }
    }

    // 6. Letterbox (2.39:1 Cinema Anamorphic Bars)
    if (vfx.letterbox) {
      const barHeight = height * 0.12;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);
    }
  }

  // Draw subtitles / captions
  private renderSubtitles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    shot: Shot,
    vfx: VFXSettings
  ) {
    if (!shot.textOverlay?.content && !shot.dialogue) return;
    const text = shot.textOverlay?.content || shot.dialogue;
    if (!text) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const barHeight = vfx.letterbox ? height * 0.12 : 0;
    const yPos = shot.textOverlay?.position === 'top'
      ? barHeight + 60
      : shot.textOverlay?.position === 'center'
      ? height / 2
      : height - barHeight - 50;

    // Subtitle box background
    ctx.font = '600 32px "Inter", sans-serif';
    const textMetrics = ctx.measureText(text);
    const boxWidth = textMetrics.width + 48;
    const boxHeight = 56;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(width / 2 - boxWidth / 2, yPos - boxHeight / 2, boxWidth, boxHeight);

    // Text with soft shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, width / 2, yPos);
    ctx.restore();
  }

  // Master Render Scene to WebM/MP4 Blob
  async renderScene(
    scene: Scene,
    onProgress: (p: RenderProgress) => void,
    fps: number = 30,
    resolution: '1080p' | '720p' = '1080p'
  ): Promise<Blob> {
    const width = resolution === '1080p' ? 1920 : 1280;
    const height = resolution === '1080p' ? 1080 : 720;
    this.canvas.width = width;
    this.canvas.height = height;

    const shots = scene.shots;
    const totalDuration = shots.reduce((acc, s) => acc + s.duration, 0);
    const imageMap = await this.preloadShotImages(shots);

    const stream = this.canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000,
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    return new Promise<Blob>(async (resolve, reject) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        onProgress({
          currentShotIndex: shots.length,
          totalShots: shots.length,
          currentSecond: totalDuration,
          totalSeconds: totalDuration,
          percentage: 100,
          status: 'completed',
        });
        resolve(finalBlob);
      };

      recorder.onerror = (e) => {
        reject(e);
      };

      recorder.start();

      let globalTime = 0;
      let shotStartTime = 0;

      for (let shotIdx = 0; shotIdx < shots.length; shotIdx++) {
        const shot = shots[shotIdx];
        const shotDuration = shot.duration;
        const totalFramesInShot = Math.floor(shotDuration * fps);
        const img = imageMap.get(shot.id);

        for (let frame = 0; frame < totalFramesInShot; frame++) {
          const tInShot = frame / fps;
          const currentSec = shotStartTime + tInShot;
          const progressPercent = Math.min(99, Math.round((currentSec / totalDuration) * 100));

          onProgress({
            currentShotIndex: shotIdx + 1,
            totalShots: shots.length,
            currentSecond: currentSec,
            totalSeconds: totalDuration,
            percentage: progressPercent,
            status: 'rendering',
          });

          // Clear
          this.ctx.fillStyle = '#090A0F';
          this.ctx.fillRect(0, 0, width, height);

          // Camera movement simulation (Zoom / Pan / Tilt / Dutch Angle / Shake)
          this.ctx.save();
          let scale = 1.0;
          let panX = 0;
          let panY = 0;
          let roll = 0;

          if (shot.camera.movement === 'Push in' || shot.camera.movement === 'Dolly') {
            scale = 1.0 + (tInShot / shotDuration) * 0.12;
          } else if (shot.camera.movement === 'Pull out') {
            scale = 1.12 - (tInShot / shotDuration) * 0.12;
          } else if (shot.camera.movement === 'Pan' || shot.camera.movement === 'Tracking') {
            panX = ((tInShot / shotDuration) - 0.5) * 60;
          } else if (shot.camera.movement === 'Tilt') {
            panY = ((tInShot / shotDuration) - 0.5) * 40;
          }

          if (shot.camera.angle === 'Dutch angle') {
            roll = 0.08;
          }

          if (shot.camera.shakeIntensity && shot.camera.shakeIntensity > 0) {
            panX += (Math.random() - 0.5) * (shot.camera.shakeIntensity * 16);
            panY += (Math.random() - 0.5) * (shot.camera.shakeIntensity * 16);
            roll += (Math.random() - 0.5) * (shot.camera.shakeIntensity * 0.02);
          }

          this.ctx.translate(width / 2 + panX, height / 2 + panY);
          this.ctx.rotate(roll);
          this.ctx.scale(scale, scale);
          this.ctx.translate(-width / 2, -height / 2);

          // Draw image
          if (img && img.complete && img.naturalWidth > 0) {
            // Draw aspect cover
            const imgAspect = img.naturalWidth / img.naturalHeight;
            const canvasAspect = width / height;
            let drawW = width;
            let drawH = height;
            let drawX = 0;
            let drawY = 0;
            if (imgAspect > canvasAspect) {
              drawW = height * imgAspect;
              drawX = (width - drawW) / 2;
            } else {
              drawH = width / imgAspect;
              drawY = (height - drawH) / 2;
            }
            this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
          } else {
            // Stylized background card
            const grad = this.ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, '#15171E');
            grad.addColorStop(1, '#08090C');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, width, height);

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '700 48px "Cinzel", serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`SHOT ${shot.shotNumber}`, width / 2, height / 2 - 20);
            this.ctx.font = '400 24px "Inter", sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.fillText(shot.name, width / 2, height / 2 + 30);
          }

          this.ctx.restore();

          // Overlay Procedural VFX
          this.renderVFX(this.ctx, width, height, shot.vfx, globalTime);

          // Overlay Subtitles
          this.renderSubtitles(this.ctx, width, height, shot, shot.vfx);

          globalTime += 1 / fps;

          // Frame tick delay
          await new Promise((r) => setTimeout(r, 1000 / (fps * 2)));
        }

        shotStartTime += shotDuration;
      }

      onProgress({
        currentShotIndex: shots.length,
        totalShots: shots.length,
        currentSecond: totalDuration,
        totalSeconds: totalDuration,
        percentage: 99,
        status: 'encoding',
      });

      recorder.stop();
    });
  }
}

export const sceneRenderer = new SceneVideoRenderer();
