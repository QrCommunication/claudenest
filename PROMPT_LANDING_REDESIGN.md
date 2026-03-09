# PROMPT COMPLET : Refonte Landing Page ClaudeNest

> **Ce prompt est autonome.** Colle-le tel quel dans une nouvelle conversation Claude Code.
> Il contient tout le contexte necessaire pour produire une landing page production-ready.

---

## MISSION

Refondre integralement la landing page de ClaudeNest (`packages/server/resources/js/pages/Landing.vue`) en une page de conversion premium qui :
1. Traduit chaque feature technique en benefice utilisateur concret
2. Suit un framework de copywriting PAS+AIDA hybride
3. Respecte scrupuleusement la brand identity existante
4. Atteint un score Lighthouse 90+ et une conformite WCAG 2.1 AA
5. Est entierement internationalisee (i18n fr/en via vue-i18n)

---

## ROLE

Tu es un senior frontend developer + conversion copywriter + design systems specialist. Tu as 10+ ans d'experience en landing pages SaaS haute conversion. Tu connais les patterns de Vercel, Linear, Raycast et Stripe pour les developer tools.

---

## CONTEXTE PROJET

### Stack Technique
- **Framework** : Vue 3 (Composition API, `<script setup lang="ts">`)
- **Build** : Vite 7.3 + laravel-vite-plugin 2.1
- **CSS** : Tailwind CSS avec config custom (voir palette ci-dessous)
- **i18n** : vue-i18n (fichiers `resources/js/locales/en.json` et `fr.json`)
- **Icons** : SVG inline (pas de librairie d'icons - lucide-vue-next disponible dans package.json)
- **Routing** : Vue Router (`router/index.ts`)
- **Fonts** : Inter (UI) + JetBrains Mono (code) via Bunny Fonts CDN

### Structure fichiers pertinents
```
packages/server/resources/
├── js/
│   ├── pages/Landing.vue          ← FICHIER A REFONDRE
│   ├── components/common/
│   │   ├── Logo.vue               ← Composant logo existant
│   │   ├── ThemeToggle.vue        ← Toggle theme existant
│   │   ├── LanguageSwitcher.vue   ← Switcher langue existant
│   │   └── Button.vue             ← Composant bouton existant
│   ├── locales/en.json
│   └── locales/fr.json
├── css/app.css                    ← Variables CSS + Tailwind
└── views/app.blade.php
```

### Palette de Couleurs (IMMUABLE - NE PAS MODIFIER)
```
Brand:
  purple:  #a855f7  (primary, CTAs, boutons)
  indigo:  #6366f1  (gradients, accents, secondaire)
  cyan:    #22d3ee  (highlights, liens, terminal cursor)

Backgrounds:
  dark-1:  #0f0f1a  (fond le plus profond)
  dark-2:  #1a1b26  (fond principal)
  dark-3:  #24283b  (cartes, surfaces)
  dark-4:  #3b4261  (bordures, separateurs)

Semantic:
  success: #22c55e
  error:   #ef4444
  warning: #fbbf24

Gradients:
  primary: linear-gradient(135deg, #a855f7, #6366f1)
  accent:  linear-gradient(90deg, #22d3ee, #a855f7)
  text:    linear-gradient(135deg, #a855f7, #22d3ee) → background-clip: text
```

### CSS Custom Properties existantes (app.css)
```css
:root {
  --color-primary: #a855f7;
  --color-indigo: #6366f1;
  --color-cyan: #22d3ee;
  --color-bg: #0f0f1a;
  --color-bg-card: #1a1b26;
  --color-bg-hover: #24283b;
  --color-border: #3b4261;
  --color-text: #ffffff;
  --color-text-secondary: #a9b1d6;
  --color-text-muted: #888888;
}
```

### Tailwind Config (tailwind.config.js)
Les couleurs brand sont configurees : `brand-purple`, `brand-indigo`, `brand-cyan`, `dark-1` a `dark-4`.
Polices : `font-sans` = Inter, `font-mono` = JetBrains Mono.

---

## IDENTITE DE MARQUE

### Archetype
- **Primaire (60-70%)** : Le Magicien → transformation, vision, rendre le complexe simple
- **Secondaire (30-40%)** : Le Sage → connaissance, expertise, comprehension profonde

### Voix
- Professionnelle mais accessible
- Technique mais comprehensible
- Confiante sans arrogance
- Orientee solution

### Tagline recommandee
- **Headline** (Magicien) : "Your AI agents, orchestrated."
- **Subheadline** (Sage) : "Remote multi-agent coordination for Claude Code with shared context, file locking, and real-time control."

### Histoire de marque
"We saw chaos, and built order." — Ne des frustrations reelles d'un developpeur gerant 3 instances Claude sur le meme codebase : conflits de merge, contexte perdu, zero visibilite.

### Nom "Nest"
Metaphore organique deliberee dans un espace domine par les metaphores mecaniques (orchestrators, swarms, pipelines). Un nid = foyer, protection, connexion, intention.

---

## POSITIONNEMENT CONCURRENTIEL

### 5 Differenciateurs uniques (aucun concurrent ne les combine tous)
1. **pgvector RAG Context** — Les agents partagent un cerveau (embeddings 384D, recherche semantique)
2. **File Locking** — Prevention des conflits avant qu'ils n'arrivent (expiration, force-release, bulk)
3. **Web Dashboard** — Vue temps reel de tous les agents depuis un navigateur
4. **Mobile App Native** — Controle depuis iOS/Android (React Native)
5. **Claude Code Specifique** — Optimise pour Claude, pas generique

### Matrice competitive (pour section Compare)
| Feature | ClaudeNest | Claude-Flow | CrewAI | Remote-Code |
|---------|-----------|-------------|--------|-------------|
| Multi-Agent | Yes | Yes (60+) | Yes | Yes |
| Web Dashboard | **Yes** | No | Yes | Yes |
| Mobile App | **Yes** | No | No | Yes |
| pgvector RAG | **Yes** | Partial | No | No |
| File Locking | **Yes** | No | No | Yes |
| Claude Specific | **Yes** | Yes | No | No |
| WebSocket Real-time | **Yes** | Partial | No | Yes |
| MCP Protocol | **Yes** | Yes | No | No |
| Open Source | **Yes** | Yes | Partial | No |

---

## AUDIENCE CIBLE

### Primaire : Senior Developers & Tech Leads
- 28-45 ans, 5+ ans d'experience
- Utilisent deja Claude Code
- Frustres par : contexte perdu entre sessions, conflits fichiers, zero visibilite multi-agent
- Decouvrent les outils via : GitHub trending, Hacker News, Twitter/X dev, Reddit

### Secondaire : Equipes AI-First
- Teams de 3-15 devs avec forte adoption IA
- Besoin : gouvernance agents IA, audit trail, partage contexte equipe

### Douleurs a adresser (par ordre de severite)
1. **CRITIQUE** : Plusieurs instances Claude ecrasent mutuellement leurs fichiers
2. **HAUTE** : Le contexte est perdu entre les sessions Claude
3. **HAUTE** : Aucun moyen de voir ce que font plusieurs agents simultanement
4. **HAUTE** : Coordination manuelle des taches entre agents
5. **MOYENNE** : Pas d'acces mobile aux agents en cours d'execution

---

## FRAMEWORK COPYWRITING

### Structure PAS + AIDA hybride

**Chaque section suit cette formule** :
- Feature → Function → **Benefit** (toujours arriver au "So you can...")
- Jamais de jargon sans explication
- Chiffres specifiques > affirmations vagues

### Traduction Features → Benefits

| Feature technique | Benefit utilisateur |
|---|---|
| pgvector 384D embeddings + cosine similarity | "Vos agents comprennent le travail des autres — pas de briefing manuel" |
| File locking avec expiration | "Zero conflit de merge. Jamais." |
| WebSocket via Laravel Reverb | "Chaque frappe clavier, en temps reel, ou que vous soyez" |
| Atomic task claiming | "Les agents se repartissent le travail tout seuls" |
| React Native mobile app | "Supervisez vos agents depuis votre canape" |
| MCP Protocol support | "Connectez n'importe quel outil. L'ecosysteme est votre limite" |
| Self-hosted + open source | "Votre code reste chez vous. Inspectez chaque ligne." |

---

## SECTIONS A IMPLEMENTER (dans cet ordre)

### 1. NAVIGATION (sticky)
- Logo (composant `Logo.vue` existant)
- Liens : Features, How It Works, Compare, Pricing, Docs
- Boutons : ThemeToggle, LanguageSwitcher, Login, **Get Started Free** (CTA primary)
- Mobile : hamburger menu avec transitions
- Style : `bg-dark-1/80 backdrop-blur-xl border-b border-dark-4/50`

### 2. HERO SECTION
**Objectif** : Capturer l'attention en 3 secondes. Magician archetype.

- **Badge** : "Open Source · Self-Hosted · Free" avec indicateur vert pulse
- **Headline H1** (3 options, implementer la recommandee) :
  - Option A : "Your AI Agents, Orchestrated." ← RECOMMANDEE
  - Option B : "From Chaos to Control in One Command"
  - Option C : "The Command Center Your Claude Agents Deserve"
- **Subheadline** : "Run multiple Claude Code instances on the same project with shared context, file locking, and real-time control — from any device."
- **CTA Primary** : "Get Started Free" → `/register`
- **CTA Secondary** : "Read the Docs" → `/docs`
- **Micro-copy** : "No credit card. Self-hosted. MIT License."
- **Social Proof** : "Trusted by developers building with Claude Code worldwide"
- **Stats animees** (IntersectionObserver) :
  - "5+" Concurrent Agents
  - "384D" Vector Embeddings
  - "<50ms" WebSocket Latency
  - "100%" Open Source
- **Terminal Hero** (illustration interactive) : garder le terminal anime existant mais ameliorer le contenu pour montrer un workflow multi-agent
- **Background** : Orbs animes (purple, indigo, cyan) + grille pattern subtile
- **prefers-reduced-motion** : Desactiver toutes les animations

### 3. PROBLEM SECTION (nouveau)
**Objectif** : Empathie. Le visiteur doit penser "oui, exactement ca".

- **Headline** : "Sound familiar?"
- 3 pain points en cards avec icones :
  1. "Three agents, one codebase, zero coordination" — "You launch multiple Claude instances on the same project. They edit the same files. Merge conflicts everywhere. Hours of AI work, lost."
  2. "Context that vanishes between sessions" — "Every new Claude session starts from scratch. You paste the same instructions again and again. Your agents forget everything."
  3. "Flying blind with multiple agents" — "Which agent is doing what? Who changed that file? Is that task already done? You have no idea until something breaks."
- **Transition** : "There's a better way." (gradient text)

### 4. SOLUTION SECTION (nouveau)
**Objectif** : Presenter ClaudeNest comme la reponse. Magician archetype.

- **Headline** : "Your agents deserve a home."
- **Subheadline** : "ClaudeNest gives your Claude Code instances shared understanding, conflict prevention, and a unified command center."
- 3 pilliers en layout horizontal avec icones brand :
  1. **Shared Intelligence** (purple) : "pgvector RAG means your agents build on each other's knowledge — not start from scratch."
  2. **Conflict Prevention** (indigo) : "File locking + atomic task claiming = zero merge conflicts, zero duplicated work."
  3. **Total Visibility** (cyan) : "See every agent, every task, every keystroke — from your browser or your phone."

### 5. FEATURES SECTION (refonte)
**Objectif** : Detail des 6 features cles, benefit-first.

- **Section badge** : "Capabilities"
- **Headline** : "Everything you need to" + gradient("orchestrate at scale")
- **Subheadline** : "From a single dashboard to a full multi-agent command center."
- 6 feature cards (grid 3x2) avec :
  - Icone dans cercle colore
  - Titre benefit-first
  - Description 2-3 phrases (function + benefit)
  - Hover : border-color change + translateY(-4px)

| Feature | Icon Color | Titre | Description |
|---------|-----------|-------|-------------|
| Remote Access | purple | "Control from anywhere" | "Access your Claude Code instances from any browser, any device. WebSocket relay means every keystroke arrives in real-time, with <50ms latency." |
| Multi-Agent | cyan | "Agents that collaborate" | "Run 5+ Claude instances on the same project. Atomic task claiming prevents duplicated work. Each agent knows what the others are doing." |
| Context RAG | indigo | "Shared intelligence" | "384-dimensional vector embeddings via pgvector give your agents semantic understanding of the entire project. They search by meaning, not keywords." |
| Real-time | green | "Every keystroke, live" | "Laravel Reverb WebSocket channels relay terminal output in real-time. Watch your agents work from anywhere — even your phone." |
| File Locking | yellow | "Zero merge conflicts" | "Automatic file locking with expiration, force-release, and bulk operations. Two agents can never edit the same file simultaneously." |
| MCP Support | pink | "Infinite extensibility" | "Model Context Protocol support means your agents can use any MCP tool. Discovery is automatic, execution is seamless." |

### 6. HOW IT WORKS (refonte)
**Objectif** : Reduire la friction perçue. Sage archetype.

- **Section badge** : "Getting Started"
- **Headline** : "Up and running in" + gradient("three steps")
- **Subheadline** : "From installation to full multi-agent orchestration in minutes, not hours."
- 3 etapes avec ligne de connexion gradient et numeros badges :
  1. **Install the Agent** (purple) — `npm i -g @claudenest/agent` (code block)
  2. **Start a Session** (indigo) — "Launch Claude Code remotely from any device"
  3. **Orchestrate** (cyan) — "Coordinate multiple agents with shared context"
- Chaque etape a un mini-visual (code block, status badge, agent avatars)

### 7. COMPARISON TABLE (refonte)
**Objectif** : Prouver la superiorite. Donnees factuelles.

- **Section badge** : "Why ClaudeNest"
- **Headline** : "See how we" + gradient("compare")
- **Subheadline** : "The most complete orchestration platform built specifically for Claude Code."
- Table desktop : ClaudeNest (colonne highlightee) vs Claude-Flow vs CrewAI vs Remote-Code
- Cards mobile : chaque feature comme card avec badges par outil
- 9 features de comparaison (voir matrice ci-dessus)
- ClaudeNest a un checkmark vert sur les 9 lignes

### 8. TESTIMONIALS (refonte)
**Objectif** : Social proof. Credibilite.

- **Section badge** : "What Developers Say"
- **Headline** : "Loved by" + gradient("developers")
- 3 testimonials en cards avec :
  - Quote mark SVG (brand-purple/30)
  - Citation
  - Avatar (initiales colorees)
  - Nom + role
- Garder les temoignages existants mais les ameliorer pour etre plus specifiques sur les resultats

### 9. PRICING SECTION (nouveau)
**Objectif** : Clarifier l'offre. Lever l'objection du cout.

- **Section badge** : "Pricing"
- **Headline** : "Free forever. Premium when you scale."
- **Subheadline** : "ClaudeNest is open source and self-hosted. No usage fees, no per-seat pricing, no surprises."
- 3 tiers en cards :

| | Community (Free) | Pro ($29/mo) | Enterprise (Custom) |
|--|---|---|---|
| **For** | Solo developers | Teams & power users | Organizations |
| **Agents** | Up to 3 | Up to 20 | Unlimited |
| **RAG Context** | 1 project | Unlimited projects | Unlimited + priority |
| **File Locks** | Basic | Advanced (bulk, force) | Advanced + audit trail |
| **Support** | Community (GitHub) | Priority email | Dedicated + SLA |
| **SSO/SAML** | -- | -- | Yes |
| **CTA** | "Get Started" | "Start Free Trial" ★ | "Contact Sales" |

- La card Pro a un badge "Most Popular" et un border gradient
- Mention : "Self-hosted is always free. Managed hosting plans available."

### 10. FAQ SECTION (nouveau)
**Objectif** : Lever les dernieres objections. Sage archetype.

- **Headline** : "Frequently asked" + gradient("questions")
- 8 questions en accordion (Disclosure pattern) :

1. **"Is ClaudeNest really free?"** — "Yes. ClaudeNest is MIT-licensed and self-hosted. The Community tier is free forever. Pro and Enterprise tiers are for managed hosting and priority support."
2. **"Does it work with any LLM or just Claude?"** — "ClaudeNest is purpose-built for Claude Code by Anthropic. This specialization lets us optimize every interaction, from PTY management to context injection. We don't dilute focus by supporting every model."
3. **"How does the RAG context system work?"** — "When an agent learns something, we generate a 384-dimensional vector embedding using BGE-small-en and store it in PostgreSQL with pgvector. Other agents search by semantic similarity — meaning, not keywords. The result: agents build on each other's understanding."
4. **"Can multiple agents really work on the same files?"** — "Not at the same time — that's the point. Our file locking system prevents two agents from editing the same file simultaneously. Locks have expiration, force-release, and bulk operations. Zero merge conflicts."
5. **"What infrastructure do I need?"** — "A Linux server with PHP 8.3+, PostgreSQL 16 (with pgvector), Redis, and Node.js 20. A standard $20/month VPS handles most setups. Docker Compose makes installation one command."
6. **"Is my code sent to your servers?"** — "Never. ClaudeNest is self-hosted. Your code, your agents, your infrastructure. We never see your source code or your prompts."
7. **"How does it compare to Claude-Flow?"** — "Claude-Flow focuses on swarm intelligence with 60+ agents but has no web dashboard and no mobile app. ClaudeNest provides a complete platform: web dashboard, mobile app, pgvector RAG, and file locking — all purpose-built for Claude Code."
8. **"Can I contribute?"** — "Absolutely. ClaudeNest is open source under MIT license. Check our CONTRIBUTING.md for setup instructions, code standards, and our ADR process."

### 11. OPEN SOURCE SECTION (refonte)
**Objectif** : Rassurer. Transparence.

- Star badge dore
- **Headline** : "Built in the open"
- **Description** : "Inspect every line, contribute features, and self-host on your own infrastructure. No vendor lock-in, ever."
- CTA : "Star on GitHub" → lien GitHub

### 12. FINAL CTA SECTION
**Objectif** : Derniere poussee a la conversion. Magician archetype.

- Background : gradient subtil purple/indigo/cyan + blur orb
- **Headline** : "Ready to orchestrate your" + gradient("AI agents?")
- **Subheadline** : "Deploy ClaudeNest in minutes. Control Claude Code from anywhere. Coordinate teams of AI agents on a single project."
- **CTA Primary** : "Get Started Free" (gros, scale hover)
- **CTA Secondary** : "Read the Docs"

### 13. FOOTER
- 4 colonnes : Brand + description, Product links, Resources links, Legal links
- Social links : GitHub, X/Twitter
- Copyright avec annee dynamique
- "Built with" : Laravel, Vue, PostgreSQL (mini icons)

---

## CONTRAINTES TECHNIQUES

### Code Quality
- TypeScript strict, zero `any`
- Tous les textes via `$t('key')` (vue-i18n) — pas de texte hardcode
- Composants existants reutilises (`Logo.vue`, `ThemeToggle.vue`, `LanguageSwitcher.vue`, `Button.vue`)
- `<script setup lang="ts">` obligatoire
- Types/interfaces pour toutes les structures de donnees (stats, features, testimonials, pricing, FAQ, comparison)

### Performance
- `prefers-reduced-motion` : desactiver TOUTES les animations
- IntersectionObserver pour les animations au scroll (stats counter)
- Pas de librairie d'animation externe (CSS transitions + keyframes natifs)
- Images : aucune (tout est SVG inline ou CSS)
- Lazy rendering pour les sections below-the-fold si pertinent

### Accessibilite (WCAG 2.1 AA)
- Contraste 4.5:1 minimum pour tout texte
- Touch targets 44x44px minimum
- Heading hierarchy : h1 → h2 → h3 (un seul h1)
- `aria-label` sur tous les boutons icone-only
- `aria-hidden="true"` sur les SVG decoratifs
- Focus visible sur tous les elements interactifs
- Smooth scroll (`scroll-behavior: smooth` dans CSS)
- Skip to content link (optionnel)

### Responsive
- Mobile-first (375px → 768px → 1024px → 1440px)
- Navigation : hamburger menu sur mobile avec transition
- Comparison table : cards sur mobile, table sur desktop
- Pricing : stack vertical sur mobile, horizontal sur desktop
- Stats : 2x2 grid sur mobile, row sur desktop

### Animations
- Hero orbs : `will-change: transform`, 8-12s ease-in-out infinite
- Terminal cursor : blink 1s step-end infinite
- Stats counter : ease-out cubic, 1.5s, triggered par IntersectionObserver
- Hover cards : `translateY(-4px)`, `transition-all duration-300`
- Mobile menu : `transition ease-out duration-200`, opacity + translateY

### CSS
- Utiliser les classes Tailwind existantes (`brand-purple`, `dark-1`, etc.)
- Scoped styles pour les animations complexes (orbs, cursor, grid pattern)
- `.gradient-text` defini dans `app.css` (reutiliser, ne pas redefinir)
- `.glass` class existante : `bg-dark-2/80 backdrop-blur-xl`

---

## FICHIERS A PRODUIRE

### 1. `packages/server/resources/js/pages/Landing.vue`
Le fichier principal — tout dans un seul composant SFC (pas de decoupe en sous-composants pour cette V1).

### 2. Cles i18n a ajouter dans `en.json` et `fr.json`
Toutes les nouvelles cles sous `landing.*` :
- `landing.problem.*`
- `landing.solution.*`
- `landing.pricing.*`
- `landing.faq.*`
- `landing.how_it_works.*` (remplacer les textes hardcodes actuels)
- `landing.comparison.*`
- `landing.testimonials.*`

### 3. NE PAS modifier
- `app.css` (les classes existent deja)
- `tailwind.config.js` (la palette est correcte)
- `router/index.ts` (la route `/` pointe deja vers Landing.vue)
- Aucun autre fichier existant

---

## CHECKLIST PRE-LIVRAISON

### Visual Quality
- [ ] Aucun emoji utilise comme icone (SVG uniquement)
- [ ] Toutes les icones coherentes (meme set, meme stroke-width)
- [ ] Hover states ne causent pas de layout shift
- [ ] Gradient text lisible sur fond sombre
- [ ] Terminal hero anime et credible

### Interaction
- [ ] Tous les elements cliquables ont `cursor-pointer`
- [ ] Transitions smooth (150-300ms)
- [ ] Focus states visibles pour navigation clavier
- [ ] Mobile menu fonctionne correctement

### Responsive
- [ ] Teste a 375px (iPhone SE)
- [ ] Teste a 768px (iPad)
- [ ] Teste a 1024px (laptop)
- [ ] Teste a 1440px (desktop)
- [ ] Pas de scroll horizontal sur aucun breakpoint

### Accessibilite
- [ ] Un seul h1 sur la page
- [ ] Hierarchy h1 → h2 → h3 respectee
- [ ] Alt text sur images (aucune image, mais verifier SVG)
- [ ] `aria-hidden="true"` sur SVG decoratifs
- [ ] `aria-label` sur boutons icone-only
- [ ] Contraste 4.5:1 verifie

### i18n
- [ ] Zero texte hardcode dans le template
- [ ] Toutes les cles presentes dans en.json ET fr.json
- [ ] Cles organisees sous `landing.*`

### Performance
- [ ] `prefers-reduced-motion` respecte
- [ ] Pas de dependencies externes ajoutees
- [ ] Build Vite sans erreur (`npm run build` dans packages/server)

---

## EXEMPLE DE STRUCTURE DU TEMPLATE

```vue
<template>
  <div class="min-h-screen bg-dark-1">
    <!-- 1. Navigation -->
    <nav>...</nav>

    <main>
      <!-- 2. Hero -->
      <section class="pt-32 pb-20">...</section>

      <!-- 3. Problem -->
      <section class="py-24 bg-dark-2/50">...</section>

      <!-- 4. Solution -->
      <section class="py-24">...</section>

      <!-- 5. Features -->
      <section id="features" class="py-24 bg-dark-2/50">...</section>

      <!-- 6. How It Works -->
      <section id="how-it-works" class="py-24">...</section>

      <!-- 7. Comparison -->
      <section id="comparison" class="py-24 bg-dark-2/50">...</section>

      <!-- 8. Testimonials -->
      <section class="py-24">...</section>

      <!-- 9. Pricing -->
      <section id="pricing" class="py-24 bg-dark-2/50">...</section>

      <!-- 10. FAQ -->
      <section class="py-24">...</section>

      <!-- 11. Open Source -->
      <section class="py-24 bg-dark-2/50">...</section>

      <!-- 12. Final CTA -->
      <section class="py-24">...</section>
    </main>

    <!-- 13. Footer -->
    <footer>...</footer>
  </div>
</template>
```

---

## INSTRUCTIONS FINALES

1. **Lis** le fichier actuel `packages/server/resources/js/pages/Landing.vue` avant de commencer
2. **Lis** les fichiers i18n existants pour connaitre les cles deja definies
3. **Produis** le Landing.vue complet en un seul fichier
4. **Produis** les cles i18n a ajouter (format JSON, pret a merger)
5. **Verifie** que le build passe : `cd packages/server && npm run build`
6. **N'utilise PAS** de composants externes ou de librairies supplementaires
7. **Conserve** les composants existants (Logo, ThemeToggle, LanguageSwitcher)
8. **Chaque section** doit etre autonome et facilement modifiable
9. **Le terminal hero** doit montrer un workflow multi-agent convaincant
10. **Les FAQ** doivent repondre aux vraies objections des developpeurs

---

*Ce prompt a ete genere le 2026-02-12 a partir de : brand-analysis-claudenest-2026-02-05.md, ARCHITECTURE-VISUELLE.md, ORCHESTRATION-CLAUDENEST.md, CLAUDE.md, Landing.vue actuel, app.css, tailwind.config.js, et les skills : saas-implement-landing-page, saas-create-landing-copywritting, saas-create-headline, saas-define-pricing, ui-ux-pro-max, micro-saas-launcher, marketing-ideas.*
