<template>
  <div class="archive-menu">
    <button
      ref="triggerEl"
      type="button"
      class="archive-menu-trigger"
      :aria-label="t('menu')"
      :aria-expanded="open"
      :title="t('menu')"
      @click.stop.prevent="toggle"
    >
      <EllipsisVerticalIcon class="archive-menu-icon" />
    </button>

    <!-- Teleported to body + fixed positioning so the dropdown is never clipped
         by the sidebar's overflow-y:auto ancestor. -->
    <Teleport to="body">
      <div
        v-if="open"
        ref="menuEl"
        class="archive-menu-dropdown"
        :style="dropdownStyle"
        role="menu"
      >
        <button
          v-if="!archived"
          type="button"
          class="archive-menu-action"
          role="menuitem"
          @click.stop="select('archive')"
        >
          <ArchiveBoxArrowDownIcon class="archive-menu-action-icon" />
          <span>{{ t('archive') }}</span>
        </button>
        <button
          v-else
          type="button"
          class="archive-menu-action"
          role="menuitem"
          @click.stop="select('unarchive')"
        >
          <ArrowUturnLeftIcon class="archive-menu-action-icon" />
          <span>{{ t('restore') }}</span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  EllipsisVerticalIcon,
  ArchiveBoxArrowDownIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/vue/24/outline';

interface Props {
  projectId: string;
  projectName?: string;
  /** When true the project is archived → the menu offers "restore". */
  archived?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  projectName: '',
  archived: false,
});

const emit = defineEmits<{
  archive: [projectId: string];
  unarchive: [projectId: string];
}>();

// Component-local translations (Composition API local scope) — no shared-locale
// edits, locale inherited from the global i18n instance.
const { t } = useI18n({
  useScope: 'local',
  messages: {
    en: { menu: 'Project actions', archive: 'Archive', restore: 'Restore' },
    fr: { menu: 'Actions du projet', archive: 'Archiver', restore: 'Restaurer' },
  },
});

const open = ref(false);
const triggerEl = ref<HTMLButtonElement | null>(null);
const menuEl = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

function computePosition(): void {
  const rect = triggerEl.value?.getBoundingClientRect();
  if (!rect) return;
  // Anchor the menu's top-right corner just below the trigger.
  dropdownStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 4)}px`,
    left: `${Math.round(rect.right - 160)}px`,
    minWidth: '160px',
    zIndex: '200',
  };
}

function onDocumentClick(event: MouseEvent): void {
  const target = event.target as Node;
  if (triggerEl.value?.contains(target) || menuEl.value?.contains(target)) {
    return;
  }
  close();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close();
  }
}

async function toggle(): Promise<void> {
  if (open.value) {
    close();
    return;
  }
  open.value = true;
  await nextTick();
  computePosition();
  document.addEventListener('click', onDocumentClick, true);
  document.addEventListener('keydown', onKeydown);
}

function close(): void {
  if (!open.value) return;
  open.value = false;
  document.removeEventListener('click', onDocumentClick, true);
  document.removeEventListener('keydown', onKeydown);
}

function select(action: 'archive' | 'unarchive'): void {
  // Branch explicitly: a union event name doesn't match the typed emit overloads.
  if (action === 'archive') {
    emit('archive', props.projectId);
  } else {
    emit('unarchive', props.projectId);
  }
  close();
}

// Always detach the global listeners if the component unmounts while open.
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<style scoped>
.archive-menu {
  display: inline-flex;
  flex-shrink: 0;
}

.archive-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: none;
  color: var(--text-muted);
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
}

.archive-menu-trigger:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
  opacity: 1;
}

.archive-menu-icon {
  width: 16px;
  height: 16px;
}
</style>

<!-- Teleported content lives outside the scoped tree → global styles. -->
<style>
.archive-menu-dropdown {
  background-color: var(--bg-card, var(--surface-2, #24283b));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.archive-menu-action {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary, #e5e7eb);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.archive-menu-action:hover {
  background-color: var(--bg-hover, rgba(255, 255, 255, 0.06));
}

.archive-menu-action-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--accent-purple, #a855f7);
}
</style>
