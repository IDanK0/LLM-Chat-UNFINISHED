import React, { useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileOptimization() {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // Add class only on mobile
      document.body.classList.add('mobile-device');
      document.documentElement.classList.add('mobile-device');
      
      // Handle viewport only for mobile devices
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
      
      // Function to fix layout only on mobile
      const fixMobileLayout = () => {
        // Remove height: 100% and add height: 100vh
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
        
        // Set overflow hidden on body to prevent unwanted scrolling
        document.body.style.overflow = 'hidden';
        
        // Add class to chat+input container if not present
        const mobileContainer = document.querySelector('.chat-interface')?.parentElement;
        if (mobileContainer && !mobileContainer.classList.contains('mobile-chat-container')) {
          mobileContainer.classList.add('mobile-chat-container');
        }
      };
      
      // Execute only on mobile and when DOM changes
      fixMobileLayout();
      window.addEventListener('resize', fixMobileLayout);
      
      // Observer to apply fixes when DOM changes (e.g., new messages)
      const observer = new MutationObserver(() => {
        fixMobileLayout();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Prevent zoom on iOS
      const preventZoom = (e: TouchEvent) => {
        if ('scale' in e && e.scale !== 1) { 
          e.preventDefault(); 
        }
      };
      document.addEventListener('touchmove', preventZoom as any, { passive: false });
      
      return () => {
        // Remove everything when component is unmounted
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
      // On desktop, ensure there are no mobile style residues
      document.body.classList.remove('mobile-device');
      document.documentElement.classList.remove('mobile-device');
      
      // Restore viewport for desktop
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0'
        );
      }
    }
  }, [isMobile]);
  
  return null; // This component doesn't render anything
}