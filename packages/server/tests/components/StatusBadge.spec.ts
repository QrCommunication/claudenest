import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import StatusBadge from '@/components/common/StatusBadge.vue';

/**
 * StatusBadge is the single source of truth for the status/priority → color +
 * label mapping. Colors live entirely in scoped CSS classes (sb-status-done,
 * sb-priority-critical, …) which jsdom does not apply, so the testable surface
 * is twofold:
 *   1. the right CSS class is bound (= the color mapping the component promises)
 *   2. the right i18n key is resolved per enum value (= the label)
 * We feed a real vue-i18n instance with controlled messages so labels are
 * deterministic and the enum → camelCase-key mapping (in_progress → inProgress)
 * is genuinely exercised.
 */

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    en: {
      statusBadge: {
        status: {
          open: 'Open',
          backlog: 'Backlog',
          pending: 'Pending',
          inProgress: 'In Progress',
          blocked: 'Blocked',
          review: 'Review',
          done: 'Done',
        },
        priority: {
          low: 'Low',
          medium: 'Medium',
          high: 'High',
          critical: 'Critical',
        },
      },
    },
  },
});

function mountBadge(props: { type: 'status' | 'priority'; value: string; dot?: boolean }) {
  return mount(StatusBadge, {
    props,
    global: { plugins: [i18n] },
  });
}

describe('StatusBadge', () => {
  describe('status mapping (color class + label)', () => {
    const cases: Array<{ value: string; label: string }> = [
      { value: 'open', label: 'Open' },
      { value: 'backlog', label: 'Backlog' },
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'blocked', label: 'Blocked' },
      { value: 'review', label: 'Review' },
      { value: 'done', label: 'Done' },
    ];

    it.each(cases)('renders status "$value" with its color class and label', ({ value, label }) => {
      const wrapper = mountBadge({ type: 'status', value });

      // Color mapping = the bound CSS classes
      expect(wrapper.classes()).toContain('status-badge');
      expect(wrapper.classes()).toContain('sb-status');
      expect(wrapper.classes()).toContain(`sb-status-${value}`);
      // Never leaks the priority namespace
      expect(wrapper.classes()).not.toContain('sb-priority');
      // Label resolved via the statusBadge.status.* namespace (camelCase key)
      expect(wrapper.text()).toBe(label);
    });
  });

  describe('priority mapping (color class + label)', () => {
    const cases: Array<{ value: string; label: string }> = [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ];

    it.each(cases)('renders priority "$value" with its color class and label', ({ value, label }) => {
      const wrapper = mountBadge({ type: 'priority', value });

      expect(wrapper.classes()).toContain('status-badge');
      expect(wrapper.classes()).toContain('sb-priority');
      expect(wrapper.classes()).toContain(`sb-priority-${value}`);
      expect(wrapper.classes()).not.toContain('sb-status');
      expect(wrapper.text()).toBe(label);
    });
  });

  describe('dot rendering', () => {
    it('renders a color dot and the has-dot modifier when dot=true', () => {
      const wrapper = mountBadge({ type: 'status', value: 'in_progress', dot: true });

      expect(wrapper.classes()).toContain('sb-has-dot');
      expect(wrapper.find('.sb-dot').exists()).toBe(true);
      // The dot is purely decorative for screen readers
      expect(wrapper.find('.sb-dot').attributes('aria-hidden')).toBe('true');
    });

    it('omits the dot by default', () => {
      const wrapper = mountBadge({ type: 'status', value: 'in_progress' });

      expect(wrapper.classes()).not.toContain('sb-has-dot');
      expect(wrapper.find('.sb-dot').exists()).toBe(false);
    });
  });

  describe('unknown value fallback', () => {
    it('falls back to the "pending" label for an unknown status (class keeps raw value)', () => {
      const wrapper = mountBadge({ type: 'status', value: 'frozen' });

      // Raw value is still reflected on the class so an unmapped enum is visible…
      expect(wrapper.classes()).toContain('sb-status-frozen');
      // …but the label degrades gracefully instead of showing a missing key
      expect(wrapper.text()).toBe('Pending');
    });

    it('falls back to the "medium" label for an unknown priority', () => {
      const wrapper = mountBadge({ type: 'priority', value: 'urgent' });

      expect(wrapper.classes()).toContain('sb-priority-urgent');
      expect(wrapper.text()).toBe('Medium');
    });
  });
});
