import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clientService, ClientLogo } from '../../services/clientService';
import { toPersianDigits } from '../../utils/formatters';

export const OurClientsSection: React.FC = () => {
  const [clients, setClients] = useState<ClientLogo[]>(() => clientService.getActiveClients());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [disableTransition, setDisableTransition] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setItemsPerView(2);
      else if (width < 1024) setItemsPerView(4);
      else setItemsPerView(7);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const updateClients = () => {
      setClients(clientService.getActiveClients());
    };
    const unsubscribe = clientService.subscribe(updateClients);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (clients.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, [clients.length]);

  const handleNext = () => {
    if (clients.length === 0) return;
    setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (clients.length === 0) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : clients.length - 1));
  };

  useEffect(() => {
    if (clients.length === 0) return;
    if (currentIndex >= clients.length) {
      const timeout = setTimeout(() => {
        setDisableTransition(true);
        setCurrentIndex(0);
        setTimeout(() => {
          setDisableTransition(false);
        }, 40);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, clients.length]);

  if (clients.length === 0) return null;

  const extendedClients = [...clients, ...clients, ...clients, ...clients];

  return (
    <section
      id="our-clients-section"
      className="space-y-5 my-8 sm:my-10"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#CBD2D8] pb-4 gap-3">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E06518] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-black text-[#55565A]">مشتریان ما</h2>
            <span className="text-[11px] font-bold bg-[#DEE2E5] text-[#55565A] border border-[#CBD2D8] px-2.5 py-0.5 rounded-full">
              {toPersianDigits(clients.length)} کارخانه و مجتمع صنعتی
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#777A7D]">
            افتخار همکاری و تأمین قطعات انتقال قدرت برای پیشگامان صنعت کشور
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrev}
            className="w-9 h-9 rounded-xl bg-[#FFFFFF] hover:bg-[#DEE2E5] border border-[#CBD2D8] hover:border-[#E06518] text-[#55565A] hover:text-[#E06518] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            aria-label="قبلی"
            title="قبلی"
          >
            <ChevronRight className="w-4 h-4 text-[#55565A]" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="w-9 h-9 rounded-xl bg-[#E06518] hover:bg-[#C95210] text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            aria-label="بعدی"
            title="بعدی"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticker / Carousel Viewport */}
      <div className="relative overflow-hidden rounded-2xl bg-[#DEE2E5] p-4 border border-[#CBD2D8]">
        {/* Soft edge blur masks */}
        <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#DEE2E5] via-[#DEE2E5]/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#DEE2E5] via-[#DEE2E5]/80 to-transparent z-10 pointer-events-none" />

        <div
          dir="ltr"
          className={`flex ${disableTransition ? '' : 'transition-transform duration-700 ease-in-out'}`}
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {extendedClients.map((client, idx) => (
            <div
              key={`${client.id}-${idx}`}
              className="w-1/2 sm:w-1/4 lg:w-[14.2857%] shrink-0 px-[7px]"
              dir="rtl"
            >
              <div
                className="group h-full bg-transparent p-2 flex flex-col items-center text-center justify-between hover:-translate-y-1 transition-all duration-200 relative"
              >
                {/* Logo Box */}
                <div className="w-full aspect-square rounded-2xl bg-[#FFFFFF] border border-[#CBD2D8] flex items-center justify-center overflow-hidden group-hover:shadow-xs group-hover:border-[#E06518]/50 transition-all mb-3">
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300 p-2"
                    loading="lazy"
                  />
                </div>

                {/* Company Name & Industry Tag */}
                <div className="w-full space-y-1.5 text-center">
                  <h3 className="text-xs sm:text-sm font-bold text-[#55565A] group-hover:text-[#E06518] transition-colors line-clamp-1">
                    {client.name}
                  </h3>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-[10px] text-[#777A7D] font-medium px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#CBD2D8] shadow-2xs line-clamp-1">
                      {client.industry}
                    </span>
                  </div>
                </div>

                {/* Optional Year */}
                {client.since && (
                  <div className="mt-2 text-[10px] text-[#777A7D] font-mono">
                    همکاری از {toPersianDigits(client.since)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Indicators Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-4">
          {clients.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentIndex % clients.length === idx
                  ? 'w-6 bg-[#E06518]'
                  : 'w-1.5 bg-[#CBD2D8] hover:bg-[#777A7D]'
              }`}
              aria-label={`اسلاید ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
