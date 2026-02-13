<template>
  <section id="comparison" class="py-24 px-4 sm:px-6 lg:px-8 section-alt relative">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16">
        <p class="code-comment mb-3">// COMPARE</p>
        <p class="text-sm font-semibold text-brand-indigo uppercase tracking-wider mb-3">{{ $t('landing.comparison.badge') }}</p>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style="color: var(--text-primary)">
          {{ $t('landing.comparison.title') }}
          <span class="gradient-text">{{ $t('landing.comparison.title_highlight') }}</span>
        </h2>
        <p class="text-lg max-w-2xl mx-auto" style="color: var(--text-secondary)">
          {{ $t('landing.comparison.subtitle') }}
        </p>
      </div>

      <!-- Mobile comparison (cards) -->
      <div class="lg:hidden space-y-4">
        <div
          v-for="feature in comparisonFeatures"
          :key="feature.name"
          class="landing-card p-4"
        >
          <h4 class="font-medium mb-3" style="color: var(--text-primary)">{{ feature.name }}</h4>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="tool in comparisonTools"
              :key="tool.name"
              class="flex items-center justify-between px-3 py-2 rounded-lg"
              :class="tool.name === 'ClaudeNest' ? 'bg-brand-purple/10 border border-brand-purple/30' : ''"
              :style="tool.name !== 'ClaudeNest' ? `background-color: var(--surface-3); opacity: 0.7` : ''"
            >
              <span
                class="text-sm"
                :class="tool.name === 'ClaudeNest' ? 'text-brand-purple font-medium' : ''"
                :style="tool.name !== 'ClaudeNest' ? 'color: var(--text-secondary)' : ''"
              >{{ tool.name }}</span>
              <span
                class="w-5 h-5 flex-shrink-0"
                :class="getComparisonColor(feature.values[tool.key])"
                v-html="getComparisonSvg(feature.values[tool.key])"
              ></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop comparison table -->
      <div
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :visibleOnce="{ opacity: 1, y: 0, transition: { delay: 200, duration: 600 } }"
        class="hidden lg:block"
      >
        <div class="landing-card overflow-hidden" style="transform: none">
          <table class="w-full" aria-label="Feature comparison">
            <thead>
              <tr style="border-bottom: 1px solid var(--border)">
                <th class="text-left py-4 px-6 text-sm font-medium" style="color: var(--text-muted)">
                  {{ $t('landing.comparison.feature_label') }}
                </th>
                <th
                  v-for="tool in comparisonTools"
                  :key="tool.name"
                  class="py-4 px-6 text-sm font-medium text-center"
                  :class="tool.name === 'ClaudeNest' ? 'text-brand-purple bg-brand-purple/5' : ''"
                  :style="tool.name !== 'ClaudeNest' ? 'color: var(--text-muted)' : ''"
                >
                  <span :class="tool.name === 'ClaudeNest' ? 'font-bold text-base' : ''">{{ tool.name }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(feature, idx) in comparisonFeatures"
                :key="feature.name"
                v-motion
                :initial="{ opacity: 0, x: -10 }"
                :visibleOnce="{ opacity: 1, x: 0, transition: { delay: 300 + idx * 60, duration: 400 } }"
                class="transition-colors"
                :style="`border-bottom: ${idx !== comparisonFeatures.length - 1 ? '1px solid var(--border)' : 'none'}`"
              >
                <td class="py-4 px-6 text-sm font-medium" style="color: var(--text-primary)">{{ feature.name }}</td>
                <td
                  v-for="tool in comparisonTools"
                  :key="tool.name"
                  class="py-4 px-6 text-center"
                  :class="tool.name === 'ClaudeNest' ? 'bg-brand-purple/5' : ''"
                >
                  <div class="flex justify-center">
                    <span
                      class="w-5 h-5"
                      :class="getComparisonColor(feature.values[tool.key])"
                      v-html="getComparisonSvg(feature.values[tool.key])"
                    ></span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

type CompVal = 'yes' | 'no' | 'partial';

interface ComparisonTool {
  name: string;
  key: string;
}

interface ComparisonFeature {
  name: string;
  values: Record<string, CompVal>;
}

const comparisonTools: ComparisonTool[] = [
  { name: 'ClaudeNest', key: 'claudenest' },
  { name: 'Claude-Flow', key: 'claudeflow' },
  { name: 'CrewAI', key: 'crewai' },
  { name: 'Remote-Code', key: 'remotecode' },
];

const comparisonFeatures: ComparisonFeature[] = [
  { name: t('landing.comparison.features.multi_agent'), values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'yes', remotecode: 'yes' } },
  { name: t('landing.comparison.features.web_dashboard'), values: { claudenest: 'yes', claudeflow: 'no', crewai: 'yes', remotecode: 'yes' } },
  { name: t('landing.comparison.features.mobile_app'), values: { claudenest: 'yes', claudeflow: 'no', crewai: 'no', remotecode: 'yes' } },
  { name: t('landing.comparison.features.rag_context'), values: { claudenest: 'yes', claudeflow: 'partial', crewai: 'no', remotecode: 'no' } },
  { name: t('landing.comparison.features.file_locking'), values: { claudenest: 'yes', claudeflow: 'no', crewai: 'no', remotecode: 'yes' } },
  { name: t('landing.comparison.features.claude_specific'), values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'no', remotecode: 'no' } },
  { name: t('landing.comparison.features.websocket'), values: { claudenest: 'yes', claudeflow: 'partial', crewai: 'no', remotecode: 'yes' } },
  { name: t('landing.comparison.features.mcp_support'), values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'no', remotecode: 'no' } },
  { name: t('landing.comparison.features.open_source'), values: { claudenest: 'yes', claudeflow: 'yes', crewai: 'partial', remotecode: 'no' } },
];

function getComparisonColor(value: CompVal): string {
  if (value === 'yes') return 'text-green-400';
  if (value === 'partial') return 'text-yellow-400';
  return 'text-red-400/60';
}

function getComparisonSvg(value: CompVal): string {
  if (value === 'yes') {
    return '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
  }
  if (value === 'partial') {
    return '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 12h14"/></svg>';
  }
  return '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>';
}
</script>
