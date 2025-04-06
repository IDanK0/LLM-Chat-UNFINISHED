import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileOptimization() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // Aggiunge classe solo su mobile
      document.body.classList.add('mobile-device');
      document.documentElement.classList.add('mobile-device');
      
      // Gestisce il viewport solo per dispositivi mobili
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
      
      // Funzione per sistemare il layout solo su mobile
      const fixMobileLayout = () => {
        // Rimuovi height: 100% e aggiungi height: 100vh
        document.documentElement.style.height = '100vh';
        document.body.style.height = '100vh';
        
        // Main container
        const main = document.querySelector('main');
        if (main) {
          main.style.display = 'flex';
          main.style.flexDirection = 'column';
          main.style.height = '100%';
          main.style.overflow = 'hidden';
        }
        
        // Chat interface
        const chatInterface = document.querySelector('.chat-interface');
        if (chatInterface) {
          chatInterface.classList.add('mobile-chat-interface');
          (chatInterface as HTMLElement).style.flex = '1 1 auto';
          (chatInterface as HTMLElement).style.overflowY = 'auto';
          (chatInterface as HTMLElement).style.maxHeight = 'none';
        }
        
        // Input container
        const inputContainer = document.querySelector('.message-input-container');
        if (inputContainer) {
          (inputContainer as HTMLElement).style.position = 'sticky';
          (inputContainer as HTMLElement).style.bottom = '0';
          (inputContainer as HTMLElement).style.zIndex = '10';
          (inputContainer as HTMLElement).style.background = '#0f172a';
          (inputContainer as HTMLElement).style.flexShrink = '0';
        }
        
        // Imposta overflow hidden sul body per evitare scroll indesiderati
        document.body.style.overflow = 'hidden';
        
        // Aggiungi classe al contenitore chat+input se non presente
        const mobileContainer = document.querySelector('.chat-interface')?.parentElement;
        if (mobileContainer && !mobileContainer.classList.contains('mobile-chat-container')) {
          mobileContainer.classList.add('mobile-chat-container');
        }
      };
      
      // Esegui solo su mobile e quando il DOM cambia
      fixMobileLayout();
      window.addEventListener('resize', fixMobileLayout);
      
      // Observer per applicare i fix quando il DOM cambia (es: nuovi messaggi)
      const observer = new MutationObserver(() => {
        fixMobileLayout();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Impedisci zoom su iOS
      const preventZoom = (e: TouchEvent) => {
        if ('scale' in e && e.scale !== 1) { 
          e.preventDefault(); 
        }
      };
      document.addEventListener('touchmove', preventZoom as any, { passive: false });
      
      return () => {
        // Rimuovi tutto quando il componente viene smontato
        document.body.classList.remove('mobile-device');
        document.documentElement.classList.remove('mobile-device');
        window.removeEventListener('resize', fixMobileLayout);
        document.removeEventListener('touchmove', preventZoom as any);
        observer.disconnect();
        document.body.style.overflow = '';
        document.documentElement.style.height = '';
        document.body.style.height = '';
      };
    } else {
      // Su desktop, assicurati che non ci siano residui di stile mobile
      document.body.classList.remove('mobile-device');
      document.documentElement.classList.remove('mobile-device');
      
      // Ripristina viewport per desktop
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0'
        );
      }
    }
  }, [isMobile]);
  
  return null; // Questo componente non renderizza nulla
}