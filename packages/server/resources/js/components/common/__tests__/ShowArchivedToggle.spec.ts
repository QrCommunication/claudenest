import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ShowArchivedToggle from '@/components/common/ShowArchivedToggle.vue';

/**
 * ShowArchivedToggle is the reusable "Actifs / Archivés" tablist that backs the
 * archive parity work across the boards. These specs pin its v-model contract,
 * the accessible active state, and the optional count badges.
 */
describe('ShowArchivedToggle', () => {
  it('renders the default French labels and reflects the active state', () => {
    const wrapper = mount(ShowArchivedToggle, {
      props: { modelValue: false },
    });

    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    expect(tabs[0].text()).toContain('Actifs');
    expect(tabs[1].text()).toContain('Archivés');
    // modelValue false → the active segment is selected, archived is not.
    expect(tabs[0].attributes('aria-selected')).toBe('true');
    expect(tabs[1].attributes('aria-selected')).toBe('false');
  });

  it('marks the archived segment selected when modelValue is true', () => {
    const wrapper = mount(ShowArchivedToggle, {
      props: { modelValue: true },
    });
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0].attributes('aria-selected')).toBe('false');
    expect(tabs[1].attributes('aria-selected')).toBe('true');
  });

  it('accepts overridable labels', () => {
    const wrapper = mount(ShowArchivedToggle, {
      props: { modelValue: false, activeLabel: 'Active', archivedLabel: 'Archived' },
    });
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs[0].text()).toContain('Active');
    expect(tabs[1].text()).toContain('Archived');
  });

  it('emits update:modelValue with the next boolean when a segment is clicked', async () => {
    const wrapper = mount(ShowArchivedToggle, {
      props: { modelValue: false },
    });
    const tabs = wrapper.findAll('[role="tab"]');

    // Click "Archivés" → emits true.
    await tabs[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);

    // Click "Actifs" → emits false.
    await tabs[0].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false]);
  });

  it('renders count badges only when the counts are provided', () => {
    const without = mount(ShowArchivedToggle, {
      props: { modelValue: false },
    });
    expect(without.findAll('.archive-toggle-count')).toHaveLength(0);

    const withCounts = mount(ShowArchivedToggle, {
      props: { modelValue: false, activeCount: 7, archivedCount: 2 },
    });
    const badges = withCounts.findAll('.archive-toggle-count');
    expect(badges).toHaveLength(2);
    expect(badges[0].text()).toBe('7');
    expect(badges[1].text()).toBe('2');
  });
});
