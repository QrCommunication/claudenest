<template>
  <div class="pricing-page">
    <!-- Navigation -->
    <nav class="pricing-nav">
      <div class="nav-inner">
        <Logo variant="full" size="md" to="/" />
        <router-link to="/" class="back-link">Back to Home</router-link>
      </div>
    </nav>

    <main class="pricing-main">
      <!-- Header -->
      <header class="pricing-header">
        <span class="pricing-badge">PRICING</span>
        <h1 class="pricing-title">
          Simple, <span class="gradient-text">transparent pricing</span>
        </h1>
        <p class="pricing-subtitle">
          Choose the plan that fits your needs. All plans include core features with no hidden fees.
        </p>
      </header>

      <!-- Pricing Cards -->
      <div class="pricing-grid">
        <div
          v-for="plan in plans"
          :key="plan.name"
          :class="['plan-card', { featured: plan.featured }]"
        >
          <span v-if="plan.featured" class="plan-popular">Popular</span>

          <div class="plan-header">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <div class="plan-price">
              <span class="price-value gradient-text">{{ plan.price }}</span>
              <span v-if="plan.period" class="price-period">{{ plan.period }}</span>
            </div>
            <p class="plan-desc">{{ plan.description }}</p>
          </div>

          <ul class="plan-features">
            <li
              v-for="(feat, i) in plan.features"
              :key="i"
              class="feature-item"
            >
              <svg class="feature-check" :class="plan.checkColor" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span :class="{ 'feature-bold': feat.bold }">{{ feat.text }}</span>
            </li>
          </ul>

          <button
            :class="['plan-cta', plan.featured ? 'cta-primary' : 'cta-secondary']"
            @click="plan.action()"
          >
            {{ plan.cta }}
          </button>
        </div>
      </div>

      <!-- FAQ Section -->
      <section class="faq-section">
        <h2 class="faq-title">Frequently Asked Questions</h2>

        <div class="faq-grid">
          <div v-for="(faq, idx) in faqs" :key="idx" class="faq-card">
            <h3 class="faq-question">{{ faq.question }}</h3>
            <p class="faq-answer">{{ faq.answer }}</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import Logo from '@/components/common/Logo.vue';

const router = useRouter();

interface PlanFeature {
  text: string;
  bold?: boolean;
}

interface Plan {
  name: string;
  price: string;
  period?: string;
  description: string;
  featured: boolean;
  checkColor: string;
  cta: string;
  action: () => void;
  features: PlanFeature[];
}

const plans: Plan[] = [
  {
    name: 'Community',
    price: 'Free',
    description: 'Perfect for individuals and open source projects',
    featured: false,
    checkColor: 'check-green',
    cta: 'Get Started',
    action: () => router.push('/register'),
    features: [
      { text: 'Self-hosted deployment' },
      { text: 'Unlimited machines' },
      { text: 'Multi-agent coordination' },
      { text: 'Context RAG with pgvector' },
      { text: 'MIT License' },
      { text: 'Community support' },
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Managed hosting with advanced features',
    featured: true,
    checkColor: 'check-purple',
    cta: 'Start Free Trial',
    action: () => router.push('/register'),
    features: [
      { text: 'Everything in Community, plus:', bold: true },
      { text: 'Hosted infrastructure' },
      { text: '99.9% uptime SLA' },
      { text: 'Priority support (24h response)' },
      { text: 'Advanced analytics' },
      { text: 'Team collaboration' },
      { text: 'Automatic backups' },
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams with custom requirements',
    featured: false,
    checkColor: 'check-cyan',
    cta: 'Contact Sales',
    action: () => { window.location.href = 'mailto:sales@claudenest.io?subject=Enterprise Plan Inquiry'; },
    features: [
      { text: 'Everything in Pro, plus:', bold: true },
      { text: 'Dedicated support engineer' },
      { text: 'Custom SLA (99.99%+)' },
      { text: 'On-premise deployment' },
      { text: 'SSO/SAML integration' },
      { text: 'Custom integrations' },
      { text: 'Training & onboarding' },
    ],
  },
];

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'Is the Community plan really free?',
    answer: 'Yes! ClaudeNest is 100% open source under the MIT license. You can self-host it for free with no limitations on features or number of machines.',
  },
  {
    question: 'What is included in the hosted Pro plan?',
    answer: 'The Pro plan includes fully managed infrastructure, automatic updates, backups, monitoring, and priority support. We handle all the DevOps so you can focus on your work.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at the end of your current billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) and offer annual billing with a discount. Enterprise customers can pay via invoice.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 14-day money-back guarantee for the Pro plan. If you are not satisfied, contact us for a full refund within the first 14 days.',
  },
  {
    question: 'How does the Enterprise plan work?',
    answer: 'Enterprise plans are custom-tailored to your needs. Contact our sales team to discuss your requirements, and we will create a proposal with pricing, SLA commitments, and deployment options.',
  },
];
</script>

<style scoped>
.pricing-page {
  min-height: 100vh;
  background-color: var(--bg-primary, var(--surface-1));
}

/* ── Navigation ────────────────────── */
.pricing-nav {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  background-color: color-mix(in srgb, var(--bg-primary, var(--surface-1)) 80%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color, var(--border));
}

.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-link {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--text-primary);
}

/* ── Main ──────────────────────────── */
.pricing-main {
  padding: 8rem 1.5rem 5rem;
  max-width: 1280px;
  margin: 0 auto;
}

/* ── Header ────────────────────────── */
.pricing-header {
  text-align: center;
  margin-bottom: 4rem;
}

.pricing-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--accent-purple, #a855f7);
  margin-bottom: 0.75rem;
}

.pricing-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 1rem;
  line-height: 1.15;
}

.pricing-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  max-width: 40rem;
  margin: 0 auto;
  line-height: 1.6;
}

/* ── Pricing Grid ──────────────────── */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 5rem;
  align-items: start;
}

/* ── Plan Card ─────────────────────── */
.plan-card {
  position: relative;
  padding: 2rem;
  border-radius: 16px;
  background-color: var(--bg-card, var(--surface-2));
  border: 1px solid var(--border-color, var(--border));
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, border-color 0.2s;
}

.plan-card:hover {
  transform: translateY(-4px);
}

.plan-card.featured {
  border-color: var(--accent-purple, #a855f7);
  border-width: 2px;
  box-shadow: 0 0 40px color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
}

.plan-popular {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 1rem;
  background: var(--accent-purple, #a855f7);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 99px;
  white-space: nowrap;
}

/* ── Plan Header ───────────────────── */
.plan-header {
  margin-bottom: 1.5rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
}

.price-value {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.price-period {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.plan-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}

/* ── Features List ─────────────────── */
.plan-features {
  list-style: none;
  margin: 0 0 2rem;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

.feature-bold {
  font-weight: 600;
  color: var(--text-primary);
}

.feature-check {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

.check-green { color: #22c55e; }
.check-purple { color: var(--accent-purple, #a855f7); }
.check-cyan { color: var(--accent-cyan, #22d3ee); }

/* ── CTA Button ────────────────────── */
.plan-cta {
  width: 100%;
  padding: 0.875rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cta-primary {
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-indigo, #6366f1));
  color: #fff;
}

.cta-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.cta-secondary {
  background-color: var(--bg-hover, var(--surface-3));
  color: var(--text-primary);
  border: 1px solid var(--border-color, var(--border));
}

.cta-secondary:hover {
  background-color: var(--border-color, var(--border));
}

/* ── FAQ ───────────────────────────── */
.faq-section {
  max-width: 56rem;
  margin: 0 auto;
}

.faq-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
  margin: 0 0 3rem;
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.faq-card {
  padding: 1.5rem;
  border-radius: 12px;
  background-color: var(--bg-card, var(--surface-2));
  border: 1px solid var(--border-color, var(--border));
}

.faq-question {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.faq-answer {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ── Responsive ────────────────────── */
@media (max-width: 1024px) {
  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 5rem;
  }
}

@media (max-width: 768px) {
  .pricing-main {
    padding: 7rem 1rem 3rem;
  }

  .faq-grid {
    grid-template-columns: 1fr;
  }
}
</style>
