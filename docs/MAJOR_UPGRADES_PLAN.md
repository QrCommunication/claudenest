# Plan de mise à jour vers les dernières majeures

> Établi le 2026-06-08. Inventaire via `composer outdated --direct --major-only`
> et `npm outdated` sur les 4 packages. **Aucune de ces mises à jour n'est
> exécutée ici** — ce document est le plan d'exécution.

## Principes

- **1 majeure = 1 PR dédiée** (jamais grouper deux frameworks majeurs).
- Mettre à jour les **deps de base avant les frameworks**, et les **frameworks
  avant les apps**.
- **Validation obligatoire** à chaque PR : `composer audit` / `npm audit`,
  type-check, suite de tests (101 PHPUnit + Vitest), build, smoke test prod-like.
- **Jamais en hotfix.** Lire le `UPGRADE.md`/changelog de chaque paquet.
- Déployer une majeure backend ≥ 24h après merge, hors fenêtre critique.

## État actuel (versions installées)

| Écosystème | Clé | Actuel | Cible majeure |
|---|---|---|---|
| PHP backend | laravel/framework | 12.61.1 | **13.14** |
| PHP backend | darkaonline/l5-swagger | 8.6.5 | **11.0** (swagger-php 4→6) |
| PHP backend | laravel/tinker | 2.11 | 3.0 |
| PHP backend | phpunit/phpunit | 11.5 | 12.5 |
| PHP backend | predis/predis | 2.4 | 3.5 |
| Frontend (server) | vue-router | 4.6 | **5.1** |
| Frontend (server) | pinia | 2.3 | **3.0** |
| Frontend (server) | typescript | 5.9 | **6.0** |
| Frontend (server) | vue-tsc | 3.2 | 3.3 |
| Frontend (server) | @xterm/xterm + addons | 5.5 | 6.0 |
| Frontend (server) | laravel-echo | 2.3 | (à jour) |
| Frontend (server) | vitest / @vitest/ui | 3.2 | 4.1 |
| Frontend (server) | lucide-vue-next | 0.563 | 1.0 |
| Frontend (server) | jsdom | 26 | 29 |
| Agent (Node) | zod | 3.25 | **4.4** |
| Agent (Node) | commander | 12 | 15 |
| Agent (Node) | eslint | 9.39 | 10.4 |
| Agent (Node) | pino | 9 | 10 |
| Agent (Node) | @types/node | 22 | 25 |
| Agent (Node) | typescript | 5.9 | 6.0 |
| Mobile (Expo) | expo (SDK) | 55 | **56** |
| Mobile (Expo) | @react-native-async-storage | 2.2 | 3.1 |
| Mobile (Expo) | date-fns | 3.6 | 4.4 |
| Mobile (Expo) | eslint | 8.57 | 10.4 |

> ⚠️ **Dette structurelle préalable** : le `package.json` racine duplique le
> frontend Vue de `packages/server` (vite 5 au root vs vite 8 au server). Le
> build de prod n'utilise que `packages/server`. **Avant toute mise à jour
> frontend**, décider : supprimer le frontend racine (recommandé) ou le garder
> synchronisé. Idem pour le `composer.json` racine (reliquat, non déployé).

---

## Phase 0 — Préparation (1 PR)

- [ ] Résoudre la dette structurelle ci-dessus (root vs `packages/server`).
- [ ] S'assurer que la suite tourne en CI sur PostgreSQL (déjà le cas localement
      via `phpunit.xml`) — **porter cette config en CI GitHub Actions**.
- [ ] Geler une baseline : tag git + `composer.lock`/`package-lock.json` propres.

## Phase 1 — Outils de base, faible risque (PR par item)

1. **TypeScript 5.9 → 6.0** (server, agent). Breaking : `lib` plus strict,
   quelques options retirées. Effort: faible. Valid: `tsc --noEmit` partout.
2. **PHPUnit 11 → 12** (server). Les tests sont déjà en `#[Test]` (migré).
   Breaking mineur (data providers static). Effort: faible.
3. **vitest 3 → 4 + @vitest/ui + @vue/test-utils** (server, agent). Effort: faible.
4. **eslint 8/9 → 10** (agent, mobile). Breaking: flat config obligatoire
   (`eslint.config.js`). Effort: moyen (agent est déjà en 9/flat ; mobile en 8).
5. **pino 9 → 10**, **@types/node 22 → 25**, **commander 12 → 15** (agent).
   Effort: faible.
6. **jsdom 26 → 29**, **lucide-vue-next 0.x → 1.0** (server). Effort: faible.

## Phase 2 — Frontend Vue, risque moyen (PR par item)

7. **@xterm/xterm 5 → 6 + addons** (root/server). Breaking: API terminal
   (le composant `XtermTerminal` est central). Effort: moyen. Valid: test
   manuel du terminal live + WebGL addon.
8. **vue-router 4 → 5**. Breaking: history API, types, navigation guards.
   Effort: moyen. Valid: navigation complète du dashboard.
9. **pinia 2 → 3**. Breaking: léger (Vue 3.3+ ok). Effort: faible-moyen.
   Valid: stores (credentials, epics, sprints, sessions).
10. **vite 5 → 8 au root** (server déjà en 8) — uniquement si le frontend racine
    est conservé (cf. Phase 0).

## Phase 3 — Backend PHP, risque moyen-élevé (PR par item)

11. **laravel/tinker 2 → 3**, **predis 2 → 3**. Breaking predis: API connexion.
    Effort: faible-moyen. Valid: cache/queues/broadcasting (Redis).
12. **l5-swagger 8 → 11 (swagger-php 4 → 6)** — ⚠️ **gros morceau**. swagger-php 6
    **abandonne les annotations doc-comment `@OA\`** au profit des **attributs PHP
    `#[OA\...]`**. Implique de migrer **toutes** les annotations OpenAPI
    (`app/OpenApi/OpenApiSpec.php` + tous les controllers `app/Http/Controllers/Api/*`).
    **Bénéfice** : élimine `doctrine/annotations` (abandonné). Effort: élevé.
    Valid: `l5-swagger:generate` produit une spec identique + corriger au passage
    les `$ref` cassés (ex: schéma `Command` manquant dans `CommandsController`).
13. **laravel/framework 12 → 13** — ⚠️ **majeur**. PHP 8.3+ requis (on a 8.4 ✓).
    Lire `UPGRADE.md` Laravel 13. Breaking: deprecations retirées, signatures.
    Effort: élevé. Valid: suite complète + smoke prod-like. Faire **après**
    tinker/predis/swagger pour isoler.

## Phase 4 — Mobile Expo, risque élevé (PR dédiée)

14. **Expo SDK 55 → 56** — bump RN + nouvelle architecture, tout l'écosystème
    `expo-*` suit. Suivre le guide officiel `expo upgrade`. Breaking: natif.
    Effort: élevé. Valid: build EAS iOS + Android + smoke sur device.
15. **@react-native-async-storage 2 → 3**, **date-fns 3 → 4** (API immutable
    breaking), **eslint 8 → 10** — dans la PR Expo ou juste après.

## Phase 5 — Agent, risque ciblé (PR dédiée)

16. **zod 3 → 4** — ⚠️ API breaking (`z.string().email()` → `z.email()`,
    erreurs, `.parse`). Auditer tous les schémas de l'agent. Effort: moyen.
    Valid: tests agent + handshake WebSocket réel.

---

## Ordre recommandé global

```
Phase 0 (préparation)
  → Phase 1 (outils, parallélisable)
  → Phase 2 (Vue) ∥ Phase 5 (zod/agent) ∥ Phase 4 (Expo)   [écosystèmes indépendants]
  → Phase 3.11–3.12 (tinker/predis/swagger)
  → Phase 3.13 (Laravel 13, en dernier)
```

Laravel 13 et Expo 56 sont les deux plus gros risques : les isoler en fin de
leur chaîne, chacun dans sa PR, déployés séparément avec rollback prêt.

## Suivi des versions cibles

À ré-exécuter avant de démarrer chaque phase (les « dernières » bougent) :

```bash
cd packages/server && composer outdated --direct --major-only
for p in . packages/server packages/agent packages/mobile; do (cd "$p" && npm outdated); done
```
