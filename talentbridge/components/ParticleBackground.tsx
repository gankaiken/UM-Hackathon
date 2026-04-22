'use client';
// components/ParticleBackground.tsx
// Enhanced Particle Background with Target Shape Support (Magnet effect)

import { useEffect, useRef } from 'react';
import { useParticleStore } from '@/store/particleStore';

interface Particle {
  ox: number; // original x
  oy: number; // original y
  x: number;  // current x
  y: number;  // current y
  vx: number;
  vy: number;
  size: number;
  baseOpacity: number;
  color: string;
  targetIdx: number | null;
}

const COLORS = [
  'rgba(37, 99, 235,',   // brand blue
  'rgba(147, 51, 234,',  // purple (new)
  'rgba(6, 182, 212,',   // cyan
  'rgba(56, 189, 248,',  // light blue
];

export default function ParticleBackground({ 
  dark = false, 
  fullScreen = false,
  mode = 'rings' // 'rings' or 'random'
}: { 
  dark?: boolean; 
  fullScreen?: boolean;
  mode?: 'rings' | 'random';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  
  const { targetPoints, isActive } = useParticleStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = fullScreen ? document.documentElement.scrollHeight : canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      const newParticles: Particle[] = [];
      const centerX = window.innerWidth / 2;
      const centerY = (fullScreen ? window.innerHeight : canvas.height) / 2;
      
      if (mode === 'rings') {
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY) + 100;
        const ringSpacing = 40;
        const numRings = Math.floor(maxRadius / ringSpacing);

        for (let r = 1; r <= numRings; r++) {
          const radius = r * ringSpacing;
          const circ = 2 * Math.PI * radius;
          const dotSpacing = 35 + (r * 1.5); 
          const numDots = Math.floor(circ / dotSpacing);

          for (let i = 0; i < numDots; i++) {
            const angle = (i / numDots) * 2 * Math.PI + (r * 0.05);
            const ox = centerX + Math.cos(angle) * radius;
            const oy = centerY + Math.sin(angle) * radius;
            const baseOp = 0.15 + Math.random() * 0.35;
            newParticles.push({
              ox, oy, x: ox, y: oy, vx: 0, vy: 0,
              size: 1.2 + Math.random() * 1.5,
              baseOpacity: baseOp,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              targetIdx: null
            });
          }
        }
      } else {
        // Random stardust mode
        const count = Math.floor((canvas.width * canvas.height) / 8000);
        for (let i = 0; i < Math.min(count, 300); i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const baseOp = 0.1 + Math.random() * 0.3;
          newParticles.push({
            ox: x, oy: y, x: x, y: y, vx: 0, vy: 0,
            size: 1 + Math.random() * 2,
            baseOpacity: baseOp,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            targetIdx: null
          });
        }
      }
      particlesRef.current = newParticles;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      const repelRadius = 200;
      const repelForce = 1.5;
      const springForce = isActive ? 0.02 : 0.05;
      const magnetForce = 0.15; // Stronger pull for shape formation
      const friction = 0.85;

      // Assign targets if active
      if (isActive && targetPoints.length > 0) {
        particlesRef.current.forEach((p, i) => {
          if (i < targetPoints.length) {
            p.targetIdx = i;
          } else {
            p.targetIdx = null;
          }
        });
      } else {
        particlesRef.current.forEach(p => p.targetIdx = null);
      }

      for (const p of particlesRef.current) {
        let tx = p.ox;
        let ty = p.oy;
        let currentSpring = springForce;

        if (isActive && p.targetIdx !== null) {
          tx = targetPoints[p.targetIdx].x;
          ty = targetPoints[p.targetIdx].y;
          currentSpring = magnetForce;
        }

        // 1. Spring/Magnet force
        const dxT = tx - p.x;
        const dyT = ty - p.y;
        p.vx += dxT * currentSpring;
        p.vy += dyT * currentSpring;

        // 2. Mouse repulsion (only in stardust/rings mode, or subtle in shape mode)
        const dxMouse = p.x - mx;
        const dyMouse = p.y - my;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (!isActive && distMouse < repelRadius && distMouse > 0) {
          const pushFactor = Math.pow((repelRadius - distMouse) / repelRadius, 2);
          p.vx += (dxMouse / distMouse) * pushFactor * repelForce;
          p.vy += (dyMouse / distMouse) * pushFactor * repelForce;
        }

        p.vx *= friction;
        p.vy *= friction;
        p.x += p.vx;
        p.y += p.vy;

        const distFromTarget = Math.sqrt(dxT * dxT + dyT * dyT);
        const opacity = Math.min(1, p.baseOpacity + (isActive ? 0.4 : (distFromTarget > 50 ? 0.3 : 0)));
        
        ctx.beginPath();
        const size = p.size * (isActive ? 1.2 : 1);
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${opacity.toFixed(2)})`;
        ctx.fill();

        if (isActive || distFromTarget > 20) {
          const glowSize = size * (isActive ? 4 : 3);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
          glow.addColorStop(0, `${p.color}${isActive ? 0.3 : 0.15})`);
          glow.addColorStop(1, `${p.color}0)`);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [dark, fullScreen, mode, isActive, targetPoints]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: fullScreen ? 'absolute' : 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: dark ? 0.8 : 1,
      }}
    />
  );
}
