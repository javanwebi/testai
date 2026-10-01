import React, { useEffect } from 'react';
import { AiForzaCallExperience } from '../forza/AiForzaCallExperience';

export interface AiForzaFaceToFaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToWorkspace?: () => void;
  onSyncMessage?: (userText: string, aiText: string) => void;
  initialQuery?: string;
  initialImage?: string;
}

export const AiForzaFaceToFaceModal: React.FC<AiForzaFaceToFaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling when full-screen call experience is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen min-h-[100dvh] overflow-hidden bg-[#04060a]"
      role="dialog"
      aria-modal="true"
      aria-label="AI FORZA Voice Call Experience"
    >
      <AiForzaCallExperience onClose={onClose} />
    </div>
  );
};
