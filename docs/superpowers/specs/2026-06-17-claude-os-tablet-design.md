# Claude OS — Mode tablette (bureau à fenêtres) — Design Spec

- **Date** : 2026-06-17
- **Cible** : `packages/mobile` (React Native 0.85 / Expo 56 / React 19.2 / Zustand 5 / TS strict)
- **Statut** : design validé (en attente de relecture utilisateur avant plan d'implémentation)
- **Branche de dev** : `feat/claude-os-tablet` (merge unique final = livraison « big-bang » cohérente ; `main` reste fonctionnel pendant le chantier)

---

## 1. Objectif

Transformer le **mode tablette large (≥ 1024 dp)** de l'app mobile en un véritable **bureau « OS-like »** : barre des tâches en haut (style GNOME), dock-lanceur d'apps en bas, fenêtres flottantes multiples **déplaçables / redimensionnables** avec les 3 boutons (minimize / maximize / close), gestion de fenêtres complète (focus/z-order, snapping, tiling, cascade, multi-instances) et **bureaux virtuels (workspaces)**. Chaque fonctionnalité de l'app devient une **« app »** lancée en fenêtre, et la navigation interne devient une **grille d'icônes**.

Métaphore : l'app n'est plus une pile d'écrans empilés, c'est un système d'exploitation où les fonctionnalités sont des apps fenêtrées.

## 2. Décisions validées (forks)

| Décision | Choix |
|---|---|
| Répartition barre/dock | **Haut = fenêtres + système (GNOME)** · **Bas = dock-lanceur d'apps** ; les sessions/terminaux deviennent des fenêtres |
| Contenu des fenêtres | **Refonte native de CHAQUE écran** en panneau OS (navigation interne en tuiles/icônes) |
| Profondeur WM | **Ultra** : drag, resize, min/max/close, focus/z-order, multi-fenêtres, snapping, tiling, cascade, multi-instances, **workspaces** |
| Stratégie d'exécution | **Big-bang** (livraison en un seul merge cohérent, 100 % natif), développé sur branche dédiée |
| Seuil d'activation | **Bureau OS uniquement en `isWide` (≥ 1024 dp)** |

## 3. Périmètre & activation responsive

Trois régimes, séparés par un seul branchement dans `src/navigation/MainNavigator.tsx` :

| Largeur | `deviceClass` / flag | Expérience | Statut |
|---|---|---|---|
| `< 600 dp` | phone | Tabs en bas (navigation actuelle) | **inchangé** |
| `600–1024 dp` | tablet / `isExpanded` | Rail gauche + master-detail (actuel) | **inchangé** |
| `≥ 1024 dp` | `isWide` | **Bureau Claude OS** (fenêtres flottantes) | **nouveau** |

```tsx
// MainNavigator : branchement unique
const { isWide } = useResponsiveLayout();
if (isWide) return <TabletDesktop />;          // ← bureau OS
return <Tab.Navigator /* rail≥600 / bottom<600, inchangé */>{/* … */}</Tab.Navigator>;
```

**Garde-fou non-négociable** : aucune régression sur les régimes `< 1024`. Le téléphone et la tablette étroite ne doivent voir **aucun changement de comportement**.

## 4. Architecture

### 4.1 Cerveau — `stores/windowManagerStore.ts` (Zustand, client-only)

État UI pur, **aucun contrat serveur**. Ordres = séquences **monotones** (`seq`), jamais `Date.now()` → réducteurs purs/déterministes (testables).

```ts
// types/index.ts (miroir non requis — client-only)
type WindowState =
  | "normal" | "minimized" | "maximized"
  | "tiled-left" | "tiled-right"
  | "tiled-tl" | "tiled-tr" | "tiled-bl" | "tiled-br";

interface WindowBounds { x: number; y: number; w: number; h: number; }

interface ManagedWindow {
  id: string;            // `${appId}:${instanceKey}` ou uuid court
  appId: string;         // clé AppRegistry
  instanceKey?: string;  // pour multi-instances (ex. projectId, sessionId)
  title: string;
  icon: string;          // MaterialIcons name
  accent: "purple" | "cyan";
  workspaceId: string;
  bounds: WindowBounds;
  prevBounds?: WindowBounds;   // restauration après maximize/tile
  state: WindowState;
  zIndex: number;        // = focusSeq (MRU)
  openSeq: number;       // ordre stable (barre des fenêtres ne saute pas)
  params?: Record<string, unknown>;
}

interface Workspace { id: string; name: string; windowIds: string[]; }

interface OpenAppInput {
  appId: string; instanceKey?: string; title?: string;
  icon?: string; accent?: "purple" | "cyan";
  params?: Record<string, unknown>; bounds?: Partial<WindowBounds>;
}
```

**State** : `workspaces`, `activeWorkspaceId`, `windows: Record<id, ManagedWindow>`, `focusedId`, `seq`, `desktopSize {w,h}` (mesuré par `TabletDesktop`, injecté pour clamp/tiling).

**Actions** : `openApp(OpenAppInput)` (re-open = focus, sauf appId multi-instance) · `focusWindow` · `moveWindow(id, x, y)` · `resizeWindow(id, bounds)` · `minimizeWindow` (+ refocus MRU) · `restoreWindow` · `toggleMaximize` · `snap(id, zone)` · `tileAll()` · `cascade()` · `closeWindow` (+ refocus MRU) · `updateWindow(id, patch)` · `setDesktopSize` · `createWorkspace` · `switchWorkspace` · `moveWindowToWorkspace(id, wsId)` · `closeWorkspace` · `reset`.

**Sélecteurs purs exportés** : `selectOrderedWindows(activeWs)` (tri `openSeq`, filtrage workspace actif), `selectMinimized`, `selectFocused`.

### 4.2 Géométrie pure — `utils/windowGeometry.ts` (TESTÉE)

Fonctions pures, sans React, validées par l'infra `jest.unit` existante (`*.test.ts`, node-env) :

- `clampToDesktop(bounds, desktop)` — confine dans le bureau.
- `snapZoneForPoint(x, y, desktop)` — détecte la zone (left/right/coins/top=maximize) selon la position du curseur près des bords.
- `boundsForZone(zone, desktop)` — calcule les bounds ½/¼ écran / maximize.
- `tileGrid(n, desktop)` — répartit n fenêtres en grille.
- `cascadeBounds(i, base, desktop)` — décalage en cascade.
- `defaultBoundsFor(appDef, desktop, i)` — position d'ouverture par défaut.

### 4.3 Seam — `os/appRegistry.ts` + `windowApi` (bus)

Catalogue déclaratif : chaque fonctionnalité = `AppDefinition`. C'est le point qui découple « quoi afficher » de « comment naviguer ».

```ts
interface WindowApi {
  openApp(input: OpenAppInput): void;   // remplace navigation.navigate
  close(): void;                        // ferme la fenêtre courante
  setTitle(title: string): void;        // remplace navigation.setOptions({title})
  focus(): void;
}

interface AppRenderCtx {
  windowId: string;
  params: Record<string, unknown>;
  windowApi: WindowApi;
}

interface AppDefinition {
  id: string;
  title: string;
  icon: string;                         // MaterialIcons
  accent: "purple" | "cyan";
  category: "infra" | "project" | "system";
  defaultBounds: { w: number; h: number };
  singleInstance?: boolean;             // false → multi-instances par instanceKey
  render(ctx: AppRenderCtx): ReactNode;
}
```

Le `windowApi` est un **bus** : il appelle `windowManagerStore` (openApp/close/updateWindow). Les composants `XContent` natifs n'importent plus React Navigation ; ils reçoivent `params` + `windowApi`.

### 4.4 Chrome OS

| Composant (`os/`) | Rôle | Détail technique |
|---|---|---|
| `FloatingWindow` | Enveloppe interactive de `WindowFrame` | `GestureDetector` (`react-native-gesture-handler` 2.31) pan sur le header → `bounds.x/y` via `reanimated` 4.3 shared values, commit store au relâché ; 8 poignées resize (coins+bords) ; tap → `focusWindow` (z-order) ; double-tap header → `toggleMaximize` ; near-edge release → `snap`. `WindowFrame` lui-même reste présentationnel, juste piloté. |
| `WindowFrame` (modif) | Les 3 traffic-lights deviennent **boutons réels** min/max/close (slot `onMinimize/onMaximize/onClose`), restent décoratifs si non fournis (rétro-compat) | header = zone de drag |
| `TopBar` | Barre GNOME haut | `⊞ Activities` (→ Launcher) · liste des fenêtres ouvertes (clic = focus/restore) · pips workspaces · horloge · cluster statut (WS `●`, machine, badge attention, compte) |
| `Dock` (étendu) | Dock-lanceur bas | apps épinglées (icônes par catégorie) + point « en cours » si fenêtre ouverte ; clic = open/focus. Réutilise le style flottant actuel. |
| `Launcher` | Overlay grille d'icônes plein écran (Activities) | apps par catégorie + recherche ; tap → `openApp` |
| `WorkspaceSwitcher` | Bureaux virtuels | pips dans TopBar + commutation ; move-window-to-workspace via menu fenêtre |
| `TabletDesktop` | Hôte | wallpaper + `selectOrderedWindows` → `FloatingWindow[]` + `TopBar` + `Dock` + `Launcher` ; mesure `onLayout` → `setDesktopSize` |

### 4.5 Intégration

- `MainNavigator` : `if (isWide) return <TabletDesktop/>` (cf. §3).
- `App.tsx` : `ClaudeOSDock` actuel (taskbar sessions flottante) → **conditionné `!isWide`** (reste pour téléphone/tablette étroite). En `isWide`, les sessions sont des fenêtres + listées dans la `TopBar` ; le dock bas est le **lanceur**.
- `navigateToSession(sessionId)` : sur `isWide`, route vers `openApp({ appId: "session", instanceKey: sessionId })` au lieu de `navigationRef.navigate`. Détection via le flag courant. (NotificationBanner / push / coordinator continuent d'appeler `navigateToSession` — un seul point d'adaptation.)
- `railWidth` token (248) vs largeur réelle du `Tab.Navigator` (108) : **réconcilier** (le bureau OS n'utilise pas le rail ; documenter/aligner le token pour éviter la confusion).

## 5. Refonte native des écrans

**Pattern unique**, appliqué à tous : `XScreen(route)` → extraire `XContent({ ...params, windowApi })` (modèle déjà éprouvé par `ProjectDetailContent`). À l'intérieur, la navigation devient une **grille de tuiles/icônes** ; les sous-fonctions ouvrent de **nouvelles fenêtres** via `windowApi.openApp`.

Exemples de transformation :

- **ProjectDetail** : tabs horizontaux (overview/tasks/planning/context/locks/orchestration/assistant) → **grille de tuiles** ; chaque tuile `openApp({appId:"tasks", instanceKey: projectId, params:{projectId}})` → fenêtre `Tasks — <Projet>`.
- **Settings** : liste → grille d'icônes (Skills, MCP, Commands, Credentials, About) ouvrant des fenêtres.
- **Machines** : grille de machines ; tap → fenêtre `Machine — <nom>`.
- **Session** : `SessionContent({ sessionId, windowApi })` ; `navigation.setOptions/goBack` → `windowApi.setTitle/close`.

### 5.1 Inventaire couplage `route.params` (du relevé d'intégration)

**Sans couplage (wrappables immédiatement)** : `MachinesListScreen`, `ProjectsListScreen`, `SettingsScreen`, `AboutScreen`, `CredentialsScreen`, `NewProjectScreen`, et `ProjectDetailContent` (déjà découplé).

**À découpler `XContent` (extraction triviale, 1 param)** : `ContextScreen`, `LocksScreen`, `GitScreen`, `AuditScreen`, `RunnerHealthScreen`, `TasksScreen`, `OrchestrationScreen`, `PlanningScreen` (projectId+segment), `PlanningChatScreen`, `DecomposeEpicScreen`, `SkillsScreen`, `MCPServersScreen`, `CommandsScreen`, `SessionsListScreen`, `NewSessionScreen`, `ClaudeSessionsScreen` (machineId).

**Couplage fort (refactor soigné)** : `SessionScreen` (`sessionId` + `setOptions` + `goBack`), `MachineDetailScreen` (`machineId`), `SprintDetailScreen` (`sprintId`), `SkillDetailScreen` (`machineId`+`skillPath`), `MCPToolsScreen` (`machineId`+`serverName`).

## 6. Catalogue d'apps (`appRegistry`)

| Catégorie | Apps |
|---|---|
| **infra** | Machines, Machine (détail), Sessions (liste), Session (terminal), New Session |
| **project** | Projects, Project (détail), Tasks, Planning (Epics/Sprints), Sprint (détail), Context, Locks, Orchestration, Git, Audit, Runner Health, Planning Chat, Decompose Epic, New Project |
| **system** | Settings, Credentials, Skills, Skill (détail), MCP Servers, MCP Tools, Commands, About, **Launcher** |

`singleInstance: true` pour Settings/Launcher/Machines/Projects ; multi-instances (par `instanceKey`) pour Session/Project/Task/Machine détail/etc.

## 7. WM Ultra — comportements

- **Drag** : header (UI thread, gesture-handler + reanimated).
- **Resize** : 8 poignées (4 coins + 4 bords), min-size garde-fou.
- **Min/Max/Close** : traffic-lights fonctionnels ; restore depuis TopBar (fenêtres minimisées) ou dock.
- **Focus/z-order** : tap → `focusWindow` (incrémente `zIndex`).
- **Snapping** : relâché près d'un bord/coin → ½ ou ¼ écran ; haut → maximize.
- **Tiling** : action `tileAll()` (grille auto), `cascade()`.
- **Multi-instances** : N fenêtres d'une même app (par `instanceKey`).
- **Workspaces** : N bureaux virtuels, commutation via TopBar pips, déplacement de fenêtre entre bureaux.

## 8. Tests, a11y, carto

- **Unit (jest.unit, node)** : `windowGeometry` (clamp/snap/tile/cascade), réducteurs `windowManagerStore` (open/focus/minimize-refocus/close-refocus/maximize-restore/snap/workspaces), `selectOrderedWindows`. Cible : couverture des réducteurs purs.
- **A11y** : `TopBar` `role=menubar`, `FloatingWindow` `role=window` + label, boutons min/max/close labellés, focus au tap, dock `role=toolbar`. Maintenir la couverture « 100 % boutons icon-only labellés ».
- **Carto** : mettre à jour `~/.claude/projects/-home-rony-Projets-claudenest/memory/frontend_mobile.md` (section « Claude OS bureau ») dans la même livraison.

## 9. Chantiers (dev structuré → merge unique)

1. **Fondations** : `windowManagerStore` + `windowGeometry` + types + tests unit.
2. **Seam** : `appRegistry` + `windowApi` (bus) + découplage `XContent` des ~16 écrans.
3. **Chrome** : `FloatingWindow` (drag/resize), `WindowFrame` boutons réels, `TopBar`, `Dock` lanceur, `Launcher`.
4. **Hôte** : `TabletDesktop` + intégration `MainNavigator` + adaptation `navigateToSession`.
5. **WM Pro** : snapping, tiling, cascade, maximize, multi-instances.
6. **Workspaces** (Ultra).
7. **Refonte native** panneau-par-panneau (grilles d'icônes) — la grande vague.
8. **Finition** : tests, a11y, perf, MAJ carto.

Tout est développé sur `feat/claude-os-tablet` et mergé en un bloc cohérent.

## 10. Risques & garde-fous

| Risque | Mitigation |
|---|---|
| 4 instances Claude concurrentes sur le working tree | Branche/worktree dédié ; commits en **paths explicites** (jamais `git add -A`) ; `/usr/bin/git` direct |
| Casser téléphone / tablette étroite | Gate strict `isWide` ; aucune modif des chemins `< 1024` |
| Perf (N fenêtres) | Sélecteurs Zustand granulaires ; drag/resize sur UI thread (reanimated) ; éviter re-renders globaux |
| `route.params` fort (SessionScreen) | `windowApi.setTitle/close` ; tester le terminal en fenêtre (WebView + socket) |
| Token `railWidth` 248 vs 108 | Réconcilier/documenter |
| Ampleur (refonte 20+ écrans) | Orchestration en agents parallèles par écran/chantier, 1 agent = 1 responsabilité |

## 11. Hors-scope (YAGNI)

- Pas de redimensionnement de la **barre/dock** eux-mêmes (seules les fenêtres sont resizable).
- Pas de persistance disque de la disposition des fenêtres au v1 (état en mémoire ; persistance possible plus tard via Zustand persist).
- Pas de drag-and-drop **inter-fenêtres** de contenu.

## 12. Fichiers (création / modification)

**Créer** : `stores/windowManagerStore.ts` (+ test) · `utils/windowGeometry.ts` (+ test) · `os/appRegistry.ts` · `os/windowApi.ts` · `os/FloatingWindow.tsx` · `os/TopBar.tsx` · `os/Launcher.tsx` · `os/WorkspaceSwitcher.tsx` · `os/TabletDesktop.tsx` · les `XContent` extraits + panneaux natifs.

**Modifier** : `components/os/WindowFrame.tsx` (boutons réels) · `components/os/Dock.tsx` (mode lanceur) · `navigation/MainNavigator.tsx` (branche `isWide`) · `navigation/navigationRef.ts` (`navigateToSession` → `openApp` en `isWide`) · `App.tsx` (`ClaudeOSDock` conditionné) · `theme/layout.ts` (réconcilier `railWidth`) · `components/os/index.ts` (barrel).
