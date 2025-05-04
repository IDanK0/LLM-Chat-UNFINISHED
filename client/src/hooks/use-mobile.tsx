import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Check based on window width
      const isMobileByWidth = window.innerWidth < 768;
      
      // Check based on user agent
      const isMobileByUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // Check based on matchMedia (checking if it supports hover)
      const isMobileByMatchMedia = window.matchMedia('(hover: none)').matches;
      
      // Set as mobile if at least one of the checks is true
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