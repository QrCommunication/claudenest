# Règles Frontend - Vue.js 3

## Stack Technique
- Vue.js 3 (Composition API)
- TypeScript (strict)
- Pinia (State Management)
- Tailwind CSS
- xterm.js + WebGL
- Laravel Echo

## Standards de Code

### Components (Script Setup)
```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { Machine } from '@/types';

interface Props {
  machine: Machine;
  showDetails?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false,
});

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

const statusColor = computed(() => {
  const colors = {
    online: 'text-green-500',
    offline: 'text-red-500',
  };
  return colors[props.machine.status];
});
</script>
```

### Stores (Pinia)
- Utiliser la syntaxe function-based
- Séparer state, getters (computed), actions
- Typage strict
- Pas de `any`

### Terminal (xterm.js)
- WebGL addon obligatoire
- Theme ClaudeNest obligatoire
- Fit addon pour le resize
- Search addon intégré

## Colors (Brand - NE PAS MODIFIER)
```css
--color-primary: #a855f7;
--color-indigo: #6366f1;
--color-cyan: #22d3ee;
--color-bg-1: #0f0f1a;
--color-bg-2: #1a1b26;
--color-bg-3: #24283b;
```

## Patterns Interdits
- ❌ Pas de Options API
- ❌ Pas de `any` dans TypeScript
- ❌ Pas de styles inline
- ❌ Pas de console.log en production
