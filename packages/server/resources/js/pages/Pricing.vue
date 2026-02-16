<template>
  <div class="min-h-screen bg-surface-1">
    <!-- Navigation -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-surface-1/80 backdrop-blur-xl border-b border-skin">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <Logo variant="full" size="md" to="/" />
          <div class="flex items-center gap-4">
            <router-link to="/" class="text-sm text-skin-secondary hover:text-skin-primary transition-colors">
              Back to Home
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-16">
          <p class="text-sm font-semibold text-brand-purple uppercase tracking-wider mb-3">PRICING</p>
          <h1 class="text-4xl sm:text-5xl font-bold mb-4" style="color: var(--text-primary)">
            Simple, <span class="gradient-text">transparent pricing</span>
          </h1>
          <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
            Choose the plan that fits your needs. All plans include core features with no hidden fees.
          </p>
        </div>

        <!-- Pricing Cards -->
        <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          <!-- Community Plan -->
          <div
            v-motion
            :initial="{ opacity: 0, y: 30 }"
            :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 0, duration: 500 } }"
            class="landing-card p-8"
          >
            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-2" style="color: var(--text-primary)">Community</h3>
              <div class="flex items-baseline gap-1 mb-4">
                <span class="text-4xl font-bold gradient-text">Free</span>
              </div>
              <p class="text-sm" style="color: var(--text-secondary)">Perfect for individuals and open source projects</p>
            </div>

            <ul class="space-y-3 mb-8">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Self-hosted deployment</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Unlimited machines</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Multi-agent coordination</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Context RAG with pgvector</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">MIT License</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Community support</span>
              </li>
            </ul>

            <Button variant="secondary" block size="lg" @click="router.push('/register')">
              Get Started
            </Button>
          </div>

          <!-- Pro Plan (Popular) -->
          <div
            v-motion
            :initial="{ opacity: 0, y: 30 }"
            :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 100, duration: 500 } }"
            class="landing-card p-8 relative border-2 border-brand-purple"
          >
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-purple text-white text-sm font-semibold rounded-full">
              Popular
            </div>

            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-2" style="color: var(--text-primary)">Pro</h3>
              <div class="flex items-baseline gap-1 mb-4">
                <span class="text-4xl font-bold gradient-text">$29</span>
                <span class="text-sm" style="color: var(--text-secondary)">/month</span>
              </div>
              <p class="text-sm" style="color: var(--text-secondary)">Managed hosting with advanced features</p>
            </div>

            <ul class="space-y-3 mb-8">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm font-semibold" style="color: var(--text-primary)">Everything in Community, plus:</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Hosted infrastructure</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">99.9% uptime SLA</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Priority support (24h response)</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Advanced analytics</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Team collaboration</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-purple mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Automatic backups</span>
              </li>
            </ul>

            <Button variant="primary" block size="lg" @click="router.push('/register')">
              Start Free Trial
            </Button>
          </div>

          <!-- Enterprise Plan -->
          <div
            v-motion
            :initial="{ opacity: 0, y: 30 }"
            :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 200, duration: 500 } }"
            class="landing-card p-8"
          >
            <div class="mb-6">
              <h3 class="text-2xl font-bold mb-2" style="color: var(--text-primary)">Enterprise</h3>
              <div class="flex items-baseline gap-1 mb-4">
                <span class="text-4xl font-bold gradient-text">Custom</span>
              </div>
              <p class="text-sm" style="color: var(--text-secondary)">For large teams with custom requirements</p>
            </div>

            <ul class="space-y-3 mb-8">
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm font-semibold" style="color: var(--text-primary)">Everything in Pro, plus:</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Dedicated support engineer</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Custom SLA (99.99%+)</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">On-premise deployment</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">SSO/SAML integration</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Custom integrations</span>
              </li>
              <li class="flex items-start gap-2">
                <svg class="w-5 h-5 text-brand-cyan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span class="text-sm" style="color: var(--text-secondary)">Training & onboarding</span>
              </li>
            </ul>

            <Button variant="secondary" block size="lg" @click="contactSales">
              Contact Sales
            </Button>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="max-w-3xl mx-auto">
          <h2 class="text-3xl font-bold text-center mb-12" style="color: var(--text-primary)">
            Frequently Asked Questions
          </h2>

          <div class="space-y-4">
            <div
              v-for="(faq, idx) in faqs"
              :key="idx"
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :visibleOnce="{ opacity: 1, y: 0, transition: { delay: idx * 50, duration: 400 } }"
              class="landing-card p-6"
            >
              <h3 class="text-lg font-semibold mb-2" style="color: var(--text-primary)">{{ faq.question }}</h3>
              <p class="leading-relaxed" style="color: var(--text-secondary)">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import Logo from '@/components/common/Logo.vue';
import Button from '@/components/common/Button.vue';

const router = useRouter();

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

function contactSales(): void {
  window.location.href = 'mailto:sales@claudenest.io?subject=Enterprise Plan Inquiry';
}
</script>
