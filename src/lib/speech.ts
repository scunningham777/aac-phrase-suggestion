// Browser-native TTS via the Web Speech API – no backend service needed.

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string): void {
  if (!canSpeak() || !text.trim()) return;
  // Cancel anything mid-utterance so rapid taps don't queue up a backlog.
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
