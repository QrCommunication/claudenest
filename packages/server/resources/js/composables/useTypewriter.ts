import { ref, onUnmounted } from 'vue';

interface TypewriterOptions {
  speed?: number;      // ms per character (default 50)
  pauseEnd?: number;   // ms pause at end (default 2000)
  loop?: boolean;      // loop animation (default false)
  startDelay?: number; // ms before starting (default 0)
}

export function useTypewriter(text: string, options: TypewriterOptions = {}) {
  const { speed = 50, pauseEnd = 2000, loop = false, startDelay = 0 } = options;
  const displayText = ref('');
  const isTyping = ref(false);
  const isComplete = ref(false);
  let rafId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // Check reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start() {
    if (prefersReducedMotion) {
      displayText.value = text;
      isComplete.value = true;
      return;
    }

    isTyping.value = true;
    isComplete.value = false;
    let charIndex = 0;
    let lastTime = 0;

    function step(timestamp: number) {
      if (!lastTime) lastTime = timestamp;
      const elapsed = timestamp - lastTime;

      if (elapsed >= speed) {
        lastTime = timestamp;
        charIndex++;
        displayText.value = text.slice(0, charIndex);

        if (charIndex >= text.length) {
          isTyping.value = false;
          isComplete.value = true;

          if (loop) {
            timeoutId = setTimeout(() => {
              displayText.value = '';
              charIndex = 0;
              isTyping.value = true;
              isComplete.value = false;
              lastTime = 0;
              rafId = requestAnimationFrame(step);
            }, pauseEnd);
          }
          return;
        }
      }

      rafId = requestAnimationFrame(step);
    }

    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(step);
    }, startDelay);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    if (timeoutId) clearTimeout(timeoutId);
    isTyping.value = false;
  }

  function reset() {
    stop();
    displayText.value = '';
    isComplete.value = false;
  }

  onUnmounted(stop);

  return { displayText, isTyping, isComplete, start, stop, reset };
}
