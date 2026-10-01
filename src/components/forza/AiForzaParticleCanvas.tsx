import React from 'react';
import { ParticleHumanoid } from './ParticleHumanoid';

export type ForzaStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AiForzaParticleCanvasProps {
  statusRef: { current: ForzaStatus };
  audioLevelRef: { current: number };
  className?: string;
  paused?: boolean;
  speed?: number;
  restartKey?: number;
  scaleMultiplier?: number;
  padTop?: number;
  padBottom?: number;
}

export const AiForzaParticleCanvas: React.FC<AiForzaParticleCanvasProps> = ({
  statusRef,
  audioLevelRef,
  className = 'w-full h-full',
  paused = false,
  speed = 1,
  restartKey = 0,
  scaleMultiplier,
  padTop,
  padBottom,
}) => {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <ParticleHumanoid
        paused={paused}
        speed={speed}
        restartKey={restartKey}
        audioLevelRef={audioLevelRef}
        statusRef={statusRef}
        scaleMultiplier={scaleMultiplier}
        padTop={padTop}
        padBottom={padBottom}
        className="w-full h-full block"
      />
    </div>
  );
};
