'use client';
// components/ParticleBackground.tsx
// Antigravity-style interactive particle canvas — particles gravitate towards cursor

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  color: string;
  attracted: boolean;
  attractRadius: number;
}

const COLORS = [
  'rgba(37, 99, 235,',   // brand blue
  'rgba(6, 182, 212,',   // cyan
  'rgba(56, 189, 248,',  // light blue
  'rgba(99, 102, 241,',  // indigo
  'rgba(147, 197, 253,', // pale blue
];

export default function ParticleBackground({ dark = false }: { dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 7000);
      particlesRef.current = Array.from({ length: Math.min(count, 120) }, () => {
        const baseOp = 0.15 + Math.random() * 0.35;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: 1 + Math.random() * 2.5,
          opacity: baseOp,
          baseOpacity: baseOp,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          attracted: false,
          attractRadius: 120 + Math.random() * 80,
        };
      });
    };

    const handleMouse = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const p of particlesRef.current) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Attraction force
        if (dist < p.attractRadius && dist > 0) {
          const force = Math.pow(1 - dist / p.attractRadius, 1.5) * 1.2;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
          p.opacity = Math.min(1, p.baseOpacity + force * 2.5);
          p.attracted = true;
        } else {
          p.attracted = false;
          p.opacity += (p.baseOpacity - p.opacity) * 0.04;
        }

        // Damping
        p.vx *= 0.92;
        p.vy *= 0.92;

        // Max speed clamp
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 4) { p.vx = (p.vx / speed) * 4; p.vy = (p.vy / speed) * 4; }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        const drawSize = p.attracted ? p.size * (1 + (1 - dist / p.attractRadius) * 0.5) : p.size;
        ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity.toFixed(2)})`;
        ctx.fill();

        // Draw glow for attracted particles
        if (p.attracted && dist < 100) {
          const glowIntensity = Math.pow(1 - dist / 100, 2);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
          glow.addColorStop(0, `${p.color}${0.25 * glowIntensity})`);
          glow.addColorStop(1, `${p.color}0)`);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      // Draw subtle lines between nearby particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const opacity = (1 - dist / 80) * 0.08 * Math.min(a.opacity, b.opacity) * 3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = dark
              ? `rgba(56,189,248,${opacity})`
              : `rgba(37,99,235,${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [dark]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
