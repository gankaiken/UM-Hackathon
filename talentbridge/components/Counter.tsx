'use client';
import { useState, useEffect, useRef } from 'react';

interface CounterProps {
  end: string;
  duration?: number;
  delay?: number;
}

export default function Counter({ end, duration = 1500, delay = 0 }: CounterProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Extract number and suffix (e.g., "200K+" -> { num: 200, suffix: "K+" })
  const match = end.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : '';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 } // Trigger when 30% visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp - delay) / duration, 1);
      
      if (progress > 0) {
        // Ease out quad
        const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easedProgress * target));
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [isVisible, target, duration, delay]);

  return (
    <span ref={containerRef}>
      {count}
      {suffix}
    </span>
  );
}
