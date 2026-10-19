export function detectBrowserSpeechCapability() {
  if (typeof window === "undefined") {
    return {
      available: false,
      label: "Browser speech recognition unavailable outside the browser."
    };
  }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return {
    available: Boolean(SpeechRecognition),
    label: SpeechRecognition
      ? "Thiet bi co API nhan dien giong noi, nhung app khong tu bat khi chua co dong y cloud."
      : "Trinh duyet nay chua co API nhan dien giong noi."
  };
}
