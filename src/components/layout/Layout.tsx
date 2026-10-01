import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomBar } from './MobileBottomBar';
import { AuthModal } from '../auth/AuthModal';
import { AiFloatingButton } from '../common/AiFloatingButton';
import { AiForzaFaceToFaceModal } from '../search/AiForzaFaceToFaceModal';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isForzaFaceToFaceOpen, setIsForzaFaceToFaceOpen] = useState(false);

  useEffect(() => {
    const handleOpenForza = () => setIsForzaFaceToFaceOpen(true);
    window.addEventListener('open-forza-face-to-face', handleOpenForza);
    return () => window.removeEventListener('open-forza-face-to-face', handleOpenForza);
  }, []);

  // Isolated dedicated portals: Admin, Dealer/Agency panel, and Customer Portal
  const isDedicatedPortal =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/dealer') ||
    location.pathname.startsWith('/account');

  // Full-screen cinematic AI FORZA experience
  const isCinematicAiForza =
    location.pathname === '/ai-forza' ||
    location.pathname === '/forza';

  if (isCinematicAiForza) {
    return <>{children}</>;
  }

  if (isDedicatedPortal) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#55565A]">
        {children}
        <AuthModal />
        <AiFloatingButton />
        <AiForzaFaceToFaceModal
          isOpen={isForzaFaceToFaceOpen}
          onClose={() => setIsForzaFaceToFaceOpen(false)}
        />
      </div>
    );
  }

  const isHomePage = location.pathname === '/';

  const handleOpenMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-menu'));
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-search'));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFFFF] text-[#55565A] overflow-x-hidden">
      <Header />
      <main className={`flex-1 w-full pb-16 lg:pb-0 ${isHomePage ? '' : 'max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6'}`}>
        {children}
      </main>
      <Footer />
      {/* Mobile Floating Bottom Navigation Bar */}
      <MobileBottomBar
        onOpenMobileMenu={handleOpenMobileMenu}
        onOpenSearch={handleOpenSearch}
      />
      {/* Global AI Floating Quick Action Button */}
      <AiFloatingButton />
      {/* Global OTP Auth Modal */}
      <AuthModal />
      {/* Global Full-Screen Cinematic AI FORZA Face-to-Face Modal */}
      <AiForzaFaceToFaceModal
        isOpen={isForzaFaceToFaceOpen}
        onClose={() => setIsForzaFaceToFaceOpen(false)}
      />
    </div>
  );
};
