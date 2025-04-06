import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Controllo basato sulla larghezza della finestra
      const isMobileByWidth = window.innerWidth < 768;
      
      // Controllo basato su user agent
      const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Controllo basato su matchMedia (verificando se supporta hover)
      const isMobileByMatchMedia = window.matchMedia('(hover: none)').matches;
      
      // Settiamo come mobile se almeno uno dei controlli è vero
      setIsMobile(isMobileByWidth || isMobileByUserAgent || isMobileByMatchMedia);
    };

    // Set initial value
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return isMobile;
}