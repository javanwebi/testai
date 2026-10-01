import React from 'react';
import { AiForzaExperience } from '../forza/AiForzaExperience';

export interface AiForzaCinematicExperienceProps {
  onClose?: () => void;
  isStandalonePage?: boolean;
}

export const AiForzaCinematicExperience: React.FC<AiForzaCinematicExperienceProps> = ({
  onClose,
}) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#101012]">
      <AiForzaExperience onClose={onClose} showCloseButton={!!onClose} />
    </div>
  );
};

export default AiForzaCinematicExperience;
