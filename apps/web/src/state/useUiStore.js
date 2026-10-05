import { create } from "zustand";

export const useUiStore = create((set) => ({
  ambienceEnabled: false,
  currentChildId: null,
  setAmbienceEnabled: (ambienceEnabled) => set({ ambienceEnabled }),
  setCurrentChildId: (currentChildId) => set({ currentChildId })
}));
