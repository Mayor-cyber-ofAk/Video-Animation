import { AnimationFrame, AnimationLayerItem, OnionSkinSettings } from '../types/studio';

/**
 * Image Cache to prevent re-fetching and flicker during high-speed scrubbing and playback
 */
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string, onLoaded?: () => void): HTMLImageElement | null {
  if (!url) return null;
  const cached = imageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }
  if (!cached) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (onLoaded) onLoaded();
    };
    img.src = url;
    imageCache.set(url, img);
    return null;
  }
  return null;
}

/**
 * Renders tinted ghost frames onto a target canvas context.
 * The farther a frame is from the current frame, the more transparent it becomes.
 */
export function renderOnionSkin(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frames: AnimationFrame[],
  activeFrameIndex: number,
  layers: AnimationLayerItem[],
  settings: OnionSkinSettings,
  onImagePending?: () => void
) {
  ctx.clearRect(0, 0, width, height);

  if (!settings || !settings.enabled) return;

  const step = Math.max(1, settings.step || 1);
  const masterOpacity = settings.opacity ?? 0.35;
  const prevBaseOpacity = settings.prevOpacity ?? masterOpacity;
  const nextBaseOpacity = settings.nextOpacity ?? masterOpacity;

  // Temporary canvas for tinting stroke pixels
  const tintCanvas = document.createElement('canvas');
  tintCanvas.width = width;
  tintCanvas.height = height;
  const tintCtx = tintCanvas.getContext('2d');
  if (!tintCtx) return;

  const drawTintedLayer = (
    img: HTMLImageElement,
    tintColor: string,
    opacity: number,
    layerOpacity: number
  ) => {
    tintCtx.clearRect(0, 0, width, height);

    // 1. Draw raw frame strokes
    tintCtx.globalAlpha = 1.0;
    tintCtx.globalCompositeOperation = 'source-over';
    tintCtx.drawImage(img, 0, 0, width, height);

    // 2. Tint pixels using source-in (only replaces non-transparent stroke pixels)
    tintCtx.globalCompositeOperation = 'source-in';
    tintCtx.fillStyle = tintColor;
    tintCtx.fillRect(0, 0, width, height);

    // 3. Composite tinted strokes onto main ghost canvas
    ctx.save();
    ctx.globalAlpha = Math.max(0.04, opacity * layerOpacity);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tintCanvas, 0, 0, width, height);
    ctx.restore();
  };

  // 1. PREVIOUS FRAMES (Warm / Red Tint)
  if (settings.enablePrevious) {
    const maxBefore = settings.framesBefore || 2;
    for (let offset = maxBefore; offset >= 1; offset -= step) {
      const prevIdx = activeFrameIndex - offset;
      if (prevIdx >= 0 && prevIdx < frames.length) {
        const frame = frames[prevIdx];
        if (!frame || !frame.layers) continue;

        // Distance attenuation: farther frames become more transparent
        const distanceRatio = maxBefore <= 1 ? 1 : 1 - ((offset - 1) / maxBefore) * 0.65;
        const finalOpacity = prevBaseOpacity * distanceRatio;

        layers.forEach((layer) => {
          if (!layer.visible) return;
          const url = frame.layers[layer.id];
          if (!url) return;

          const img = getCachedImage(url, onImagePending);
          if (img) {
            drawTintedLayer(img, settings.prevTint || '#EF4444', finalOpacity, layer.opacity);
          } else {
            // Pre-load if not yet cached
            getCachedImage(url, onImagePending);
          }
        });
      }
    }
  }

  // 2. NEXT FRAMES (Cool / Green Tint)
  if (settings.enableNext) {
    const maxAfter = settings.framesAfter || 2;
    for (let offset = maxAfter; offset >= 1; offset -= step) {
      const nextIdx = activeFrameIndex + offset;
      if (nextIdx < frames.length) {
        const frame = frames[nextIdx];
        if (!frame || !frame.layers) continue;

        // Distance attenuation: farther frames become more transparent
        const distanceRatio = maxAfter <= 1 ? 1 : 1 - ((offset - 1) / maxAfter) * 0.65;
        const finalOpacity = nextBaseOpacity * distanceRatio;

        layers.forEach((layer) => {
          if (!layer.visible) return;
          const url = frame.layers[layer.id];
          if (!url) return;

          const img = getCachedImage(url, onImagePending);
          if (img) {
            drawTintedLayer(img, settings.nextTint || '#10B981', finalOpacity, layer.opacity);
          } else {
            getCachedImage(url, onImagePending);
          }
        });
      }
    }
  }
}
