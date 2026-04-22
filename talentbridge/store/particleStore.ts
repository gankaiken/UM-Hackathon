import { create } from 'zustand';

interface ShapePoint {
  x: number;
  y: number;
}

interface ParticleState {
  targetPoints: ShapePoint[];
  isActive: boolean;
  setTargetPoints: (points: ShapePoint[]) => void;
  clearTargetPoints: () => void;
}

export const useParticleStore = create<ParticleState>((set) => ({
  targetPoints: [],
  isActive: false,
  setTargetPoints: (points) => set({ targetPoints: points, isActive: true }),
  clearTargetPoints: () => set({ targetPoints: [], isActive: false }),
}));
