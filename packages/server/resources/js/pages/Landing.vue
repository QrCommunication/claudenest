<template>
  <div class="min-h-screen bg-surface-1">
    <!-- Navigation (sticky) -->
    <nav class="fixed top-0 left-0 right-0 z-50 bg-surface-1/80 backdrop-blur-xl border-b border-skin">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <Logo variant="full" size="md" to="/" />

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6">
            <a
              v-for="link in navLinks"
              :key="link.id"
              :href="`#${link.id}`"
              class="nav-link cursor-pointer"
              :class="activeSection === link.id ? 'text-skin-primary font-semibold' : ''"
              @click.prevent="handleNavClick(link.id)"
            >
              {{ $t(link.label) }}
            </a>
            <router-link to="/docs" class="nav-link cursor-pointer">
              {{ $t('docs.title') }}
            </router-link>
          </div>

          <!-- Right Side -->
          <div class="flex items-center gap-3">
            <ThemeToggle variant="ghost" />
            <LanguageSwitcher variant="ghost" :show-label="false" />

            <!-- Mobile Menu Button -->
            <button
              class="md:hidden p-2 text-skin-secondary hover:text-skin-primary transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
              @click="mobileMenuOpen = !mobileMenuOpen"
            >
              <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div class="hidden sm:flex items-center gap-3 ml-4">
              <router-link to="/login" class="text-skin-secondary hover:text-skin-primary transition-colors font-medium cursor-pointer">
                {{ $t('common.login') }}
              </router-link>
              <router-link
                to="/register"
                class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-brand-purple/25 cursor-pointer"
              >
                {{ $t('landing.hero.cta_primary') }}
              </router-link>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="mobileMenuOpen" class="md:hidden pb-4 border-t border-skin mt-2 pt-4">
            <div class="flex flex-col gap-3">
              <a
                v-for="link in navLinks"
                :key="link.id"
                :href="`#${link.id}`"
                class="nav-link px-2 py-1 cursor-pointer"
                :class="activeSection === link.id ? 'text-skin-primary font-semibold' : ''"
                @click.prevent="handleNavClick(link.id)"
              >
                {{ $t(link.label) }}
              </a>
              <router-link to="/docs" class="nav-link px-2 py-1 cursor-pointer">
                {{ $t('docs.title') }}
              </router-link>
              <div class="flex items-center gap-3 pt-3 border-t border-skin sm:hidden">
                <router-link to="/login" class="text-skin-secondary hover:text-skin-primary transition-colors font-medium cursor-pointer">
                  {{ $t('common.login') }}
                </router-link>
                <router-link to="/register" class="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-white rounded-lg font-medium transition-colors cursor-pointer">
                  {{ $t('landing.hero.cta_primary') }}
                </router-link>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </nav>

    <!-- Main Content -->
    <main>
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ArchitectureSection />
      <ComparisonSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <OpenSourceSection />
      <CTASection />
      <FooterSection />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActiveSection } from '@/composables/useActiveSection';
import Logo from '@/components/common/Logo.vue';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';
import HeroSection from '@/components/landing/HeroSection.vue';
import ProblemSection from '@/components/landing/ProblemSection.vue';
import SolutionSection from '@/components/landing/SolutionSection.vue';
import FeaturesSection from '@/components/landing/FeaturesSection.vue';
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue';
import ArchitectureSection from '@/components/landing/ArchitectureSection.vue';
import ComparisonSection from '@/components/landing/ComparisonSection.vue';
import TestimonialsSection from '@/components/landing/TestimonialsSection.vue';
import PricingSection from '@/components/landing/PricingSection.vue';
import FAQSection from '@/components/landing/FAQSection.vue';
import OpenSourceSection from '@/components/landing/OpenSourceSection.vue';
import CTASection from '@/components/landing/CTASection.vue';
import FooterSection from '@/components/landing/FooterSection.vue';

const { t } = useI18n();

const mobileMenuOpen = ref(false);

const sectionIds = ['features', 'how-it-works', 'comparison', 'pricing'];
const { activeSection, scrollToSection } = useActiveSection(sectionIds);

const navLinks = [
  { id: 'features', label: 'landing.nav.features' },
  { id: 'how-it-works', label: 'landing.nav.how_it_works' },
  { id: 'comparison', label: 'landing.nav.compare' },
  { id: 'pricing', label: 'landing.nav.pricing' },
];

function handleNavClick(sectionId: string) {
  mobileMenuOpen.value = false;
  scrollToSection(sectionId);
}
</script>
