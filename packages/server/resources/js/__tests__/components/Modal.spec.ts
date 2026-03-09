import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Modal from '@/components/common/Modal.vue';

describe('Modal Component', () => {
  it('renders when modelValue is true', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'Test Modal' },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('.fixed').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Modal');
  });

  it('does not render when modelValue is false', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: false, title: 'Test Modal' },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('.fixed').exists()).toBe(false);
  });

  it('displays the correct title', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'My Custom Title' },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('h3').text()).toBe('My Custom Title');
  });

  it('applies the correct size class', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'Test Modal', size: 'lg' },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.find('.max-w-lg').exists()).toBe(true);
  });

  it('emits update:modelValue and close when close button is clicked', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'Test Modal' },
      global: { stubs: { Teleport: true } },
    });

    await wrapper.find('button.absolute').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('renders default slot content', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'Test Modal' },
      slots: { default: '<p>Modal body content</p>' },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.html()).toContain('Modal body content');
  });

  it('renders footer slot content', () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'Test Modal' },
      slots: { footer: '<button>Save</button><button>Cancel</button>' },
      global: { stubs: { Teleport: true } },
    });

    expect(wrapper.html()).toContain('<button>Save</button>');
    expect(wrapper.html()).toContain('<button>Cancel</button>');
  });

  it('validates size prop accepts all valid sizes', () => {
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full'];
    for (const size of sizes) {
      const wrapper = mount(Modal, {
        props: { modelValue: true, title: 'Test Modal', size },
        global: { stubs: { Teleport: true } },
      });
      expect(wrapper.props('size')).toBe(size);
    }
  });

  it('closes on Escape key when closeOnEsc is true', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: false, title: 'Test Modal', closeOnEsc: true },
      global: { stubs: { Teleport: true } },
    });

    // Opening the modal triggers the watcher which registers the ESC handler
    await wrapper.setProps({ modelValue: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('does not close on Escape key when closeOnEsc is false', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: false, title: 'Test Modal', closeOnEsc: false },
      global: { stubs: { Teleport: true } },
    });

    await wrapper.setProps({ modelValue: true });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    expect(wrapper.emitted('close')).toBeFalsy();
  });

  it('removes Escape key handler on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const wrapper = mount(Modal, {
      props: { modelValue: false, title: 'Test Modal', closeOnEsc: true },
      global: { stubs: { Teleport: true } },
    });

    await wrapper.setProps({ modelValue: true });
    wrapper.unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeSpy.mockRestore();
  });

  it('closes on backdrop click when closeOnBackdrop is true', async () => {
    const wrapper = mount(Modal, {
      props: { modelValue: true, title: 'Test Modal', closeOnBackdrop: true },
      global: { stubs: { Teleport: true } },
    });

    await wrapper.find('.fixed').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([false]);
  });
});
