<template>
  <nav
    aria-label="Breadcrumb"
    class=""
  >
    <ol class="flex items-center gap-1 text-sm">
      <!-- Home link (always first) -->
      <li class="flex items-center">
        <RouterLink
          to="/dashboard"
          class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-skin-muted transition-all duration-200 hover:bg-surface-3 hover:text-skin-primary"
          aria-label="Dashboard"
        >
          <svg
            class="h-4 w-4 transition-transform duration-200 group-hover:scale-110"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z"
              clip-rule="evenodd"
            />
          </svg>
        </RouterLink>
      </li>

      <!-- Breadcrumb items -->
      <li
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center"
      >
        <!-- Chevron separator -->
        <svg
          class="mx-1 h-3.5 w-3.5 flex-shrink-0 text-skin-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clip-rule="evenodd"
          />
        </svg>

        <!-- Link item (not the last one) -->
        <RouterLink
          v-if="item.to && !isLast(index)"
          :to="item.to"
          class="group flex items-center gap-1.5 rounded-md px-2 py-1 text-skin-muted transition-all duration-200 hover:bg-surface-3 hover:text-skin-primary"
        >
          <span
            v-if="item.icon"
            class="transition-transform duration-200 group-hover:scale-110"
            v-html="item.icon"
          />
          <span>{{ item.label }}</span>
        </RouterLink>

        <!-- Current page (last item, no link) -->
        <span
          v-else
          class="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-skin-primary"
          :aria-current="isLast(index) ? 'page' : undefined"
        >
          <span
            v-if="item.icon"
            v-html="item.icon"
          />
          <span class="bg-gradient-to-r from-brand-purple to-brand-indigo bg-clip-text text-transparent">
            {{ item.label }}
          </span>
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { BreadcrumbItem } from '@/types';

interface Props {
  items: BreadcrumbItem[];
}

const props = defineProps<Props>();

const isLast = (index: number): boolean => {
  return index === props.items.length - 1;
};
</script>
