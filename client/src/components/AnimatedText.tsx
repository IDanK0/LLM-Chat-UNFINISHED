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
  
  // Verificare se lo streaming è abilitato nelle impostazioni
  const settings = getSettings();
  const isAnimationEnabled = settings.stream && !disabled;
  const animationSpeed = settings.animationSpeed || 15; // Parole al secondo
  
  // Dividi il testo in parole quando il testo cambia o l'animazione viene abilitata/disabilitata
  useEffect(() => {
    // Questo regex divide il testo mantenendo spazi e punteggiatura con le parole
    // per un'animazione più naturale
    const regex = /(\S+\s*)/g;
    const matches = text.match(regex) || [];
    words.current = matches;
    
    if (!isAnimationEnabled) {
      // Se l'animazione è disabilitata, mostra subito tutto il testo
      setDisplayedText(text);
      setIsComplete(true);
      setIsAnimating(false);
        return;
    }
    
    // Reset e avvio animazione
    setDisplayedText("");
    setIsAnimating(true);
    setIsComplete(false);
    wordIndexRef.current = 0;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    
    // Piccolo ritardo prima dell'inizio per dare un effetto più naturale
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

  // Funzione di animazione che utilizza requestAnimationFrame per fluidità
  const animate = (timestamp: number) => {
    // Calcola il tempo trascorso dall'ultimo frame
    const elapsed = timestamp - lastTimeRef.current;
    
    // Calcola l'intervallo in base alla velocità impostata
    // 1000ms / velocità = ms per parola
    const speedPerWord = 1000 / animationSpeed;
    
    if (elapsed > speedPerWord) {
      // Tempo sufficiente è trascorso per mostrare una nuova parola
      if (wordIndexRef.current < words.current.length) {
        // Aggiungi la prossima parola
        const currentText = words.current
          .slice(0, wordIndexRef.current + 1)
          .join("");
          
        setDisplayedText(currentText);
        wordIndexRef.current++;
        lastTimeRef.current = timestamp;
      } else {
        // Animazione completata
        setIsAnimating(false);
        setIsComplete(true);
        return; // Uscire dalla funzione di animazione
    }
    }
    
    // Continua l'animazione solo se non abbiamo finito
    if (wordIndexRef.current < words.current.length) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Assicuriamoci di impostare gli stati correttamente
      setIsAnimating(false);
      setIsComplete(true);
      animationRef.current = null;
    }
  };

  // Opzione per saltare l'animazione con un clic
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

  // Cursore lampeggiante solo durante l'animazione attiva
  const renderCursor = () => {
    if (isAnimating) {
      return <span className="animate-cursor">▌</span>;
    }
    return null;
  };

  return (
    <div 
      className={`relative ${className}`} 
      onClick={handleClick}
      aria-live={isAnimating ? "polite" : "off"}
      style={{ cursor: isAnimating ? 'pointer' : 'auto' }}
    >
      {displayedText}
      {renderCursor()}
      
      {/* Stili per il cursore e l'animazione */}
      <style jsx global>{`
        .animate-cursor {
          display: inline-block;
          color: #3b82f6;
          opacity: 1;
          font-weight: normal;
          animation: blink 0.7s infinite;
          margin-left: 1px;
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