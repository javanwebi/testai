// All geometry is generated here. Coordinates live on a 1200 × 760 design plane.
// Ultra-optimized 60 FPS Particle Engine with zero-garbage collection & precomputed trigonometric paths.
export const W = 1200;
export const H = 760;
const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => {
  v = clamp(v);
  return v * v * (3 - 2 * v);
};

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cubic(p: number[], t: number): [number, number] {
  const q = 1 - t;
  return [
    q * q * q * p[0] + 3 * q * q * t * p[2] + 3 * q * t * t * p[4] + t * t * t * p[6],
    q * q * q * p[1] + 3 * q * q * t * p[3] + 3 * q * t * t * p[5] + t * t * t * p[7],
  ];
}

// Brand palette: primary #e06518, secondary #55565a, white #ffffff.
export const BRAND = {
  primary: "#e06518",
  secondary: "#55565a",
  white: "#ffffff",
  background: "#101012",
};

export const PALETTE = [
  "#55565a", // 0  secondary: inner contours
  "#8b8c90", // 1  secondary tint: head latitudes / accents
  "#d4d4d6", // 2  near white: silhouette edge
  "#ffffff", // 3  white: brightest edge strands
  "#ffffff", // 4  spare
  "#9c4610", // 5  primary shade: clavicle accents
  "#e06518", // 6  primary: neck filaments
  "#f39a5c", // 7  primary tint: bright filament
  "#a84b12", // 8  face heat 1
  "#e06518", // 9  face heat 2 (primary)
  "#f2915a", // 10 face heat 3
  "#ffe2cc", // 11 face heat core (white-hot)
  "#e06518", // 12 logo particles (primary)
];

export const LOGO_COLOR = BRAND.primary;

const outline = [
  [600, 104, 682, 101, 728, 152, 717, 235],
  [717, 235, 731, 244, 727, 280, 715, 292],
  [715, 292, 706, 343, 659, 420, 600, 437],
];

const shoulder = [
  [677, 373, 669, 433, 673, 477, 706, 496],
  [706, 496, 750, 526, 823, 529, 865, 574],
  [865, 574, 889, 597, 905, 623, 915, 661],
];

// Logo sits in the middle of the chest. Design-plane rectangle.
export const LOGO_BOX = (() => {
  const w = 156;
  const h = (w * 424) / 640;
  const cx = 600;
  const cy = 604;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
})();

const PAD = 12;

// Soft elliptical clearing around the logo (no hard box edge).
const inLogoZone = (x: number, y: number) => {
  const rx = LOGO_BOX.w / 2 + PAD + 6;
  const ry = LOGO_BOX.h / 2 + PAD + 4;
  const dx = (x - (LOGO_BOX.x + LOGO_BOX.w / 2)) / rx;
  const dy = (y - (LOGO_BOX.y + LOGO_BOX.h / 2)) / ry;
  return dx * dx + dy * dy < 1;
};

export interface Particle {
  x: number;
  y: number;
  color: number;
  alpha: number;
  size: number;
  kind: number;
  seed: number;
  phase: number;
  sx: number;
  sy: number;
  dx: number;
  focus: number;
}

export interface DustMote {
  x: number;
  y: number;
  phase: number;
  rate: number;
  size: number;
  alpha: number;
}

export interface Scene {
  points: Particle[];
  dust: DustMote[];
  live: Particle[][];
  still: Particle[][];
  baked: HTMLCanvasElement | null;
}

export interface LogoMask {
  data: Uint8ClampedArray;
  w: number;
  h: number;
}

/** Pre-bakes all static contours and logo into an offscreen canvas once */
export function bakeStaticBody(scene: Scene): void {
  if (typeof document === "undefined") return;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: false });
  if (!ctx) return;

  for (let color = 0; color < PALETTE.length; color++) {
    const list = scene.still[color];
    if (!list.length) continue;
    ctx.fillStyle = PALETTE[color];

    // Batch draw all points with consistent alpha
    ctx.globalAlpha = color === 12 ? 0.95 : 0.75;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }
  scene.baked = c;
}

/** logoMask: optional { data: Uint8ClampedArray (RGBA), w, h } sampled from the logo. */
export function createScene(logoMask?: LogoMask | null): Scene {
  const random = rng(18742);
  const points: Particle[] = [];
  const dust: DustMote[] = [];

  function add(x: number, y: number, color = 2, alpha = 0.6, size = 1, kind = 0) {
    const dx = x - 600;
    const dy = y - 327;
    const rawFocus = Math.exp(-((dx / 74) ** 2 + (dy / 73) ** 2));
    const focus = rawFocus > 0.01 ? rawFocus : 0;

    points.push({
      x,
      y,
      color,
      alpha,
      size,
      kind,
      seed: random(),
      phase: random() * TAU,
      sx: 600 + (random() - 0.5) * 990,
      sy: 610 + (random() - 0.5) * 270,
      dx,
      focus,
    });
  }

  // Edge particles: outer contour light strands
  for (const side of [-1, 1]) {
    for (const segment of [...outline, ...shoulder]) {
      for (let k = 0; k < 150; k++) {
        const [px, py] = cubic(segment, random());
        const jitter = random() + random() + random() - 1.5;
        const x = 600 + side * (px - 600) + jitter * 3.5;
        const y = py + (random() - 0.5) * 3;
        add(x, y, random() > 0.75 ? 3 : 2, 0.65 + random() * 0.35, 1.6 + random() * 1.0, 1);
        if (k % 8 === 0) {
          dust.push({
            x: x + side * random() * 29,
            y: y + (random() - 0.5) * 42,
            phase: random() * TAU,
            rate: 0.2 + random() * 0.8,
            size: 0.7 + random() * 0.8,
            alpha: random() * 0.45,
          });
        }
      }
    }
  }

  // Horizontal latitude contours: smooth head geometry (animated live every frame)
  for (let row = 0; row < 52; row++) {
    const y = 111 + row * 6.1;
    let half: number;
    if (y < 206) half = 117 * Math.sqrt(Math.max(0, 1 - ((y - 206) / 103) ** 2));
    else if (y < 270) half = 117 + (y - 206) * 0.018;
    else half = 120 * Math.pow(Math.max(0.015, 1 - ((y - 269) / 174) ** 1.4), 0.64);

    for (let x = -half; x <= half; x += 3.1) {
      const u = x / Math.max(half, 1);
      const curve = (-15 + 45 * smooth((y - 210) / 220)) * (1 - u * u);
      const yy = y + curve;
      const heat = Math.exp(-(((x / 62) ** 2 + ((yy - 321) / 57) ** 2) * 1.28));
      const color = heat > 0.72 ? 11 : heat > 0.40 ? 10 : heat > 0.18 ? 9 : heat > 0.07 ? 8 : 1;
      add(600 + x, yy, color, heat > 0.07 ? 0.65 + heat * 0.35 : 0.42, 1.2 + heat * 1.4, 2);
    }
  }

  for (const side of [-1, 1]) {
    // Shoulder / neck concentric contours
    for (let i = 0; i < 10; i++) {
      const inset = i * 9.5;
      const joinX = 730 - inset * 0.55;
      const joinY = 525 + i * 6.2;
      const segments = [
        [674 - inset * 0.18, 394 + i * 4, 646 - inset * 0.30, 472 + i * 2.5, joinX - 46, joinY - 13, joinX, joinY],
        [joinX, joinY, joinX + 46, joinY + 13, 876 - inset * 0.7, 593 + i * 3.7, 903 - inset * 0.72, 670],
      ];
      for (const p of segments) {
        for (let j = 0; j < 65; j++) {
          const [x, y] = cubic(p, j / 64);
          if (inLogoZone(600 + side * (x - 600), y)) continue;
          add(600 + side * (x - 600), y, i % 4 === 0 ? 1 : 0, (0.6 - i * 0.025) * clamp((690 - y) / 48), 1.1, 3);
        }
      }
    }

    // Pectoral arches
    for (let i = 0; i < 6; i++) {
      const p = [891 - i * 9, 669, 864 - i * 6, 549 + i * 6, 679 + i * 2.5, 542 + i * 9, 623 + i * 4, 674];
      for (let j = 0; j < 80; j++) {
        const [x, y] = cubic(p, j / 79);
        if (inLogoZone(600 + side * (x - 600), y)) continue;
        add(600 + side * (x - 600), y, i % 3 === 0 ? 1 : 0, 0.32, 1, 3);
      }
    }

    // Clavicle arcs
    for (let i = 0; i < 6; i++) {
      const p = [641 + i * 5.5, 443 + i * 3.5, 619 + i * 5, 521, 610 + i * 8.5, 550, 609 + i * 11, 674];
      for (let j = 0; j < 55; j++) {
        const [x, y] = cubic(p, j / 54);
        if (inLogoZone(600 + side * (x - 600), y)) continue;
        add(600 + side * (x - 600), y, i < 3 ? 5 : 0, 0.3, 0.9, 3);
      }
    }

    // Orange neck filaments
    const endY = LOGO_BOX.y - PAD - 2;
    for (let strand = 0; strand < 4; strand++) {
      for (let j = 0; j < 75; j++) {
        const t = j / 74;
        const y = 424 + t * (endY - 424);
        const x = 600 + side * (7 + strand * 4 + (42 - strand * 3) * (1 - t) ** 2
          + Math.sin(t * 14 + strand * 0.6) * Math.sin(t * Math.PI) * 4.2);
        add(x, y, strand === 1 ? 7 : 6, (0.7 + Math.sin(t * Math.PI) * 0.28) * (1 - t * 0.45), 1.2, 4);
      }
    }
  }

  // Logo particles: sampled from logo mask
  if (logoMask) {
    const { data, w, h } = logoMask;
    const step = 2.2;
    for (let y = 0; y < LOGO_BOX.h; y += step) {
      for (let x = 0; x < LOGO_BOX.w; x += step) {
        const mx = Math.min(w - 1, ((x / LOGO_BOX.w) * w) | 0);
        const my = Math.min(h - 1, ((y / LOGO_BOX.h) * h) | 0);
        if (data[(my * w + mx) * 4 + 3] > 140) {
          add(LOGO_BOX.x + x + (random() - 0.5) * 0.5, LOGO_BOX.y + y + (random() - 0.5) * 0.5, 12, 0.9, 1.35, 5);
        }
      }
    }
  }

  // Ambient dust (clean & light)
  for (let i = 0; i < 70; i++) {
    dust.push({
      x: 600 + (random() - 0.5) * 760,
      y: 85 + random() * 610,
      phase: random() * TAU,
      rate: 0.12 + random() * 0.5,
      size: 0.6,
      alpha: 0.05 + random() * 0.08,
    });
  }

  const live: Particle[][] = PALETTE.map(() => []);
  const still: Particle[][] = PALETTE.map(() => []);
  for (const p of points) {
    (p.kind === 2 ? live : still)[p.color].push(p);
  }

  const scene: Scene = { points, dust, live, still, baked: null };
  bakeStaticBody(scene);
  return scene;
}

export const SETTLE_TIME = 2.0;

/** Ultra-fast batch drawing of live face particles with expressive speech mouth kinematics */
function drawLiveParticlesFast(
  ctx: CanvasRenderingContext2D,
  buckets: Particle[][],
  time: number,
  breathY: number,
  speech: number
) {
  // Speech syllable oscillation (phonetic cadence between 3.5Hz - 6.5Hz)
  const syllable = Math.max(0, Math.sin(time * 12.5) * 0.55 + Math.sin(time * 19.0) * 0.3 + Math.sin(time * 7.2) * 0.25);
  const isActivelySpeaking = speech > 0.08;
  const mouthOpen = isActivelySpeaking ? syllable * Math.min(2.8, speech * 1.6) : 0;

  for (let color = 0; color < PALETTE.length; color++) {
    const list = buckets[color];
    const len = list.length;
    if (len === 0) continue;

    const isOrangeMouth = color >= 8 && color <= 11;
    ctx.fillStyle = PALETTE[color];

    // Glow intensity rises during vocalization
    const warmth = isOrangeMouth ? 0.85 + Math.min(1.2, speech * 0.55 + mouthOpen * 0.25) : 1;
    ctx.globalAlpha = clamp((isOrangeMouth ? 0.82 : 0.72) * warmth);

    for (let i = 0; i < len; i++) {
      const p = list[i];
      let x = p.x;
      let y = p.y + breathY;

      if (p.focus > 0) {
        // Vertical mouth kinematics (y=321 is the mouth center)
        const dy = p.y - 321;
        const dx = p.x - 600;

        // Orange mouth particles move up and down rhythmically as if speaking
        let mouthMovementY = 0;
        if (isOrangeMouth || Math.abs(dy) < 55) {
          if (dy >= 0) {
            // Lower lip and jaw move downward when speaking
            mouthMovementY = (1 + (dy / 30)) * mouthOpen * 4.6;
          } else {
            // Upper lip moves slightly upward with speech modulation
            mouthMovementY = (-0.6 + (dy / 45)) * mouthOpen * 2.2;
          }
          // Dynamic phonetic waveform flutter
          mouthMovementY += Math.sin(dx * 0.09 + time * 15.0) * 2.5 * Math.min(1.4, speech);
        }

        // Ambient idle face breathing wave
        const ambientFaceWave = (Math.sin(p.dx * 0.072 + time * 4.6) * 3.2 + Math.sin(p.dx * 0.12 - time * 5.5) * 1.4);

        y += p.focus * (mouthMovementY + ambientFaceWave);

        // Slight lateral lip expansion during articulation
        if (Math.abs(dy) < 45 && Math.abs(dx) < 65 && isActivelySpeaking) {
          x += (dx >= 0 ? 1 : -1) * Math.sin(time * 13.0) * 1.6 * p.focus * Math.min(1.2, speech);
        }
      }

      ctx.fillRect(x, y, p.size, p.size);
    }
  }
}

/** Returns the breath offset and logo alpha so caller can move the crisp logo with the body */
export function paintScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  time: number,
  externalSpeech?: number
): { breathY: number; logoAlpha: number } {
  ctx.clearRect(0, 0, W, H);
  const settled = smooth(time / 1.5);
  const breathY = Math.sin(time * 1.65) * 0.75 * settled;
  const baseSpeech = (0.45 + 0.25 * Math.sin(time * 2.7) + 0.21 * Math.sin(time * 5.4)) * (0.70 + 0.30 * Math.sin(time * 0.53) ** 2);
  const speech = typeof externalSpeech === "number" && !isNaN(externalSpeech)
    ? Math.max(baseSpeech * 0.2, externalSpeech)
    : baseSpeech;

  // 1. Warm emission behind the face
  if (settled > 0.05) {
    ctx.globalAlpha = settled * (0.35 + speech * 0.25);
    const heat = ctx.createRadialGradient(600, 327, 0, 600, 327, 86);
    heat.addColorStop(0, "#e06518aa");
    heat.addColorStop(0.4, "#e0651840");
    heat.addColorStop(1, "#e0651800");
    ctx.fillStyle = heat;
    ctx.fillRect(514, 241, 172, 172);
  }

  // 2. Soft orange halo behind the chest logo
  if (settled > 0.05) {
    ctx.globalAlpha = settled * 0.5;
    const cx = LOGO_BOX.x + LOGO_BOX.w / 2;
    const cy = LOGO_BOX.y + LOGO_BOX.h / 2;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, LOGO_BOX.w * 0.6);
    g.addColorStop(0, "#e0651838");
    g.addColorStop(1, "#e0651800");
    ctx.fillStyle = g;
    ctx.fillRect(cx - LOGO_BOX.w * 0.6, cy - LOGO_BOX.w * 0.6, LOGO_BOX.w * 1.2, LOGO_BOX.w * 1.2);
  }

  // 3. Expanding technological rings (4 rings, 90 dots each = silky smooth)
  ctx.fillStyle = BRAND.secondary;
  for (let ring = 0; ring < 4; ring++) {
    const p = ((time * 0.09 + ring / 4) % 1);
    const radius = 138 + p * 145;
    ctx.globalAlpha = Math.sin(p * Math.PI) * 0.35 * settled * (0.7 + speech * 0.3);
    for (let j = 0; j < 90; j++) {
      const a = (j / 90) * TAU;
      const y = 288 + Math.sin(a) * radius * 1.06;
      if (y < 536) {
        ctx.fillRect(600 + Math.cos(a) * radius, y, 1.2, 1.2);
      }
    }
  }

  // 4. Ambient floating dust
  ctx.fillStyle = "#8b8c90";
  const dustLen = scene.dust.length;
  for (let i = 0; i < dustLen; i++) {
    const p = scene.dust[i];
    ctx.globalAlpha = p.alpha * settled * (0.5 + 0.5 * Math.sin(time * p.rate + p.phase) ** 2);
    ctx.fillRect(
      p.x + Math.sin(time * 0.42 + p.phase) * 4,
      p.y - Math.sin(time * p.rate + p.phase) * 8,
      p.size,
      p.size
    );
  }

  // 5. Blit pre-baked static body with breath offset
  if (scene.baked) {
    ctx.globalAlpha = Math.min(1, settled * 1.2);
    ctx.drawImage(scene.baked, 0, breathY);
  }

  // 6. Draw live animated face waves
  drawLiveParticlesFast(ctx, scene.live, time, breathY, speech);

  ctx.globalAlpha = 1;
  return { breathY, logoAlpha: settled };
}
