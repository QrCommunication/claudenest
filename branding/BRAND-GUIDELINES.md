# ClaudeNest Brand Guidelines

## 🎨 Brand Identity

ClaudeNest is a modern, open-source tool for remote orchestration of Claude Code instances. The brand reflects **reliability**, **security**, and **innovation**.

---

## 🖼️ Logo

### Concept
The logo combines:
- **Nested brackets `{ }`** representing code and terminal
- **Layered curves** symbolizing a nest/home for your instances
- **Three dots** representing connected agents/instances

### Versions

| Version | Use Case | File |
|---------|----------|------|
| **Dark** | Dark backgrounds, terminals | `logos/claudenest-logo-dark.svg` |
| **Light** | Light backgrounds, documents | `logos/claudenest-logo-light.svg` |
| **Icon Only** | App icons, favicons | `logos/claudenest-icon.svg` |

### Clear Space
Maintain a minimum clear space around the logo equal to the height of the "N" in "Nest".

### Minimum Size
- Full logo: 120px width minimum
- Icon only: 24px minimum

### Don'ts
- ❌ Don't stretch or distort
- ❌ Don't change colors outside the palette
- ❌ Don't add effects (shadows, glows) beyond provided
- ❌ Don't rotate the logo
- ❌ Don't place on busy backgrounds

---

## 🎨 Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Purple** | `#a855f7` | 168, 85, 247 | Primary brand, CTAs |
| **Indigo** | `#6366f1` | 99, 102, 241 | Gradients, accents |
| **Cyan** | `#22d3ee` | 34, 211, 238 | Secondary accent, highlights |

### Background Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Dark 1** | `#0f0f1a` | Deepest background |
| **Dark 2** | `#1a1b26` | Primary dark background |
| **Dark 3** | `#24283b` | Cards, elevated surfaces |
| **Dark 4** | `#3b4261` | Borders, dividers |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **White** | `#ffffff` | Primary text on dark |
| **Gray 1** | `#a9b1d6` | Body text |
| **Gray 2** | `#888888` | Secondary text |
| **Gray 3** | `#64748b` | Muted text |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#22c55e` | Online, success states |
| **Error** | `#ef4444` | Errors, offline |
| **Warning** | `#fbbf24` | Warnings |

### Gradients

```css
/* Primary Gradient */
background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);

/* Accent Gradient */
background: linear-gradient(90deg, #22d3ee 0%, #a855f7 100%);

/* Background Gradient */
background: linear-gradient(135deg, #0f0f1a 0%, #1a1b26 50%, #24283b 100%);
```

---

## 📝 Typography

### Font Stack

```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
```

For monospace (terminal, code):
```css
font-family: 'JetBrains Mono', 'Fira Code', Menlo, Monaco, 'Courier New', monospace;
```

### Scale

| Style | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 48-72px | 800 | Hero titles |
| H2 | 36-48px | 700 | Section titles |
| H3 | 24-28px | 600 | Subsections |
| Body | 16-18px | 400 | Paragraphs |
| Small | 12-14px | 400 | Captions, labels |
| Code | 14px | 400 | Code blocks |

---

## 📐 Spacing

Use an 8px grid system:
- `4px` - tight spacing
- `8px` - small spacing
- `16px` - default spacing
- `24px` - medium spacing
- `32px` - large spacing
- `48px` - section spacing
- `64px` - page sections

---

## 🔘 Components

### Buttons

```css
/* Primary */
background: linear-gradient(135deg, #a855f7, #6366f1);
border-radius: 12px;
padding: 12px 24px;
color: white;
font-weight: 600;

/* Secondary */
background: #3b4261;
border-radius: 12px;
```

### Cards

```css
background: #24283b;
border-radius: 16px;
border: 1px solid #3b4261;
padding: 16px;
```

### Badges/Pills

```css
background: rgba(168, 85, 247, 0.15);
border-radius: 9999px;
padding: 4px 12px;
font-size: 12px;
```

---

## 📱 Assets Usage

### Social Media

| Platform | Asset | Dimensions |
|----------|-------|------------|
| **GitHub** | `github-social-preview.svg` | 1280×640 |
| **Twitter/X** | `twitter-card.svg` | 1200×600 |
| **OpenGraph** | `og-image.svg` | 1200×630 |
| **App Store** | `app-store-feature.svg` | 1024×500 |

### README

Use `banners/readme-banner.svg` at the top of your README:

```markdown
<p align="center">
  <img src="./assets/banner.svg" alt="ClaudeNest" width="100%">
</p>
```

### Favicon

Use `favicons/favicon.svg` - convert to ICO/PNG as needed:
- 16×16, 32×32, 48×48 for `.ico`
- 180×180 for Apple Touch Icon
- 192×192, 512×512 for PWA

---

## ✍️ Voice & Tone

### Personality
- **Professional** but approachable
- **Technical** but accessible
- **Confident** but not arrogant
- **Helpful** and solution-oriented

### Do's
- ✅ Use clear, concise language
- ✅ Be direct about capabilities and limitations
- ✅ Use active voice
- ✅ Include practical examples

### Don'ts
- ❌ Don't use jargon without explanation
- ❌ Don't overpromise
- ❌ Don't be condescending
- ❌ Don't use ALL CAPS (except for emphasis)

### Taglines

**Primary:**
> Remote Claude Code Orchestration

**Alternatives:**
> Control your Claude instances from anywhere
> Your nest for Claude Code instances
> Orchestrate, monitor, control

---

## 📄 License

All brand assets are released under **MIT License** as part of the open-source project.

When using ClaudeNest branding:
- ✅ Use for projects using/integrating ClaudeNest
- ✅ Use in articles/tutorials about ClaudeNest
- ✅ Use in community contributions
- ❌ Don't imply official endorsement
- ❌ Don't modify the logo
- ❌ Don't use for unrelated projects

---

## 📦 File Structure

```
claudenest-branding/
├── logos/
│   ├── claudenest-logo-dark.svg
│   ├── claudenest-logo-light.svg
│   └── claudenest-icon.svg
├── favicons/
│   └── favicon.svg
├── social/
│   ├── og-image.svg
│   ├── twitter-card.svg
│   ├── github-social-preview.svg
│   └── app-store-feature.svg
├── banners/
│   └── readme-banner.svg
├── badges/
│   └── logo-badge.svg
└── BRAND-GUIDELINES.md
```

---

## 🎯 Quick Reference

```
Primary Purple: #a855f7
Primary Indigo: #6366f1
Accent Cyan:    #22d3ee
Background:     #1a1b26
Surface:        #24283b
Border:         #3b4261
Text Primary:   #ffffff
Text Secondary: #888888
```

---

Made with 💜 by the ClaudeNest community
