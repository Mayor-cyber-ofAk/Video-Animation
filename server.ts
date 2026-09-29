import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, GenerateVideosOperation, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System Status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'ANIMORA STUDIO',
    apiKeyPresent: Boolean(apiKey && apiKey.length > 5),
    supportedEngines: {
      text: ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'local-rules'],
      image: ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'local-canvas'],
      video: ['veo-3.1-lite-generate-preview', 'veo-3.1-generate-preview', 'client-canvas-recorder'],
      voice: ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts', 'browser-speech-synth'],
      audio: ['procedural-web-audio', 'lyria-3-clip-preview'],
    },
  });
});

// AI Story Builder
app.post('/api/ai/story', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
    }
    const { title, genre, logline, mood, targetDuration, visualStyle } = req.body;

    const prompt = `You are a master film director and screenwriter for ANIMORA STUDIO.
Create a complete narrative breakdown for an animated/cinematic movie scene:
Title: "${title || 'Untitled'}"
Genre: "${genre || 'Cinematic Sci-Fi'}"
Logline: "${logline || 'A thrilling journey unfolds'}"
Mood: "${mood || 'Moody, intense'}"
Target Duration: "${targetDuration || '45 seconds'}"
Visual Style: "${visualStyle || 'Photorealistic'}"

Output strict JSON with this exact structure:
{
  "synopsis": "Full narrative arc paragraph",
  "beginning": "Opening hook and situation",
  "middle": "Escalation, complication, or encounter",
  "ending": "Climax or cliffhanger ending",
  "themes": ["theme 1", "theme 2"],
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "characterIdeas": [
    { "name": "Name", "role": "Protagonist / Antagonist", "description": "Visual and personality description" }
  ],
  "locationIdeas": [
    { "name": "Location Name", "description": "Atmospheric visual and sensory description", "lighting": "Lighting setup" }
  ],
  "suggestedScenes": [
    { "sceneNumber": 1, "title": "Scene title", "summary": "What happens", "durationSeconds": 45 }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Story generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate story breakdown' });
  }
});

// AI Scene to Shots Builder
app.post('/api/ai/shots', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
    }
    const { sceneDescription, characters, location, visualStyle, targetShotCount } = req.body;

    const isPhotoreal = visualStyle?.toLowerCase().includes('photo') || visualStyle?.toLowerCase().includes('live');

    const prompt = `You are an elite cinematic storyboard artist and cinematographer.
Break down the following movie scene into a sequence of ${targetShotCount || 5} to 7 structured camera shots.

Scene Action: "${sceneDescription}"
Characters Involved: ${JSON.stringify(characters || [])}
Location: "${location || 'Cinematic environment'}"
Visual Style: "${visualStyle || 'Photorealistic'}"
Mode: ${isPhotoreal ? 'PHOTOREALISTIC LIVE-ACTION CINEMA (Arri Alexa, 35mm master prime lenses, plausible physical lighting, natural skin textures, genuine shadows)' : 'STYLIZED ANIMATION (clean character silhouettes, expressive dynamic timing, stylized color rendering)'}

Return strict JSON with this schema:
{
  "sceneTitle": "Short title",
  "totalDuration": 45,
  "shots": [
    {
      "shotNumber": 1,
      "name": "Establishing Wide",
      "duration": 6,
      "camera": {
        "angle": "Wide / Medium / Close-up / POV / Low angle / High angle / Dutch angle",
        "movement": "Static / Pan / Tilt / Dolly / Push in / Pull out / Tracking / Handheld",
        "lens": "18mm / 24mm / 35mm / 50mm / 85mm / 135mm",
        "depthOfField": "Shallow / Deep / Anamorphic bokeh"
      },
      "action": "Precise character and environment movement description",
      "charactersPresent": ["Jay"],
      "lighting": "Volumetric streetlights with cold cyan ambient fill",
      "weather": "Heavy rain with mist",
      "mood": "Tense and isolated",
      "dialogue": "Optional spoken line or inner monologue",
      "soundEffects": "Heavy rain drumming on asphalt, distant siren",
      "musicCue": "Low sub-bass drone with melancholic synth lead",
      "negativePrompt": "plastic skin, oversaturated, deformed hands, cartoon lines (if photoreal)",
      "continuityTags": ["Jay wearing wet jacket", "Streetlamp active"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Shots generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate shot list' });
  }
});

// AI Character Generator
app.post('/api/ai/character', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured in server environment.' });
    }
    const { name, promptDescription, visualStyle } = req.body;

    const prompt = `Create a complete, consistent visual and identity bible for a movie character in ANIMORA STUDIO.
Character Name: "${name}"
Concept Prompt: "${promptDescription}"
Visual Style: "${visualStyle || 'Photorealistic'}"

Output strict JSON:
{
  "name": "${name}",
  "age": 22,
  "role": "Protagonist",
  "personality": "Quiet, observant, resolute",
  "face": {
    "shape": "Oval with defined jawline",
    "eyes": "Sharp amber eyes, intense gaze",
    "eyebrows": "Slightly furrowed, natural arch",
    "nose": "Straight, defined bridge",
    "mouth": "Neutral pressed lips",
    "skinTone": "Fair with subtle warm undertones, realistic micro-textures"
  },
  "hair": {
    "style": "Messy textured crop",
    "color": "Charcoal black",
    "length": "Medium short"
  },
  "body": {
    "height": "5ft 11in (180cm)",
    "build": "Athletic, lean",
    "posture": "Alert, slightly guarded stance"
  },
  "clothing": {
    "top": "Matte black weather-resistant utility jacket over gray crewneck",
    "bottom": "Slim-fit dark cargo trousers",
    "shoes": "Black waterproof high-top sneakers with scuffed soles",
    "accessories": ["Silver chain pendant tucked under shirt", "Fingerless grip gloves"]
  },
  "colorPalette": ["#1A1A1E", "#3A3D40", "#B8860B", "#F5F5F7"],
  "voiceProfile": {
    "tone": "Deep, grounded, steady",
    "suggestedVoice": "Puck",
    "pitch": 0.95,
    "speed": 1.0
  },
  "consistencyPromptTokens": "exact same face features, consistent amber eyes, matte black weather jacket, messy charcoal hair, consistent character Jay",
  "photorealCinematicTokens": "shot on 50mm f/1.4 lens, natural skin pores, realistic eyelid folds, subsurface scattering, authentic specular reflections"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Character generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate character' });
  }
});

// Prompt Enhancer (Realism Engine vs Stylized)
app.post('/api/ai/enhance-prompt', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { userPrompt, visualStyle, cameraLens, lighting, characterTags } = req.body;

    const isPhotoreal = visualStyle?.toLowerCase().includes('photo') || visualStyle?.toLowerCase().includes('live');

    const prompt = `You are a master AI prompt engineer for cinematic video and image generation engines.
Enhance this raw scene prompt: "${userPrompt}"
Visual Style: "${visualStyle}"
Camera Lens: "${cameraLens || '35mm'}"
Lighting: "${lighting || 'Natural cinematic'}"
Locked Character Attributes: "${characterTags || 'None'}"

Rules:
${isPhotoreal ? `1. PHOTOREALISTIC LIVE-ACTION: Inject physically accurate lens characteristics (${cameraLens || '35mm anamorphic'}), natural human skin pores, subsurface scattering, authentic clothing folds, physically plausible lighting, real atmosphere and rain droplets. AVOID plastic skin, extra limbs, artificial AI glow.` : `2. STYLIZED ANIMATION: Emphasize clean dynamic silhouettes, bold cinematic composition, expressive line-work, vibrant atmospheric color gradients, anime/manga/cartoon fidelity.`}
Do not alter the user's creative storyline.

Output strict JSON:
{
  "enhancedPrompt": "Comprehensive master generation prompt",
  "negativePrompt": "deformed, blurry, extra fingers, cartoon (if photoreal), plastic skin, distorted anatomy",
  "cinematographyNotes": "Lighting & camera advice",
  "seedSuggestion": 42
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Prompt enhancement error:', err);
    res.status(500).json({ error: err.message || 'Failed to enhance prompt' });
  }
});

// Continuity Manager Checker
app.post('/api/ai/continuity', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { currentShot, previousShots, characters, location } = req.body;

    const prompt = `You are the Script Supervisor and Continuity Director on a movie set.
Check for visual, temporal, prop, character appearance, or spatial continuity errors.

Current Shot: ${JSON.stringify(currentShot)}
Previous Shots in Scene: ${JSON.stringify(previousShots || [])}
Locked Character Details: ${JSON.stringify(characters || [])}
Location: ${JSON.stringify(location || {})}

Analyze for:
1. Wardrobe & injuries (e.g., character removed jacket in shot 2 but wears it in shot 3)
2. Time of day and lighting consistency (e.g. night vs golden hour)
3. Weather conditions (e.g. rain stops suddenly without explanation)
4. Screen direction & 180-degree camera axis rule
5. Prop locations

Output strict JSON:
{
  "hasIssues": true,
  "warnings": [
    {
      "severity": "high | medium | low",
      "issue": "Specific continuity conflict detected",
      "suggestedFix": "Precise instruction on how to fix this shot",
      "targetField": "action / lighting / charactersPresent / weather"
    }
  ],
  "praise": "Everything matches the established cinematic visual language"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Continuity check error:', err);
    res.status(500).json({ error: err.message || 'Failed continuity check' });
  }
});

// Creative AI Assistant (Side Panel)
app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { message, projectContext, conversationHistory } = req.body;

    const systemInstruction = `You are ANIMORA AI, a world-class creative animation director, screenwriter, and technical cinematographer.
You collaborate with the user inside ANIMORA STUDIO.
You give actionable, concise, cinematic advice on shots, camera movements, dramatic pacing, character design, sound design, and CapCut assembly.
Never invent fake features. If asked to modify shots or character profiles, provide clear, structured suggestions that the user can accept with one click.`;

    const prompt = `Project Context: ${JSON.stringify(projectContext || {})}
Recent conversation: ${JSON.stringify(conversationHistory || [])}
User message: "${message}"

Respond with helpful creative advice, and if relevant, provide a structured suggestion block (e.g. proposed camera change, action tweak, sound effect, or dialogue polish).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error('Assistant error:', err);
    res.status(500).json({ error: err.message || 'Failed to contact AI Assistant' });
  }
});

// Voice TTS Generation
app.post('/api/ai/voice', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { text, voiceName, style } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text prompt is required for voice generation' });
    }

    const validVoice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(voiceName) ? voiceName : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text,
              speechMetadata: {
                style: style || 'Cinematic character dialogue with natural pacing and emotion',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: validVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Model did not return audio data' });
    }

    res.json({
      audioBase64: base64Audio,
      mimeType: 'audio/wav',
      voiceName: validVoice,
    });
  } catch (err: any) {
    console.error('Voice generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate voice audio' });
  }
});

// Image Generation
app.post('/api/ai/image', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { prompt, aspectRatio, referenceImageBase64 } = req.body;

    const parts: any[] = [];
    if (referenceImageBase64) {
      parts.push({
        inlineData: {
          data: referenceImageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg',
        },
      });
    }
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || '16:9',
          imageSize: '1K',
        },
      },
    });

    let foundImage = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        foundImage = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!foundImage) {
      return res.status(500).json({ error: 'No image was returned from the generation engine' });
    }

    res.json({ imageUrl: foundImage });
  } catch (err: any) {
    console.error('Image generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image' });
  }
});

// Video Generation (Veo) - Step 1: Start
app.post('/api/ai/video', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { prompt, imageBase64, aspectRatio, resolution } = req.body;

    const payload: any = {
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt || 'Cinematic movie shot',
      config: {
        numberOfVideos: 1,
        resolution: resolution === '1080p' ? '1080p' : '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      },
    };

    if (imageBase64) {
      payload.image = {
        imageBytes: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        mimeType: 'image/png',
      };
    }

    const operation = await ai.models.generateVideos(payload);
    res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error('Video start error:', err);
    res.status(500).json({ error: err.message || 'Failed to start video generation' });
  }
});

// Video Generation - Step 2: Poll Status
app.post('/api/ai/video-status', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });

    res.json({
      done: updated.done,
      error: updated.error ? updated.error.message : null,
    });
  } catch (err: any) {
    console.error('Video status error:', err);
    res.status(500).json({ error: err.message || 'Failed to check video status' });
  }
});

// Video Generation - Step 3: Download
app.post('/api/ai/video-download', async (req: Request, res: Response) => {
  try {
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is not configured.' });
    }
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: 'operationName is required' });
    }

    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: 'Video URI not available on completed operation' });
    }

    const videoRes = await fetch(uri, {
      headers: { 'x-goog-api-key': apiKey },
    });

    res.setHeader('Content-Type', 'video/mp4');
    const arrayBuffer = await videoRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err: any) {
    console.error('Video download error:', err);
    res.status(500).json({ error: err.message || 'Failed to download generated video' });
  }
});

// Serve frontend in dev or prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`🎬 ANIMORA STUDIO backend running on port ${PORT}`);
  });
}

startServer();
