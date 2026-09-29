import { AnimationFrame } from '../types/studio';

/**
 * Generates crisp SVG Data URLs for hand-drawn anime/cartoon keyframes.
 * This guarantees real, tangible artwork exists out-of-the-box for
 * frame-by-frame animation, onion-skinning, and in-between creation.
 */
function createSvgFrameDataUrl(svgContent: string): string {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <style>
      .stroke-main { stroke: #A855F7; stroke-width: 5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .stroke-accent { stroke: #EC4899; stroke-width: 4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .fill-body { fill: rgba(168, 85, 247, 0.15); stroke: #C084FC; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
      .stroke-face { stroke: #E9D5FF; stroke-width: 3; fill: none; }
    </style>
    ${svgContent}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(fullSvg)}`;
}

export function createSampleAnimationFrames(): AnimationFrame[] {
  // Ground reference line at Y=580
  const groundLine = '<line x1="200" y1="580" x2="1080" y2="580" stroke="#3F3F46" stroke-width="3" stroke-dasharray="10 10" />';

  // Frame 0: Anticipation Crouch (Character low, coiled like a spring)
  const frame0Body = `
    ${groundLine}
    <!-- Shadow -->
    <ellipse cx="640" cy="580" rx="90" ry="14" fill="rgba(0,0,0,0.4)" />
    <!-- Legs in deep squat -->
    <path d="M 590 580 L 570 510 L 615 450 L 640 450 L 685 510 L 665 580" class="stroke-main" />
    <!-- Torso angled forward -->
    <path d="M 610 450 L 635 370 L 655 375 L 645 450 Z" class="fill-body" />
    <!-- Head tilted down-forward -->
    <circle cx="655" cy="330" r="38" class="fill-body" />
    <!-- Face: Focused eyes -->
    <path d="M 660 325 L 680 328 M 665 338 L 678 338" class="stroke-face" />
    <!-- Arms tucked back -->
    <path d="M 625 385 L 565 425 L 530 460" class="stroke-main" />
    <path d="M 650 385 L 600 435 L 575 470" class="stroke-accent" />
    <!-- Dynamic action line -->
    <path d="M 620 540 Q 640 500 645 420" stroke="rgba(168,85,247,0.3)" stroke-width="2" stroke-dasharray="6 4" fill="none" />
  `;

  // Frame 1: Launch Push-off (Stretch pose, shooting upward)
  const frame1Body = `
    ${groundLine}
    <!-- Small shadow fading -->
    <ellipse cx="640" cy="580" rx="45" ry="8" fill="rgba(0,0,0,0.2)" />
    <!-- Feet springing off toes -->
    <path d="M 620 570 L 625 490 L 635 400" class="stroke-main" />
    <path d="M 645 565 L 648 485 L 645 400" class="stroke-accent" />
    <!-- Elongated torso -->
    <path d="M 625 400 L 630 280 L 655 280 L 650 400 Z" class="fill-body" />
    <!-- Head tilting upward -->
    <circle cx="642" cy="235" r="38" class="fill-body" />
    <!-- Face: Intense upward gaze -->
    <path d="M 648 230 L 666 226 M 652 242 L 665 240" class="stroke-face" />
    <!-- Arms reaching upward -->
    <path d="M 625 295 L 610 200 L 620 140" class="stroke-main" />
    <path d="M 650 295 L 670 205 L 665 145" class="stroke-accent" />
    <!-- Motion speed streaks -->
    <line x1="610" y1="580" x2="610" y2="440" stroke="rgba(236,72,153,0.4)" stroke-width="2" stroke-dasharray="8 6" />
    <line x1="665" y1="580" x2="665" y2="440" stroke="rgba(236,72,153,0.4)" stroke-width="2" stroke-dasharray="8 6" />
  `;

  // Frame 2: Apex Float (Mid-air suspended crest of the arc)
  const frame2Body = `
    ${groundLine}
    <!-- Legs tucked up in athletic arc -->
    <path d="M 615 250 L 585 310 L 630 350" class="stroke-main" />
    <path d="M 645 250 L 675 305 L 635 355" class="stroke-accent" />
    <!-- Torso centered -->
    <path d="M 615 250 L 620 170 L 648 170 L 645 250 Z" class="fill-body" />
    <!-- Head poised -->
    <circle cx="634" cy="125" r="38" class="fill-body" />
    <!-- Face: Confident gaze -->
    <path d="M 640 122 L 658 123 M 644 135 Q 652 140 658 135" class="stroke-face" />
    <!-- Arms spread wide for aerodynamic balance -->
    <path d="M 618 185 L 530 170 L 470 195" class="stroke-main" />
    <path d="M 645 185 L 730 170 L 790 195" class="stroke-accent" />
    <!-- Flowing scarf / cape arc -->
    <path d="M 625 155 Q 550 120 480 145" stroke="#F59E0B" stroke-width="4" fill="none" stroke-linecap="round" />
  `;

  // Frame 3: Descent Fall (Gravity taking over, legs pointing downward)
  const frame3Body = `
    ${groundLine}
    <!-- Shadow growing on ground -->
    <ellipse cx="640" cy="580" rx="65" ry="11" fill="rgba(0,0,0,0.3)" />
    <!-- Legs extending straight down for landing preparation -->
    <path d="M 622 360 L 615 440 L 610 520" class="stroke-main" />
    <path d="M 645 360 L 650 440 L 655 520" class="stroke-accent" />
    <!-- Torso angled slightly forward -->
    <path d="M 618 360 L 624 260 L 652 260 L 648 360 Z" class="fill-body" />
    <!-- Head focused directly on ground impact zone -->
    <circle cx="638" cy="215" r="38" class="fill-body" />
    <!-- Face: Resolute downward gaze -->
    <path d="M 644 216 L 660 222 M 646 228 L 658 228" class="stroke-face" />
    <!-- Arms raised upward in drag -->
    <path d="M 620 275 L 595 210 L 585 155" class="stroke-main" />
    <path d="M 650 275 L 675 210 L 685 155" class="stroke-accent" />
    <!-- Downward wind lines -->
    <line x1="600" y1="200" x2="600" y2="350" stroke="rgba(56,189,248,0.4)" stroke-width="2" stroke-dasharray="6 6" />
    <line x1="670" y1="200" x2="670" y2="350" stroke="rgba(56,189,248,0.4)" stroke-width="2" stroke-dasharray="6 6" />
  `;

  // Frame 4: Hero Landing Cushion (Impact absorbed, dust puffs, dramatic 3-point crouch)
  const frame4Body = `
    ${groundLine}
    <!-- Ground impact shockwaves / dust -->
    <ellipse cx="640" cy="580" rx="130" ry="18" fill="rgba(0,0,0,0.5)" />
    <path d="M 490 580 Q 520 540 560 575" stroke="#A1A1AA" stroke-width="3" fill="none" />
    <path d="M 720 575 Q 760 540 790 580" stroke="#A1A1AA" stroke-width="3" fill="none" />
    <!-- Right leg bent deep, left leg kicked back -->
    <path d="M 600 580 L 580 500 L 630 460" class="stroke-main" />
    <path d="M 645 460 L 710 520 L 745 580" class="stroke-accent" />
    <!-- Low angled torso -->
    <path d="M 610 460 L 630 380 L 655 385 L 640 460 Z" class="fill-body" />
    <!-- Head low, eyes looking forward under brow -->
    <circle cx="645" cy="345" r="38" class="fill-body" />
    <path d="M 655 342 L 675 342 M 658 355 L 672 353" class="stroke-face" />
    <!-- Right hand planted firmly on ground (3-point landing) -->
    <path d="M 622 395 L 610 490 L 605 580" class="stroke-main" />
    <!-- Left arm raised back for balance -->
    <path d="M 650 395 L 690 420 L 730 410" class="stroke-accent" />
    <!-- Ground impact sparks -->
    <circle cx="605" cy="580" r="4" fill="#F59E0B" />
    <circle cx="590" cy="570" r="3" fill="#F59E0B" />
    <circle cx="620" cy="573" r="3" fill="#F59E0B" />
  `;

  return [
    {
      id: 'frame_anticipation',
      frameIndex: 0,
      durationMs: 125,
      holdCount: 1,
      layers: {
        layer_body: createSvgFrameDataUrl(frame0Body),
      },
    },
    {
      id: 'frame_launch',
      frameIndex: 1,
      durationMs: 125,
      holdCount: 1,
      layers: {
        layer_body: createSvgFrameDataUrl(frame1Body),
      },
    },
    {
      id: 'frame_apex',
      frameIndex: 2,
      durationMs: 125,
      holdCount: 1,
      layers: {
        layer_body: createSvgFrameDataUrl(frame2Body),
      },
    },
    {
      id: 'frame_descent',
      frameIndex: 3,
      durationMs: 125,
      holdCount: 1,
      layers: {
        layer_body: createSvgFrameDataUrl(frame3Body),
      },
    },
    {
      id: 'frame_landing',
      frameIndex: 4,
      durationMs: 125,
      holdCount: 1,
      layers: {
        layer_body: createSvgFrameDataUrl(frame4Body),
      },
    },
  ];
}
