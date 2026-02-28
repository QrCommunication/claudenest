<template>
  <div class="w-full">
    <div class="overflow-x-auto rounded-card border border-skin">
      <table class="min-w-full divide-y divide-skin">
        <!-- Header -->
        <thead class="bg-surface-3">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-skin-secondary uppercase tracking-wider',
                column.sortable ? 'cursor-pointer select-none hover:text-skin-primary' : '',
              ]"
              :style="column.width ? { width: column.width } : {}"
              @click="column.sortable && handleSort(column.key)"
            >
              <div class="flex items-center gap-2">
                {{ column.label }}
                <template v-if="column.sortable">
                  <svg
                    v-if="sortKey === column.key && sortOrder === 'asc'"
                    class="w-4 h-4 text-brand-purple"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <svg
                    v-else-if="sortKey === column.key && sortOrder === 'desc'"
                    class="w-4 h-4 text-brand-purple"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4 text-skin-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </template>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody class="bg-surface-2 divide-y divide-skin">
          <template v-if="!isLoading">
            <tr
              v-for="(row, index) in sortedData"
              :key="getRowKey(row, index)"
              :class="[
                'hover:bg-surface-3/50 transition-colors',
                $slots.row ? '' : '',
              ]"
            >
              <slot name="row" :row="row" :index="index">
                <td
                  v-for="column in columns"
                  :key="column.key"
                  class="px-6 py-4 whitespace-nowrap text-sm text-skin-primary"
                >
                  {{ formatCell(row, column) }}
                </td>
              </slot>
            </tr>
          </template>

          <!-- Loading State -->
          <template v-if="isLoading">
            <tr v-for="i in 5" :key="`loading-${i}`">
              <td
                v-for="column in columns"
                :key="`loading-${i}-${column.key}`"
                class="px-6 py-4"
              >
                <Skeleton class="h-4 w-3/4" />
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-if="!isLoading && data.length === 0">
            <td
              :colspan="columns.length"
              class="px-6 py-12 text-center"
            >
              <slot name="empty">
                <div class="flex flex-col items-center justify-center text-skin-muted">
                  <svg
                    class="w-12 h-12 mb-3 opacity-50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-sm">{{ emptyText }}</p>
                </div>
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination && totalPages > 1"
      class="flex items-center justify-between mt-4 px-2"
    >
      <div class="text-sm text-skin-secondary">
        Showing {{ startIndex + 1 }} to {{ Math.min(endIndex, totalItems) }} of {{ totalItems }} results
      </div>
      
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        <div class="flex items-center gap-1">
          <Button
            v-for="page in visiblePages"
            :key="page"
            :variant="page === currentPage ? 'primary' : 'ghost'"
            size="sm"
            @click="goToPage(page)"
          >
            {{ page }}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TableColumn } from '@/types';
import Button from './Button.vue';
import Skeleton from './Skeleton.vue';

interface Props<T = unknown> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyText?: string;
  rowKey?: string | ((row: T) => string);
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  totalItems?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  emptyText: 'No data available',
  rowKey: 'id',
  pagination: false,
  pageSize: 10,
  currentPage: 1,
  totalItems: 0,
});

const emit = defineEmits<{
  'update:currentPage': [page: number];
  sort: [key: string, order: 'asc' | 'desc'];
}>();

const sortKey = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');

const sortedData = computed(() => {
  let result = [...props.data];
  
  if (sortKey.value) {
    result.sort((a, b) => {
      const aVal = getValue(a, sortKey.value) as string | number | null;
      const bVal = getValue(b, sortKey.value) as string | number | null;

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortOrder.value === 'asc' ? -1 : 1;
      if (bVal == null) return sortOrder.value === 'asc' ? 1 : -1;
      if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  return result;
});

const totalPages = computed(() => Math.ceil((props.totalItems || props.data.length) / props.pageSize));

const startIndex = computed(() => (props.currentPage - 1) * props.pageSize);
const endIndex = computed(() => startIndex.value + props.pageSize);

const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const getValue = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
};

const getRowKey = (row: unknown, index: number): string => {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row);
  }
  return String(getValue(row, props.rowKey) || index);
};

const formatCell = (row: unknown, column: TableColumn): string => {
  if (column.formatter) {
    return column.formatter(row as never);
  }
  const value = getValue(row, column.key);
  return value !== undefined && value !== null ? String(value) : '-';
};

const handleSort = (key: string) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
  emit('sort', sortKey.value, sortOrder.value);
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page);
  }
};
</script>
