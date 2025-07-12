// useSmoothScroll.js - MUCH simpler and actually works
import { useEffect } from 'react';

export default function useSmoothScroll() {
  useEffect(() => {
    // Just use CSS smooth scrolling - it's built into browsers and works perfectly
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);
}