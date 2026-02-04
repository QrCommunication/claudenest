# Règles Mobile - React Native

## Stack Technique
- React Native 0.73+
- TypeScript (strict)
- Zustand (State Management)
- React Navigation 6
- Reanimated 3
- Socket.io client

## Standards de Code

### Components
```typescript
import React, { memo, useCallback } from 'react';
import type { Machine } from '@/types';

interface MachineCardProps {
  machine: Machine;
  onPress: (machine: Machine) => void;
}

// Toujours memoiser les composants de liste
export const MachineCard = memo(function MachineCard({
  machine,
  onPress,
}: MachineCardProps) {
  const handlePress = useCallback(() => {
    onPress(machine);
  }, [machine, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      {/* Content */}
    </TouchableOpacity>
  );
});
```

### Stores (Zustand)
- Utiliser le persist middleware
- Séparer state et actions
- Typage strict
- Async/await pour les API calls

### Animations
- Reanimated 3 pour toutes les animations
- Layout animations pour les listes
- Éviter Animated API native

## Colors (Brand - NE PAS MODIFIER)
```typescript
const colors = {
  primary: '#a855f7',
  indigo: '#6366f1',
  cyan: '#22d3ee',
  background: {
    dark1: '#0f0f1a',
    dark2: '#1a1b26',
    card: '#24283b',
  },
  // ...
};
```

## Patterns Interdits
- ❌ Pas de `any` dans TypeScript
- ❌ Pas de re-renders inutiles (utiliser memo)
- ❌ Pas de setState dans render
- ❌ Pas de console.log en production
