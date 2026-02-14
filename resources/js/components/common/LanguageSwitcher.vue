<template>
  <button
    class="p-2 text-dark-4 hover:text-white rounded-lg hover:bg-dark-3 transition-colors font-mono text-sm"
    @click="toggleLocale"
    aria-label="Switch language"
  >
    {{ locale === 'en' ? 'FR' : 'EN' }}
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const toggleLocale = () => {
  locale.value = locale.value === 'en' ? 'fr' : 'en';
};
</script>
