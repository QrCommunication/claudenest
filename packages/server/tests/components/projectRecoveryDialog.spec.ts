import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { setActivePinia, createPinia } from 'pinia';

/**
 * ProjectRecoveryDialog surfaces the backend `recoverable` (409) response when a
 * project is created on an already-archived path. It must:
 *   1. preview the archived project (name + context_preview),
 *   2. on confirm → call projectsStore.recoverProject() and emit `recovered`,
 *   3. on decline → emit `create-new` (parent then creates a fresh project),
 *   4. never hit recoverProject when the user declines.
 */

// HTTP layer mock so recoverProject() never touches the network.
vi.mock('@/composables/useApi', () => {
  const api = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() };
  return { api, useApi: () => api };
});

// Toast is a side-effect; spy on it.
const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ success: toastSuccess, error: toastError, warning: vi.fn(), info: vi.fn() }),
}));

import { api } from '@/composables/useApi';
import ProjectRecoveryDialog from '@/components/projects/ProjectRecoveryDialog.vue';
import type { SharedProject } from '@/types';

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn> };

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      projectRecovery: {
        title: 'An archived project exists for this path',
        question: 'Resume it with its saved context, or start a fresh project instead?',
        archivedAt: 'Archived {date}',
        contextPreviewLabel: 'Context preview',
        noContext: 'No saved context.',
        recover: 'Resume archived project',
        recovering: 'Recovering…',
        createNew: 'Create a new project',
        toastRecovered: 'Project recovered with its context.',
        toastRecoverFailed: 'Could not recover the project.',
      },
    },
  },
});

// Passthrough Modal stub: renders the default + footer slots, no Teleport.
const ModalStub = {
  name: 'Modal',
  props: ['modelValue', 'title', 'size', 'closeOnBackdrop', 'closeOnEsc'],
  template: '<div class="modal-stub"><slot /><slot name="footer" /></div>',
};

function makeProject(id: string): SharedProject {
  return { id, name: `Project ${id}`, machine_id: 'm1' } as unknown as SharedProject;
}

function mountDialog() {
  return mount(ProjectRecoveryDialog, {
    props: {
      modelValue: true,
      archivedProjectId: 'arch-1',
      name: 'Legacy API',
      archivedAt: '2026-06-01T10:00:00Z',
      contextPreview: 'Summary of the archived project context.',
    },
    global: {
      plugins: [i18n],
      stubs: { Modal: ModalStub },
    },
  });
}

describe('ProjectRecoveryDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockApi.post.mockReset();
    toastSuccess.mockReset();
    toastError.mockReset();
  });

  it('previews the archived project name and context', () => {
    const wrapper = mountDialog();
    expect(wrapper.text()).toContain('Legacy API');
    expect(wrapper.text()).toContain('Summary of the archived project context.');
  });

  it('shows the empty-context fallback when no preview is provided', () => {
    const wrapper = mount(ProjectRecoveryDialog, {
      props: { modelValue: true, archivedProjectId: 'arch-2', name: 'Empty', contextPreview: null },
      global: { plugins: [i18n], stubs: { Modal: ModalStub } },
    });
    expect(wrapper.text()).toContain('No saved context.');
  });

  it('recovers the project on confirm and emits recovered', async () => {
    const project = makeProject('arch-1');
    mockApi.post.mockResolvedValue({ data: { data: project } });

    const wrapper = mountDialog();
    await wrapper.find(".pr-btn-primary").trigger("click");
    await flushPromises();

    expect(mockApi.post).toHaveBeenCalledWith('/projects/arch-1/recover');
    expect(wrapper.emitted('recovered')?.[0]).toEqual([project]);
    expect(toastSuccess).toHaveBeenCalled();
    // Dialog closes after a successful recovery.
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });

  it('emits create-new on decline without recovering', async () => {
    const wrapper = mountDialog();
    await wrapper.find('.pr-btn-ghost').trigger('click');

    expect(wrapper.emitted('create-new')).toHaveLength(1);
    expect(mockApi.post).not.toHaveBeenCalled();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });

  it('surfaces an error and stays open when recovery fails', async () => {
    mockApi.post.mockRejectedValue(new Error('boom'));

    const wrapper = mountDialog();
    await wrapper.find(".pr-btn-primary").trigger("click");
    await flushPromises();

    expect(toastError).toHaveBeenCalled();
    expect(wrapper.emitted('recovered')).toBeUndefined();
    expect(wrapper.find('.pr-error').exists()).toBe(true);
  });
});
