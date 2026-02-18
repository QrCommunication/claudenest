<template>
  <div class="activity-feed">
    <div class="feed-header">
      <h3 class="feed-title">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        Activity Feed
      </h3>
      <div class="feed-actions">
        <button 
          class="refresh-btn"
          :class="{ 'is-loading': isLoading }"
          @click="$emit('refresh')"
          title="Refresh"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
        <select 
          v-model="selectedFilter"
          class="filter-select"
        >
          <option value="">All Activities</option>
          <option value="task_claimed">Tasks Claimed</option>
          <option value="task_completed">Tasks Completed</option>
          <option value="file_locked">File Locks</option>
          <option value="broadcast">Broadcasts</option>
        </select>
      </div>
    </div>

    <div class="feed-content" ref="feedContainer">
      <div v-if="isLoading && activities.length === 0" class="feed-loading">
        <div class="spinner" />
        <p>Loading activity...</p>
      </div>

      <div v-else-if="filteredActivities.length === 0" class="feed-empty">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
        </svg>
        <p>{{ selectedFilter ? 'No matching activities' : 'No activity recorded yet' }}</p>
      </div>

      <div v-else class="feed-list">
        <div 
          v-for="activity in filteredActivities" 
          :key="activity.id"
          class="activity-item"
          :class="activity.type"
        >
          <div class="activity-icon" :style="{ backgroundColor: `${activity.color}20`, color: activity.color }">
            <span class="icon-emoji">{{ activity.icon }}</span>
          </div>
          
          <div class="activity-content">
            <div class="activity-header">
              <span class="activity-type">{{ formatType(activity.type) }}</span>
              <span class="activity-time">{{ formatRelativeTime(activity.created_at) }}</span>
            </div>
            
            <p class="activity-message">{{ activity.message }}</p>
            
            <div v-if="activity.instance_id" class="activity-meta">
              <span class="instance-badge">
                Instance: {{ activity.instance_id.slice(0, 8) }}...
              </span>
            </div>
            
            <!-- Expandable details -->
            <div v-if="hasDetails(activity)" class="activity-details">
              <button 
                class="details-toggle"
                @click="toggleDetails(activity.id)"
              >
                {{ expandedActivities.has(activity.id) ? 'Hide details' : 'Show details' }}
              </button>
              
              <div v-if="expandedActivities.has(activity.id)" class="details-content">
                <pre>{{ JSON.stringify(activity.details, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Load more indicator -->
      <div v-if="hasMore" class="load-more">
        <button 
          class="load-more-btn"
          :disabled="isLoading"
          @click="$emit('load-more')"
        >
          {{ isLoading ? 'Loading...' : 'Load more' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ActivityLog, ActivityType } from '@/types';

interface Props {
  activities: ActivityLog[];
  isLoading?: boolean;
  hasMore?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  hasMore: false,
});

const emit = defineEmits<{
  'refresh': [];
  'load-more': [];
}>();

const selectedFilter = ref<string>('');
const expandedActivities = ref<Set<string>>(new Set());
const feedContainer = ref<HTMLElement | null>(null);

const filteredActivities = computed(() => {
  if (!selectedFilter.value) {
    return props.activities;
  }
  return props.activities.filter(a => a.type === selectedFilter.value);
});

function formatType(type: ActivityType): string {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function hasDetails(activity: ActivityLog): boolean {
  return activity.details && Object.keys(activity.details).length > 0;
}

function toggleDetails(activityId: string) {
  const newSet = new Set(expandedActivities.value);
  if (newSet.has(activityId)) {
    newSet.delete(activityId);
  } else {
    newSet.add(activityId);
  }
  expandedActivities.value = newSet;
}
</script>

<style scoped>
.activity-feed {
  @apply bg-dark-2 rounded-xl border border-dark-4 flex flex-col h-full max-h-[600px];
}

.feed-header {
  @apply flex items-center justify-between p-4 border-b border-dark-4;
}

.feed-title {
  @apply flex items-center gap-2 text-lg font-semibold text-white;
}

.feed-title svg {
  @apply w-5 h-5 text-brand-purple;
}

.feed-actions {
  @apply flex items-center gap-2;
}

.refresh-btn {
  @apply p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-3 transition-colors;
}

.refresh-btn svg {
  @apply w-4 h-4;
}

.refresh-btn.is-loading svg {
  @apply animate-spin;
}

.filter-select {
  @apply px-3 py-1.5 bg-dark-3 border border-dark-4 rounded-lg text-sm text-white;
  @apply focus:outline-none focus:border-brand-purple;
}

.feed-content {
  @apply flex-1 overflow-y-auto p-4;
}

.feed-loading {
  @apply flex flex-col items-center justify-center py-12;
}

.spinner {
  @apply w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin;
}

.feed-loading p {
  @apply mt-3 text-gray-400 text-sm;
}

.feed-empty {
  @apply flex flex-col items-center justify-center py-12 text-center;
}

.feed-empty svg {
  @apply w-12 h-12 text-gray-600 mb-3;
}

.feed-empty p {
  @apply text-gray-400;
}

.feed-list {
  @apply space-y-4;
}

.activity-item {
  @apply flex gap-3 p-3 rounded-lg bg-dark-3/50 hover:bg-dark-3 transition-colors;
}

.activity-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0;
}

.icon-emoji {
  @apply text-lg;
}

.activity-content {
  @apply flex-1 min-w-0;
}

.activity-header {
  @apply flex items-center justify-between gap-2 mb-1;
}

.activity-type {
  @apply text-xs font-medium text-gray-400 uppercase tracking-wide;
}

.activity-time {
  @apply text-xs text-gray-500;
}

.activity-message {
  @apply text-sm text-white leading-relaxed;
}

.activity-meta {
  @apply mt-2;
}

.instance-badge {
  @apply inline-flex items-center px-2 py-0.5 bg-dark-4 rounded text-xs text-gray-400 font-mono;
}

.activity-details {
  @apply mt-2;
}

.details-toggle {
  @apply text-xs text-brand-purple hover:underline;
}

.details-content {
  @apply mt-2 p-2 bg-dark-4 rounded-lg overflow-x-auto;
}

.details-content pre {
  @apply text-xs text-gray-400 font-mono;
}

.load-more {
  @apply pt-4 text-center;
}

.load-more-btn {
  @apply px-4 py-2 text-sm text-gray-400 hover:text-white bg-dark-3 hover:bg-dark-4 rounded-lg transition-colors;
}

.load-more-btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

/* Activity type-specific styling */
.activity-item.task_claimed .activity-type {
  @apply text-brand-indigo;
}

.activity-item.task_completed .activity-type {
  @apply text-green-400;
}

.activity-item.file_locked .activity-type {
  @apply text-brand-purple;
}

.activity-item.broadcast .activity-type {
  @apply text-brand-cyan;
}

/* Custom scrollbar */
.feed-content::-webkit-scrollbar {
  @apply w-1.5;
}

.feed-content::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.feed-content::-webkit-scrollbar-thumb {
  @apply bg-dark-4 rounded-full;
}

.feed-content::-webkit-scrollbar-thumb:hover {
  @apply bg-dark-3;
}
</style>
