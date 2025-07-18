import { useEffect, useCallback, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

// Utility to check if lodash is available, otherwise use native implementations
const throttle = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func(...args);
      }, wait);
    }
  };
};

const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface MobileOptimizationConfig {
  enableViewportFix: boolean;
  enableLayoutFix: boolean;
  enableScrollOptimization: boolean;
  enableTouchOptimization: boolean;
  preventZoom: boolean;
  throttleMs: number;
  debounceMs: number;
}

const defaultConfig: MobileOptimizationConfig = {
  enableViewportFix: true,
  enableLayoutFix: true,
  enableScrollOptimization: true,
  enableTouchOptimization: true,
  preventZoom: true,
  throttleMs: 16, // 60fps
  debounceMs: 250,
};

export function MobileOptimizationAdvanced(config: Partial<MobileOptimizationConfig> = {}) {
  const isMobile = useIsMobile();
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);

  // Memoized CSS styles
  const mobileStyles = useMemo(() => ({
    html: {
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed' as const,
      width: '100%',
      top: '0',
      left: '0',
    },
    body: {
      height: '100vh',
      overflow: 'hidden',
      position: 'fixed' as const,
      width: '100%',
      top: '0',
      left: '0',
    },
    main: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100%',
      overflow: 'hidden',
    },
    chatInterface: {
      flex: '1 1 auto',
      overflowY: 'auto' as const,
      maxHeight: 'none',
      WebkitOverflowScrolling: 'touch',
    },
    inputContainer: {
      position: 'sticky' as const,
      bottom: '0',
      zIndex: 10,
      background: '#0f172a',
      flexShrink: 0,
    },
  }), []);

  // Optimized layout fix function
  const fixMobileLayout = useCallback(() => {
    if (!isMobile || !finalConfig.enableLayoutFix) return;

    const { html, body, main, chatInterface, inputContainer } = mobileStyles;

    // Apply styles to html and body
    Object.assign(document.documentElement.style, html);
    Object.assign(document.body.style, body);

    // Apply styles to main container
    const mainElement = document.querySelector('main');
    if (mainElement) {
      Object.assign((mainElement as HTMLElement).style, main);
    }

    // Apply styles to chat interface
    const chatInterfaceElement = document.querySelector('.chat-interface');
    if (chatInterfaceElement) {
      chatInterfaceElement.classList.add('mobile-chat-interface');
      Object.assign((chatInterfaceElement as HTMLElement).style, chatInterface);
    }

    // Apply styles to input container
    const inputContainerElement = document.querySelector('.message-input-container');
    if (inputContainerElement) {
      Object.assign((inputContainerElement as HTMLElement).style, inputContainer);
    }

    // Add class to mobile container
    const mobileContainer = document.querySelector('.chat-interface')?.parentElement;
    if (mobileContainer && !mobileContainer.classList.contains('mobile-chat-container')) {
      mobileContainer.classList.add('mobile-chat-container');
    }
  }, [isMobile, finalConfig.enableLayoutFix, mobileStyles]);

  // Throttled and debounced versions for performance
  const throttledFixLayout = useMemo(
    () => throttle(fixMobileLayout, finalConfig.throttleMs),
    [fixMobileLayout, finalConfig.throttleMs]
  );

  const debouncedFixLayout = useMemo(
    () => debounce(fixMobileLayout, finalConfig.debounceMs),
    [fixMobileLayout, finalConfig.debounceMs]
  );

  // Viewport configuration
  const configureViewport = useCallback(() => {
    if (!isMobile || !finalConfig.enableViewportFix) return;

    const viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    const content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    if (viewportMeta) {
      viewportMeta.setAttribute('content', content);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = content;
      document.head.appendChild(meta);
    }
  }, [isMobile, finalConfig.enableViewportFix]);

  // Touch optimization
  const optimizeTouch = useCallback(() => {
    if (!isMobile || !finalConfig.enableTouchOptimization) return;

    // Prevent zoom on double tap
    const preventZoom = (e: TouchEvent) => {
      if (finalConfig.preventZoom && e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Optimize scroll performance
    const optimizeScroll = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.chat-interface')) {
        // Use native smooth scrolling
        target.style.scrollBehavior = 'smooth';
      }
    };

    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', optimizeScroll, { passive: true });

    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', optimizeScroll);
    };
  }, [isMobile, finalConfig.enableTouchOptimization, finalConfig.preventZoom]);

  // Scroll optimization
  const optimizeScrolling = useCallback(() => {
    if (!isMobile || !finalConfig.enableScrollOptimization) return;

    const scrollElements = document.querySelectorAll('.chat-interface, .sidebar');
    scrollElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      (htmlElement.style as any).WebkitOverflowScrolling = 'touch';
      (htmlElement.style as any).overscrollBehavior = 'contain';
    });
  }, [isMobile, finalConfig.enableScrollOptimization]);

  // Main effect
  useEffect(() => {
    if (!isMobile) return;

    // Add mobile device classes
    document.body.classList.add('mobile-device');
    document.documentElement.classList.add('mobile-device');

    // Configure viewport
    configureViewport();

    // Apply initial optimizations
    fixMobileLayout();
    optimizeScrolling();

    // Set up touch optimization
    const cleanupTouch = optimizeTouch();

    // Set up observers and event listeners
    const resizeObserver = new ResizeObserver(throttledFixLayout);
    resizeObserver.observe(document.body);

    const mutationObserver = new MutationObserver(debouncedFixLayout);
    mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    window.addEventListener('resize', throttledFixLayout);
    window.addEventListener('orientationchange', debouncedFixLayout);

    // Cleanup function
    return () => {
      document.body.classList.remove('mobile-device');
      document.documentElement.classList.remove('mobile-device');
      
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      
      window.removeEventListener('resize', throttledFixLayout);
      window.removeEventListener('orientationchange', debouncedFixLayout);
      
      cleanupTouch?.();
    };
  }, [
    isMobile,
    configureViewport,
    fixMobileLayout,
    optimizeScrolling,
    optimizeTouch,
    throttledFixLayout,
    debouncedFixLayout,
  ]);

  // Return null since this is a side-effect only component
  return null;
}
