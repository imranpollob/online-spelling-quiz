import pronunciations from "../data/pronunciations.json";
import wordPolicy from "../data/wordPolicy";

let currentAudio;
let playbackId = 0;

export function stopSpeaking() {
  playbackId += 1;
  if (currentAudio) {
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

export default function say(word) {
  stopSpeaking();
  if (typeof word !== "string" || !word.trim()) return;

  const normalized = wordPolicy.canonicalSpelling(word);
  const requestId = playbackId;
  let usedFallback = false;
  const fallback = () => {
    if (requestId !== playbackId || usedFallback) return;
    usedFallback = true;
    if (currentAudio) {
      currentAudio.onerror = null;
      currentAudio.pause();
      currentAudio = null;
    }
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      const utterance = new window.SpeechSynthesisUtterance(normalized);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const clip = Object.prototype.hasOwnProperty.call(pronunciations.entries, normalized)
    ? pronunciations.entries[normalized]
    : null;
  if (!clip) {
    fallback();
    return;
  }

  const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  try {
    const audio = new Audio(`${base}/${clip.file}`);
    currentAudio = audio;
    audio.onerror = fallback;
    const playback = audio.play();
    playback?.catch((error) => {
      // Autoplay can be blocked until the user presses Listen.
      if (error.name !== "NotAllowedError" && error.name !== "AbortError") fallback();
    });
  } catch {
    fallback();
  }
}
