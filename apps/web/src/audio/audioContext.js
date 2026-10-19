import { createContext, useContext } from "react";

export const AudioControllerContext = createContext(null);

export function useAudioController() {
  const context = useContext(AudioControllerContext);
  if (!context) throw new Error("useAudioController must be used inside AudioProvider");
  return context;
}
