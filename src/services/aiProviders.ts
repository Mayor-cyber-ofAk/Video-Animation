import { Character, Shot, Scene, VisualStyle } from '../types/studio';

export interface TextGenerator {
  generateStory(params: {
    title: string;
    genre: string;
    logline: string;
    mood: string;
    targetDuration: string;
    visualStyle: VisualStyle;
  }): Promise<any>;

  generateShots(params: {
    sceneDescription: string;
    characters: string[];
    location: string;
    visualStyle: VisualStyle;
    targetShotCount?: number;
  }): Promise<any>;

  enhancePrompt(params: {
    userPrompt: string;
    visualStyle: VisualStyle;
    cameraLens?: string;
    lighting?: string;
    characterTags?: string;
  }): Promise<any>;

  askAssistant(params: {
    message: string;
    projectContext: any;
    conversationHistory: any[];
  }): Promise<string>;
}

export interface ImageGenerator {
  generateImage(params: {
    prompt: string;
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
    referenceImageBase64?: string;
  }): Promise<{ imageUrl: string }>;
}

export interface VideoGenerator {
  generateVideo(params: {
    prompt: string;
    imageBase64?: string;
    aspectRatio: '16:9' | '9:16';
    resolution?: '720p' | '1080p';
  }): Promise<{ operationName: string }>;

  pollStatus(operationName: string): Promise<{ done: boolean; error: string | null }>;

  downloadVideoBlob(operationName: string): Promise<Blob>;
}

export interface VoiceGenerator {
  generateVoice(params: {
    text: string;
    voiceName?: string;
    style?: string;
  }): Promise<{ audioBlob: Blob; audioUrl: string }>;
}

export interface AudioEngine {
  synthesizeSoundEffect(type: 'rain' | 'footsteps' | 'thunder' | 'drone' | 'spark'): AudioBuffer | null;
}

// Concrete Gemini Implementation
export class GeminiTextGenerator implements TextGenerator {
  async generateStory(params: any): Promise<any> {
    const res = await fetch('/api/ai/story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Story generation failed with status ${res.status}`);
    }
    return res.json();
  }

  async generateShots(params: any): Promise<any> {
    const res = await fetch('/api/ai/shots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Shot breakdown failed with status ${res.status}`);
    }
    return res.json();
  }

  async enhancePrompt(params: any): Promise<any> {
    const res = await fetch('/api/ai/enhance-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to enhance prompt');
    }
    return res.json();
  }

  async askAssistant(params: any): Promise<string> {
    const res = await fetch('/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'AI Assistant unavailable');
    }
    const data = await res.json();
    return data.reply;
  }
}

export class GeminiImageGenerator implements ImageGenerator {
  async generateImage(params: any): Promise<{ imageUrl: string }> {
    const res = await fetch('/api/ai/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Image generation failed with status ${res.status}`);
    }
    return res.json();
  }
}

export class VeoVideoGenerator implements VideoGenerator {
  async generateVideo(params: any): Promise<{ operationName: string }> {
    const res = await fetch('/api/ai/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Veo video generation failed with status ${res.status}`);
    }
    return res.json();
  }

  async pollStatus(operationName: string): Promise<{ done: boolean; error: string | null }> {
    const res = await fetch('/api/ai/video-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to check video status');
    }
    return res.json();
  }

  async downloadVideoBlob(operationName: string): Promise<Blob> {
    const res = await fetch('/api/ai/video-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to download video');
    }
    return res.blob();
  }
}

export class GeminiVoiceGenerator implements VoiceGenerator {
  async generateVoice(params: { text: string; voiceName?: string; style?: string }): Promise<{ audioBlob: Blob; audioUrl: string }> {
    const res = await fetch('/api/ai/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate voice');
    }
    const data = await res.json();
    const byteCharacters = atob(data.audioBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);
    return { audioBlob: blob, audioUrl };
  }
}

// Procedural Web Audio Engine for offline SFX & Atmosphere
export class WebAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playRain(durationSec: number = 3): void {
    const ctx = this.getContext();
    const bufferSize = ctx.sampleRate * durationSec;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.15;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    noise.connect(filter);
    filter.connect(ctx.destination);
    noise.start();
  }

  playThunder(): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2);
  }

  playFootstep(): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  playSubDrone(): void {
    const ctx = this.getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, ctx.currentTime);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 120;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3.1);
  }
}

// Global Provider Singletons
export const aiStoryEngine = new GeminiTextGenerator();
export const aiImageEngine = new GeminiImageGenerator();
export const aiVideoEngine = new VeoVideoGenerator();
export const aiVoiceEngine = new GeminiVoiceGenerator();
export const webAudioEngine = new WebAudioSynthesizer();
