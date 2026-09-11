import React, { useEffect, useRef, useState } from 'react';

export function ScrollReveal({ children, className = '', animation = 'fade-up', delay = 0, threshold = 0.1 }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    
    const { current } = domRef;
    if (current) observer.observe(current);
    
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [threshold]);

  // Base styles depending on animation
  let baseClass = 'transition-all duration-1000 ease-out';
  let hiddenClass = '';
  let visibleClass = '';

  switch (animation) {
    case 'fade-up':
      hiddenClass = 'opacity-0 translate-y-8';
      visibleClass = 'opacity-100 translate-y-0';
      break;
    case 'fade-left':
      hiddenClass = 'opacity-0 translate-x-12';
      visibleClass = 'opacity-100 translate-x-0';
      break;
    case 'fade-right':
      hiddenClass = 'opacity-0 -translate-x-12';
      visibleClass = 'opacity-100 translate-x-0';
      break;
    case 'zoom-in':
      hiddenClass = 'opacity-0 scale-95';
      visibleClass = 'opacity-100 scale-100';
      break;
    default:
      hiddenClass = 'opacity-0 translate-y-4';
      visibleClass = 'opacity-100 translate-y-0';
  }

  return (
    <div
      ref={domRef}
      className={`${baseClass} ${isVisible ? visibleClass : hiddenClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
