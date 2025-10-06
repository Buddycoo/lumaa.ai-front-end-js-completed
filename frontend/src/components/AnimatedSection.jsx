import React, { useEffect, useRef, useState } from 'react';
import { trackSectionView } from '../hooks/useAnalytics';

const AnimatedSection = ({ 
  children, 
  className = '', 
  sectionName = '', 
  animationType = 'fade-up',
  threshold = 0.1,
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasViewed) {
          setTimeout(() => {
            setIsVisible(true);
            setHasViewed(true);
            
            // Track section view for analytics
            if (sectionName) {
              trackSectionView(sectionName);
            }
          }, delay);
        }
      },
      {
        threshold: threshold,
        rootMargin: '50px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [threshold, delay, sectionName, hasViewed]);

  const getAnimationClass = () => {
    const baseClasses = 'transition-all duration-1000 ease-out';
    
    if (!isVisible) {
      switch (animationType) {
        case 'fade-up':
          return `${baseClasses} opacity-0 transform translate-y-12`;
        case 'fade-down':
          return `${baseClasses} opacity-0 transform -translate-y-12`;
        case 'fade-left':
          return `${baseClasses} opacity-0 transform translate-x-12`;
        case 'fade-right':
          return `${baseClasses} opacity-0 transform -translate-x-12`;
        case 'scale':
          return `${baseClasses} opacity-0 transform scale-95`;
        case 'fade':
        default:
          return `${baseClasses} opacity-0`;
      }
    }
    
    return `${baseClasses} opacity-100 transform translate-x-0 translate-y-0 scale-100`;
  };

  return (
    <div 
      ref={sectionRef} 
      className={`${getAnimationClass()} ${className}`}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;