import { create } from 'zustand';
import type { GameStateForPlayer } from '../engine/types';

interface GameStore {
  game: GameStateForPlayer | null;
  setGame: (state: GameStateForPlayer) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  game: null,
  setGame: (state) => set({ game: state }),
}));
