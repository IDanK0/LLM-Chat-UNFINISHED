import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileOptimization() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // Aggiunge una classe al body quando visualizzato su dispositivo mobile
      document.body.classList.add('mobile-device');
      
      // Gestisce il viewport per dispositivi mobili
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        );
      } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
      }
      
      // Impedisce lo zoom del browser sui dispositivi iOS
      document.addEventListener('touchmove', function(event) {
        if (event.scale !== 1) { 
          event.preventDefault(); 
        }
      }, { passive: false });
      
    } else {
      document.body.classList.remove('mobile-device');
      
      // Ripristina il viewport standard se non è mobile
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0'
        );
      }
    }
    
    return () => {
      document.body.classList.remove('mobile-device');
    };
  }, [isMobile]);
  
  return null; // Questo componente non renderizza nulla
}