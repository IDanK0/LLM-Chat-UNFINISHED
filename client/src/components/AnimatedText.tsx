import React, { useState, useEffect, useRef, memo } from 'react';
import { getSettings } from "@/lib/settingsStore";

interface AnimatedTextProps {
  text: string;
  className?: string;
  disabled?: boolean;
}

const AnimatedText = memo(({ text, className = "", disabled = false }: AnimatedTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const wordIndexRef = useRef(0);
  const words = useRef<string[]>([]);
  
  // Check if streaming is enabled in the settings
  const settings = getSettings();
  const isAnimationEnabled = settings.stream && !disabled;
  const animationSpeed = settings.animationSpeed || 15; // Words per second
  
  // Split the text into words when the text changes or animation is enabled/disabled
  useEffect(() => {
    // Preserve line breaks during text animation
    // This regex splits the text into chunks (words, spaces, and line breaks)
    const regex = /(\n|[^\s\n]+|\s+)/g;
    const matches = text.match(regex) || [];
    words.current = matches;
    
    if (!isAnimationEnabled) {
      // If animation is disabled, immediately show all text
      setDisplayedText(text);
      setIsComplete(true);
      setIsAnimating(false);
        return;
    }
    
    // Reset and start animation
    setDisplayedText("");
    setIsAnimating(true);
    setIsComplete(false);
    wordIndexRef.current = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    
    // Small delay before starting for a more natural effect
    setTimeout(() => {
      lastTimeRef.current = performance.now();
      animationRef.current = requestAnimationFrame(animate);
    }, 100);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
    }
  };
  }, [text, isAnimationEnabled]);

  // Animation function that uses requestAnimationFrame for smoothness
  const animate = (timestamp: number) => {
    // Calculate time elapsed since the last frame
    const elapsed = timestamp - lastTimeRef.current;
    
    // Calculate interval based on the set speed
    // 1000ms / speed = ms per word
    const speedPerWord = 1000 / animationSpeed;
    
    if (elapsed > speedPerWord) {
      // Enough time has passed to show a new word
      if (wordIndexRef.current < words.current.length) {
        // Add the next word
        const currentText = words.current
          .slice(0, wordIndexRef.current + 1)
          .join("");
          
        setDisplayedText(currentText);
        wordIndexRef.current++;
        lastTimeRef.current = timestamp;
      } else {
        // Animation completed
        setIsAnimating(false);
        setIsComplete(true);
        return; // Exit the animation function
    }
    }
    
    // Continue animation only if we haven't finished
    if (wordIndexRef.current < words.current.length) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Make sure states are set correctly
      setIsAnimating(false);
      setIsComplete(true);
      animationRef.current = null;
    }
  };

  // Option to skip animation with a click
  const handleClick = () => {
    if (isAnimating && !isComplete) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setDisplayedText(text);
      setIsAnimating(false);
      setIsComplete(true);
    }
  };

  // Blinking cursor only during active animation
  const renderCursor = () => {
    if (isAnimating) {
      return <span className="animate-cursor">▌</span>;
    }
    return null;
  };

  return (
    <div 
      className={`relative message-content ${className}`} 
      onClick={handleClick}
      aria-live={isAnimating ? "polite" : "off"}
      style={{ cursor: isAnimating ? 'pointer' : 'auto' }}
    >
      {displayedText}
      {renderCursor()}
      
      {/* Styles for cursor and animation */}
      <style>{`
        .animate-cursor {
          display: inline-block;
          color: #3b82f6;
          opacity: 1;
          font-weight: normal;
          animation: blink 0.7s infinite;
          margin-left: 1px;
}

        .message-content {
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* Supporto cross-browser */
        @supports (-moz-appearance:none) {
          /* Firefox-specifici */
          .animate-cursor {
            animation-duration: 1s;
          }
        }
        
        @supports (-webkit-appearance:none) {
          /* WebKit (Safari/Chrome) specifici */
          .animate-cursor {
            animation-timing-function: ease-in-out;
          }
        }
        
        /* Supporto per dispositivi touch (mobile) */
        @media (hover: none) {
          .animate-cursor {
            height: 1.2em;
          }
        }
        
        /* Riduzione del movimento per accessibilità */
        @media (prefers-reduced-motion: reduce) {
          .animate-cursor {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
});

AnimatedText.displayName = 'AnimatedText';
export default AnimatedText;