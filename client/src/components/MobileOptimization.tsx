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
      
      // Imposta la dimensione iniziale della visualizzazione
      // Questa funzione verifica e adatta l'altezza dell'interfaccia di chat
      const adjustChatInterface = () => {
        const chatInterface = document.querySelector('.chat-interface');
        if (chatInterface) {
          // Calcola lo spazio disponibile in base agli altri elementi
          const header = document.querySelector('header');
          const messageInput = document.querySelector('.message-input-container');
          const suggestionBar = messageInput?.nextElementSibling;
          
          let availableHeight = window.innerHeight;
          
          if (header) availableHeight -= header.clientHeight;
          if (messageInput) availableHeight -= messageInput.clientHeight;
          if (suggestionBar) availableHeight -= suggestionBar.clientHeight;
          
          // Assicura che ci sia sempre spazio minimo per l'interfaccia della chat
          chatInterface.style.height = `${Math.max(availableHeight, 200)}px`;
        }
      };
      
      // Esegue l'adattamento iniziale e ad ogni ridimensionamento
      adjustChatInterface();
      window.addEventListener('resize', adjustChatInterface);
      
      // Impedisce lo zoom del browser sui dispositivi iOS
      document.addEventListener('touchmove', function(event) {
        if (event.scale !== 1) { 
          event.preventDefault(); 
        }
      }, { passive: false });
      
      return () => {
        document.body.classList.remove('mobile-device');
        window.removeEventListener('resize', adjustChatInterface);
      };
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
  }, [isMobile]);
  
  return null; // Questo componente non renderizza nulla
}