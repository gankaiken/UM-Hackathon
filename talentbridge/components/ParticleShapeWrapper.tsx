'use client';
import { useRef, useEffect } from 'react';
import { useParticleStore } from '@/store/particleStore';

interface Props {
  children: React.ReactNode;
  shape?: 'braces' | 'brackets' | 'tags';
}

export default function ParticleShapeWrapper({ children, shape = 'braces' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setTargetPoints, clearTargetPoints } = useParticleStore();

  const generateBraces = (rect: DOMRect, parentRect: DOMRect) => {
    const points: { x: number; y: number }[] = [];
    const padding = 60;
    
    // Calculate relative positions within the section
    const left = rect.left - parentRect.left - padding;
    const right = rect.right - parentRect.left + padding;
    const top = rect.top - parentRect.top;
    const bottom = rect.bottom - parentRect.top;
    
    const midY = (top + bottom) / 2;
    const braceWidth = 30;
    const step = 8; // Density of points

    // Left Brace {
    for (let x = left; x <= left + braceWidth; x += step) points.push({ x, y: top });
    for (let y = top; y <= midY - braceWidth; y += step) points.push({ x: left, y });
    for (let x = left - braceWidth; x <= left; x += step) points.push({ x, y: midY });
    for (let y = midY + braceWidth; y <= bottom; y += step) points.push({ x: left, y });
    for (let x = left; x <= left + braceWidth; x += step) points.push({ x, y: bottom });

    // Right Brace }
    for (let x = right - braceWidth; x <= right; x += step) points.push({ x, y: top });
    for (let y = top; y <= midY - braceWidth; y += step) points.push({ x: right, y });
    for (let x = right; x <= right + braceWidth; x += step) points.push({ x, y: midY });
    for (let y = midY + braceWidth; y <= bottom; y += step) points.push({ x: right, y });
    for (let x = right - braceWidth; x <= right; x += step) points.push({ x, y: bottom });

    return points;
  };

  const handleMouseEnter = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const parentSection = containerRef.current.closest('section');
      if (parentSection) {
        const parentRect = parentSection.getBoundingClientRect();
        const points = generateBraces(rect, parentRect);
        setTargetPoints(points);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={clearTargetPoints}
      style={{ position: 'relative', display: 'inline-block', width: '100%' }}
    >
      {children}
    </div>
  );
}
