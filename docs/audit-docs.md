# Audit documentation — ClaudeNest

_Date : 2026-04-12_

## Inventaire

| Fichier | Type | Audience | Dernière MAJ | État |
|---|---|---|---|---|
| `README.md` | Reference | Dev/utilisateur | 2026-04-12 | A jour |
| `CLAUDE.md` | Reference | Agents IA | 2026-04-12 | A jour |
| `CHANGELOG.md` | Reference | Dev | 2026-02-08 | **Obsolète** — +2 mois de commits non documentés |
| `docs/API.md` | Reference | Dev | 2026-02-14 | **Partiel** — epics, sprints, planning, runner absents |
| `docs/ARCHITECTURE.md` | Explanation | Dev | 2026-02-14 | **Partiel** — project management layer non documenté |
| `docs/CONTRIBUTING.md` | How-to | Dev | 2026-02-03 | A jour |
| `docs/DEPLOYMENT-BAREMETAL.md` | How-to | Ops | 2026-02-02 | A jour |
| `docs/DEPLOYMENT-DOCKER.md` | How-to | Ops | 2026-02-02 | A jour |
| `docs/AI-MODELS.md` | Reference | Dev | 2026-02-14 | A jour |
| `packages/agent/README.md` | Tutorial | Dev | 2026-02-14 | A jour |
| `packages/server/README.md` | Tutorial | Dev | 2026-02-02 | A jour |
| `packages/mobile/README.md` | Tutorial | Dev | 2026-02-02 | **Partiel** — EpicCard, SprintCard, animations non mentionnées |
| `public/docs/getting-started.md` | Tutorial | Utilisateur | N/A | A jour |
| `public/docs/sdk-reference.md` | Reference | Dev | N/A | **Partiel** |
| `public/docs/changelog.md` | Reference | Utilisateur | N/A | **Obsolète** |

## Gaps identifiés (delta git avril 2026)

| Gap | Commit source | Priorité |
|---|---|---|
| `CHANGELOG.md` — aucune entrée depuis 2026-02-08 | Tous les commits récents | Haute |
| `docs/API.md` — 20 endpoints manquants (epics, sprints, planning, runner) | `c7afade` | Haute |
| `docs/index.md` — inexistant (pas de point d'entrée docs) | — | Moyenne |
| Mobile — EpicCard, SprintCard, animations.ts non documentés | `c7afade` | Basse |
| `public/docs/changelog.md` — désynchronisé du CHANGELOG racine | `c7afade` | Moyenne |
