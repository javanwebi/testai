import React, { useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Maximize, EyeOff, X, PhoneCall, ZoomIn } from 'lucide-react';
import ParticleHumanoid from './ParticleHumanoid';
import './particleHumanoid.css';

export interface AiForzaExperienceProps {
  onClose?: () => void;
  onStartCall?: () => void;
  showCloseButton?: boolean;
}

export const AiForzaExperience: React.FC<AiForzaExperienceProps> = ({
  onClose,
  onStartCall,
  showCloseButton = true,
}) => {
  const [paused, setPaused] = useState(false);
  const [revision, setRevision] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [clean, setClean] = useState(false);
  // Default scale: 1.0 (Maximum full-body fit without any clipping)
  const [scaleLevel, setScaleLevel] = useState<number>(1.0);
  const shell = useRef<HTMLDivElement | null>(null);

  async function fullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await shell.current?.requestFullscreen?.();
      }
    } catch {
      /* Browser embedding may disable fullscreen */
    }
  }

  const cycleScale = () => {
    setScaleLevel(curr => {
      if (curr === 1.0) return 1.12;
      if (curr === 1.12) return 0.9;
      return 1.0;
    });
  };

  const handleVoiceCall = () => {
    if (onStartCall) {
      onStartCall();
    } else {
      window.dispatchEvent(new CustomEvent('open-forza-face-to-face'));
    }
  };

  return (
    <main
      ref={shell}
      className={`experience ${clean ? 'clean' : ''}`}
      onDoubleClick={() => setClean(c => !c)}
    >
      <ParticleHumanoid
        paused={paused}
        speed={speed}
        restartKey={revision}
        scaleMultiplier={scaleLevel}
      />

      {/* Industrial corner mark */}
      <div className="corner-mark" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      {/* Telemetry Indicator */}
      <div className="telemetry" aria-hidden="true">
        <span />
        SYSTEM ACTIVE // 1200×760 [SCALE {scaleLevel}x]
      </div>

      {/* Top action bar */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-3">
        <button
          type="button"
          onClick={handleVoiceCall}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#e06518] hover:bg-[#e06518]/90 text-white font-medium text-xs tracking-wider shadow-[0_0_15px_rgba(224,101,24,0.5)] transition-all cursor-pointer"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          تماس صوتی با هوش مصنوعی
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            title="بستن و بازگشت"
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Interactive Controls Overlay */}
      {!clean && (
        <div className="controls">
          <span className="control-caption">
            FORZA <b> / </b> PARTICLE HUMANOID
          </span>
          <div className="control-buttons">
            <button
              type="button"
              className="ui-button ui-button-icon"
              aria-label={paused ? 'Play animation' : 'Pause animation'}
              title={paused ? 'Play' : 'Pause'}
              onClick={() => setPaused(p => !p)}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              type="button"
              className="ui-button ui-button-icon"
              aria-label="Replay formation"
              title="Replay formation"
              onClick={() => {
                setRevision(r => r + 1);
                setPaused(false);
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="ui-button"
              aria-label={`Animation speed ${speed}x. Click to change.`}
              title="Animation speed"
              onClick={() => setSpeed(s => (s === 1 ? 0.5 : s === 0.5 ? 1.5 : 1))}
            >
              {speed}×
            </button>
            <button
              type="button"
              className="ui-button"
              aria-label={`Scale ${scaleLevel}x. Click to change size.`}
              title="تغییر اندازه / بزرگ‌نمایی"
              onClick={cycleScale}
            >
              <ZoomIn className="w-3.5 h-3.5 mr-1 inline" />
              {scaleLevel}×
            </button>
            <button
              type="button"
              className="ui-button ui-button-icon"
              aria-label="Hide controls. Double-click to restore."
              title="Hide controls (double-click to restore)"
              onClick={() => setClean(true)}
            >
              <EyeOff className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="ui-button ui-button-icon"
              aria-label="Toggle fullscreen"
              title="Fullscreen"
              onClick={fullscreen}
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default AiForzaExperience;
