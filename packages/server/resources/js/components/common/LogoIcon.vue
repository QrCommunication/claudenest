<template>
    <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#1a1b26"/>
                <stop offset="100%" style="stop-color:#24283b"/>
            </linearGradient>
            <linearGradient id="nestGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#a855f7"/>
                <stop offset="100%" style="stop-color:#6366f1"/>
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#22d3ee"/>
                <stop offset="100%" style="stop-color:#a855f7"/>
            </linearGradient>
        </defs>
        <rect x="0" y="0" width="512" height="512" rx="96" fill="url(#bgGrad)"/>
        <g transform="translate(256, 256)">
            <path d="M-80 -40 Q-120 -40 -120 0 Q-120 40 -80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M80 -40 Q120 -40 120 0 Q120 40 80 40" stroke="url(#nestGrad)" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M-60 -70 Q-130 -70 -130 0 Q-130 70 -60 70" stroke="url(#nestGrad)" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
            <path d="M60 -70 Q130 -70 130 0 Q130 70 60 70" stroke="url(#nestGrad)" stroke-width="12" fill="none" stroke-linecap="round" opacity="0.7"/>
            <circle cx="-35" cy="0" r="18" fill="#22d3ee"/>
            <circle cx="0" cy="0" r="18" fill="url(#nestGrad)"/>
            <circle cx="35" cy="0" r="18" fill="#22d3ee"/>
            <line x1="-17" y1="0" x2="17" y2="0" stroke="url(#accentGrad)" stroke-width="6" opacity="0.8"/>
        </g>
    </svg>
</template>

<script setup lang="ts">
// Logo icon component - no props needed
</script>
