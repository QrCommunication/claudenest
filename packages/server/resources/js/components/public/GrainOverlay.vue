<template>
  <div class="grain-overlay" aria-hidden="true">
    <div class="grain-mesh" />
    <svg class="grain-noise" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  </div>
</template>

<style scoped>
.grain-overlay {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.grain-mesh {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(42% 52% at 18% 22%, rgba(168, 85, 247, 0.18), transparent 60%),
    radial-gradient(38% 48% at 82% 28%, rgba(34, 211, 238, 0.14), transparent 62%),
    radial-gradient(50% 60% at 50% 92%, rgba(99, 102, 241, 0.12), transparent 65%);
  filter: blur(40px);
  animation: meshDrift 24s ease-in-out infinite alternate;
  will-change: transform;
}

:root[data-theme='light'] .grain-mesh {
  background:
    radial-gradient(42% 52% at 18% 22%, rgba(147, 51, 234, 0.12), transparent 60%),
    radial-gradient(38% 48% at 82% 28%, rgba(8, 145, 178, 0.1), transparent 62%),
    radial-gradient(50% 60% at 50% 92%, rgba(79, 70, 229, 0.08), transparent 65%);
}

.grain-noise {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.05;
  mix-blend-mode: overlay;
}

:root[data-theme='light'] .grain-noise {
  opacity: 0.035;
  mix-blend-mode: multiply;
}

@keyframes meshDrift {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  100% {
    transform: translate3d(-2%, 2%, 0) rotate(0.5deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .grain-mesh {
    animation: none;
  }
}
</style>
