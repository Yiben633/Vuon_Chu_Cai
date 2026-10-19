import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudioControllerContext } from "./audioContext.js";

const idleState = {
  status: "idle",
  mode: null,
  label: null,
  message: null
};

function findVietnameseVoice() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  return window.speechSynthesis.getVoices().find((voice) => voice.lang?.toLowerCase().startsWith("vi")) ?? null;
}
export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const [state, setState] = useState(idleState);
  const [ambienceVolume, setAmbienceVolume] = useState(0.6);

  const stopNarration = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setState(idleState);
  }, []);

  const playNarration = useCallback(
    async ({ audioUrl, text, label = "Loi doc" }) => {
      stopNarration();
      if (audioUrl) {
        const element = new Audio(audioUrl);
        audioRef.current = element;
        element.onended = () => setState(idleState);
        element.onerror = () =>
          setState({
            status: "unavailable",
            mode: "asset",
            label,
            message: "File audio chua phat duoc tren thiet bi nay."
          });
        setState({ status: "playing", mode: "asset", label, message: "Dang phat audio bien tap." });
        await element.play();
        return;
      }

      const voice = findVietnameseVoice();
      if (!text || !voice) {
        setState({
          status: "unavailable",
          mode: "tts",
          label,
          message: "Chua co file audio that va thiet bi khong co giong TTS tieng Viet."
        });
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.voice = voice;
      utterance.rate = 0.88;
      utterance.pitch = 1;
      utterance.onend = () => setState(idleState);
      utterance.onerror = () =>
        setState({
          status: "unavailable",
          mode: "tts",
          label,
          message: "Giong doc thiet bi khong phat duoc luc nay."
        });
      utteranceRef.current = utterance;
      setState({ status: "playing", mode: "tts", label, message: "Dang doc bang giong thiet bi, khong phai audio mien." });
      window.speechSynthesis.speak(utterance);
    },
    [stopNarration]
  );

  useEffect(() => {
    function stopForBackground() {
      if (document.hidden) stopNarration();
    }
    window.addEventListener("pagehide", stopNarration);
    document.addEventListener("visibilitychange", stopForBackground);
    return () => {
      window.removeEventListener("pagehide", stopNarration);
      document.removeEventListener("visibilitychange", stopForBackground);
      stopNarration();
    };
  }, [stopNarration]);

  const value = useMemo(
    () => ({
      ambienceVolume,
      playNarration,
      setAmbienceVolume,
      state,
      stopNarration
    }),
    [ambienceVolume, playNarration, state, stopNarration]
  );

  return <AudioControllerContext.Provider value={value}>{children}</AudioControllerContext.Provider>;
}
