import React, { useEffect, useRef } from "react";
import { createScene, paintScene, W, H, LOGO_BOX, LOGO_COLOR, BRAND, LogoMask } from "./particleEngine";
import logoUrl from "./assets/forza-logo.png";

export interface ParticleHumanoidProps {
  paused?: boolean;
  speed?: number;
  restartKey?: number;
  speech?: number;
  audioLevelRef?: { current: number };
  statusRef?: { current: string };
  className?: string;
  scaleMultiplier?: number;
  onReady?: () => void;
}

function loadLogo(): Promise<{ tint: HTMLCanvasElement; mask: LogoMask } | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const tint = document.createElement("canvas");
        tint.width = img.naturalWidth || 640;
        tint.height = img.naturalHeight || 424;
        const t = tint.getContext("2d");
        if (!t) return resolve(null);
        t.drawImage(img, 0, 0);
        t.globalCompositeOperation = "source-in";
        t.fillStyle = LOGO_COLOR;
        t.fillRect(0, 0, tint.width, tint.height);

        const mw = 280;
        const mh = Math.round((mw * (img.naturalHeight || 424)) / (img.naturalWidth || 640));
        const m = document.createElement("canvas");
        m.width = mw;
        m.height = mh;
        const mc = m.getContext("2d", { willReadFrequently: true });
        if (!mc) return resolve(null);
        mc.drawImage(img, 0, 0, mw, mh);
        const data = mc.getImageData(0, 0, mw, mh).data;
        resolve({ tint, mask: { data, w: mw, h: mh } });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = logoUrl;
  });
}

export const ParticleHumanoid: React.FC<ParticleHumanoidProps> = ({
  paused = false,
  speed = 1,
  restartKey = 0,
  speech,
  audioLevelRef,
  statusRef,
  className = "particle-canvas",
  scaleMultiplier,
  onReady,
}) => {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const settings = useRef({ paused, speed, speech, scaleMultiplier });
  settings.current = { paused, speed, speech, scaleMultiplier };

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const target = canvas.current;
    if (!target) return;

    const context = target.getContext("2d", { alpha: false });
    if (!context) return;

    loadLogo().then(logo => {
      if (cancelled) return;
      onReady?.();
      const scene = createScene(logo?.mask);
      const layer = document.createElement("canvas");
      layer.width = W;
      layer.height = H;
      const ink = layer.getContext("2d", { willReadFrequently: false });
      if (!ink) return;

      // Single lightweight downscaled canvas for crisp bloom
      const glow = document.createElement("canvas");
      glow.width = W / 4;
      glow.height = H / 4;
      const gCtx = glow.getContext("2d");
      if (!gCtx) return;

      let width = 1;
      let height = 1;
      let dpr = 1;
      let previous = 0;
      let time = 0;
      let isFirstDraw = true;

      const motion = typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : { matches: false };

      if (motion.matches) time = 7;

      function resize() {
        if (!target) return;
        const rect = target.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);
        // Cap DPR at 1.25 for top GPU efficiency without sacrificing particle sharpness
        dpr = Math.min(window.devicePixelRatio || 1, 1.25);
        target.width = Math.round(width * dpr);
        target.height = Math.round(height * dpr);
      }

      observer = new ResizeObserver(resize);
      observer.observe(target);
      resize();

      function draw(now: number) {
        frame = requestAnimationFrame(draw);
        if (!ink || !gCtx || !context) return;
        const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
        previous = now;
        if (typeof document !== "undefined" && document.hidden) return;

        const running = !settings.current.paused && !motion.matches;
        if (running) {
          time += delta * Math.max(0.1, settings.current.speed);
        } else if (!isFirstDraw) {
          return;
        }
        isFirstDraw = false;

        // Dynamic voice speech integration
        let dynamicSpeech = settings.current.speech ?? 0;
        const currentStatus = statusRef?.current;
        const audioLevel = typeof audioLevelRef?.current === "number" ? audioLevelRef.current : 0;

        if (currentStatus === "speaking") {
          // While speaking: prioritize real-time audio amplitude combined with realistic speech cadence
          const cadence = 0.85 + Math.sin(time * 11) * 0.4 + Math.sin(time * 19) * 0.25;
          const amplifiedAudio = audioLevel * 3.8;
          dynamicSpeech = Math.max(dynamicSpeech, Math.min(3.0, Math.max(cadence, amplifiedAudio)));
        } else if (currentStatus === "listening") {
          dynamicSpeech = Math.min(1.2, audioLevel * 1.5);
        } else if (audioLevel > 0.05) {
          dynamicSpeech = Math.min(2.5, audioLevel * 3.5);
        }

        const { breathY, logoAlpha } = paintScene(ink, scene, time, dynamicSpeech);

        // Fast bloom: 1 downscale draw
        gCtx.clearRect(0, 0, glow.width, glow.height);
        gCtx.drawImage(layer, 0, 0, glow.width, glow.height);

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.fillStyle = BRAND.background;
        context.fillRect(0, 0, width, height);

        // Desktop vs Mobile: Maximum size where 100% of the body is fully visible without clipping
        const isDesktop = width >= 768;
        const BODY_W = 640;
        const BODY_H = 584;
        const BODY_CX = 600;
        const BODY_TOP_Y = 96;

        // Snug padding to maximize visibility in dedicated containers
        const padTop = isDesktop ? 24 : 12;
        const padBottom = isDesktop ? 24 : 12;
        const padX = isDesktop ? 20 : 10;

        const availW = Math.max(100, width - padX * 2);
        const availH = Math.max(100, height - (padTop + padBottom));

        // Maximum scale factor that fits 100% of the body height and width
        const maxFitScale = Math.min(availW / BODY_W, availH / BODY_H);
        const multiplier = settings.current.scaleMultiplier ?? 1.0;
        const scale = maxFitScale * multiplier;

        const dw = W * scale;
        const dh = H * scale;
        const x = width / 2 - BODY_CX * scale;
        const y = padTop + (availH - BODY_H * scale) / 2 - BODY_TOP_Y * scale;

        // Soft bloom layer
        context.globalCompositeOperation = "screen";
        context.globalAlpha = 0.85;
        context.drawImage(glow, x, y, dw, dh);

        // Main particle layer
        context.globalAlpha = 1;
        context.drawImage(layer, x, y, dw, dh);
        context.globalCompositeOperation = "source-over";

        // Crisp logo on top breathing with the body
        if (logo && logoAlpha > 0.05) {
          context.globalAlpha = logoAlpha;
          context.drawImage(
            logo.tint,
            x + LOGO_BOX.x * scale,
            y + (LOGO_BOX.y + breathY) * scale,
            LOGO_BOX.w * scale,
            LOGO_BOX.h * scale
          );
          context.globalAlpha = 1;
        }
      }

      const redraw = () => {
        isFirstDraw = true;
      };

      observer.disconnect();
      observer = new ResizeObserver(() => {
        resize();
        redraw();
      });
      observer.observe(target);

      frame = requestAnimationFrame(draw);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [restartKey]);

  return (
    <canvas
      ref={canvas}
      className={className}
      role="img"
      aria-label="Animated particle humanoid in orange, grey and white with the FORZA logo glowing in its chest."
    />
  );
};

export default ParticleHumanoid;
