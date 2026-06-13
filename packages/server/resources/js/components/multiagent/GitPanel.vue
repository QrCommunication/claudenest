<template>
  <div class="git-panel">
    <div class="git-toolbar">
      <button
        class="git-refresh"
        :disabled="store.isLoadingStatus || store.isLoadingPulls"
        :title="t('projectsWorkspace.git.refresh')"
        @click="store.refresh(projectId)"
      >
        <span class="git-refresh-icon" :class="{ spinning: store.isLoadingStatus || store.isLoadingPulls }">↻</span>
        {{ t('projectsWorkspace.git.refresh') }}
      </button>
      <span v-if="store.status?.sandboxed" class="git-sandbox-badge" :title="t('projectsWorkspace.git.sandboxedHint')">
        {{ t('projectsWorkspace.git.sandboxed') }}
      </span>
    </div>

    <p v-if="store.error" class="git-error">{{ store.error }}</p>

    <!-- ── Worktree ─────────────────────────────────────────────────────── -->
    <section class="git-section">
      <h4 class="git-section-title">{{ t('projectsWorkspace.git.worktree') }}</h4>

      <div v-if="store.status" class="git-worktree">
        <div class="git-branch-row">
          <span class="git-branch">⎇ {{ store.status.branch ?? '—' }}</span>
          <span v-if="store.status.ahead > 0" class="git-track ahead">↑{{ store.status.ahead }}</span>
          <span v-if="store.status.behind > 0" class="git-track behind">↓{{ store.status.behind }}</span>
          <span class="git-clean" :class="{ dirty: !store.status.clean }">
            {{ store.status.clean ? t('projectsWorkspace.git.clean') : t('projectsWorkspace.git.dirty', { count: store.status.files.length }) }}
          </span>
        </div>
        <code v-if="store.status.last_commit" class="git-last-commit" :title="store.status.last_commit">
          {{ store.status.last_commit }}
        </code>
        <ul v-if="store.status.files.length > 0" class="git-files">
          <li v-for="f in store.status.files.slice(0, 12)" :key="f.path" class="git-file">
            <span class="git-file-code" :class="codeClass(f.code)">{{ f.code.trim() || '··' }}</span>
            <code class="git-file-path" :title="f.path">{{ f.path }}</code>
          </li>
          <li v-if="store.status.files.length > 12" class="git-file-more">
            +{{ store.status.files.length - 12 }} {{ t('projectsWorkspace.git.moreFiles') }}
          </li>
        </ul>
      </div>
      <p v-else-if="!store.isLoadingStatus" class="git-empty">{{ t('projectsWorkspace.git.noStatus') }}</p>
    </section>

    <!-- ── Pull requests ────────────────────────────────────────────────── -->
    <section class="git-section">
      <h4 class="git-section-title">
        {{ t('projectsWorkspace.git.pulls') }}
        <span v-if="store.pulls.length > 0" class="git-count">{{ store.pulls.length }}</span>
      </h4>

      <p v-if="store.pulls.length === 0 && !store.isLoadingPulls" class="git-empty">
        {{ t('projectsWorkspace.git.noPulls') }}
      </p>

      <ul v-else class="git-pulls">
        <li v-for="pr in store.pulls" :key="pr.number" class="git-pr">
          <div class="git-pr-head">
            <a :href="pr.url" target="_blank" rel="noopener" class="git-pr-title" :title="pr.title">
              <span class="git-pr-num">#{{ pr.number }}</span> {{ pr.title }}
            </a>
            <span v-if="pr.isDraft" class="git-pr-draft">{{ t('projectsWorkspace.git.draft') }}</span>
          </div>
          <div class="git-pr-meta">
            <code class="git-pr-branch">{{ pr.headRefName }} → {{ pr.baseRefName }}</code>
            <span v-if="pr.mergeable" class="git-pr-mergeable" :class="pr.mergeable.toLowerCase()">{{ pr.mergeable }}</span>
          </div>
          <div class="git-pr-actions">
            <select v-model="methods[pr.number]" class="git-merge-method" :aria-label="t('projectsWorkspace.git.method')">
              <option value="squash">squash</option>
              <option value="merge">merge</option>
              <option value="rebase">rebase</option>
            </select>
            <button
              class="git-merge-btn"
              :disabled="store.mergingNumber === pr.number || pr.isDraft"
              @click="onMerge(pr.number)"
            >
              {{ store.mergingNumber === pr.number ? t('projectsWorkspace.git.merging') : t('projectsWorkspace.git.merge') }}
            </button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGitStore, type MergeMethod } from '@/stores/git';
import { useToast } from '@/composables/useToast';

interface Props {
  projectId: string;
}

const props = defineProps<Props>();

const { t } = useI18n();
const store = useGitStore();
const toast = useToast();

// Per-PR merge method selection (defaults to squash).
const methods = reactive<Record<number, MergeMethod>>({});

function codeClass(code: string): string {
  if (code.includes('?')) return 'untracked';
  if (code.includes('M')) return 'modified';
  if (code.includes('A')) return 'added';
  if (code.includes('D')) return 'deleted';
  return '';
}

async function onMerge(number: number): Promise<void> {
  const method = methods[number] ?? 'squash';
  const ok = await store.mergePull(props.projectId, number, method);
  if (ok) {
    toast.success(t('projectsWorkspace.git.mergeSuccess', { number }));
  } else {
    toast.error(store.error ?? t('projectsWorkspace.git.mergeFailed', { number }));
  }
}

onMounted(() => {
  store.refresh(props.projectId);
});
</script>

<style scoped>
.git-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0.25rem;
}

.git-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.git-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  border: 1px solid var(--border, #2a2d3a);
  border-radius: 6px;
  background: var(--surface-2, #1a1b26);
  color: var(--text, #e6e6ef);
  cursor: pointer;
}
.git-refresh:disabled { opacity: 0.5; cursor: default; }
.git-refresh-icon.spinning { display: inline-block; animation: git-spin 0.8s linear infinite; }
@keyframes git-spin { to { transform: rotate(360deg); } }

.git-sandbox-badge {
  font-size: 0.68rem;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 18%, transparent);
  color: var(--accent-purple, #a855f7);
}

.git-error {
  color: var(--color-error, #ef4444);
  font-size: 0.8rem;
  margin: 0;
}

.git-section-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #8b8ca0);
  margin: 0 0 0.5rem;
}
.git-count {
  font-size: 0.68rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--surface-3, #24283b);
  color: var(--text-muted, #8b8ca0);
}

.git-branch-row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
.git-branch { font-weight: 600; color: var(--accent-cyan, #22d3ee); font-size: 0.85rem; }
.git-track { font-size: 0.72rem; font-weight: 600; }
.git-track.ahead { color: var(--color-success, #22c55e); }
.git-track.behind { color: var(--color-warning, #fbbf24); }
.git-clean { font-size: 0.72rem; color: var(--color-success, #22c55e); }
.git-clean.dirty { color: var(--color-warning, #fbbf24); }

.git-last-commit {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  color: var(--text-muted, #8b8ca0);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.git-files { list-style: none; margin: 0.5rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.2rem; }
.git-file { display: flex; align-items: center; gap: 0.45rem; font-size: 0.75rem; }
.git-file-code { width: 1.4rem; text-align: center; font-weight: 700; font-family: monospace; }
.git-file-code.modified { color: var(--color-warning, #fbbf24); }
.git-file-code.added { color: var(--color-success, #22c55e); }
.git-file-code.deleted { color: var(--color-error, #ef4444); }
.git-file-code.untracked { color: var(--text-muted, #8b8ca0); }
.git-file-path { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text, #e6e6ef); }
.git-file-more { font-size: 0.72rem; color: var(--text-muted, #8b8ca0); }

.git-empty { font-size: 0.8rem; color: var(--text-muted, #8b8ca0); margin: 0; }

.git-pulls { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.git-pr {
  border: 1px solid var(--border, #2a2d3a);
  border-radius: 8px;
  padding: 0.55rem 0.6rem;
  background: var(--surface-2, #1a1b26);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.git-pr-head { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.git-pr-title {
  font-size: 0.82rem;
  color: var(--text, #e6e6ef);
  text-decoration: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.git-pr-title:hover { color: var(--accent-purple, #a855f7); }
.git-pr-num { color: var(--accent-cyan, #22d3ee); font-weight: 600; }
.git-pr-draft {
  font-size: 0.66rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: var(--surface-3, #24283b);
  color: var(--text-muted, #8b8ca0);
}
.git-pr-meta { display: flex; align-items: center; gap: 0.5rem; }
.git-pr-branch { font-size: 0.72rem; color: var(--text-muted, #8b8ca0); }
.git-pr-mergeable { font-size: 0.66rem; font-weight: 600; }
.git-pr-mergeable.mergeable { color: var(--color-success, #22c55e); }
.git-pr-mergeable.conflicting { color: var(--color-error, #ef4444); }

.git-pr-actions { display: flex; align-items: center; gap: 0.4rem; }
.git-merge-method {
  font-size: 0.74rem;
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  border: 1px solid var(--border, #2a2d3a);
  background: var(--surface-1, #0f0f1a);
  color: var(--text, #e6e6ef);
}
.git-merge-btn {
  flex: 1;
  padding: 0.3rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background: var(--accent-purple, #a855f7);
  color: #fff;
  cursor: pointer;
}
.git-merge-btn:disabled { opacity: 0.5; cursor: default; }
</style>
