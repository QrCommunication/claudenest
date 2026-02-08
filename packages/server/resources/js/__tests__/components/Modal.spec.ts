import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';

// Simple Modal component for testing
const Modal = defineComponent({
  name: 'Modal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      default: 'md',
      validator: (value: string) => ['sm', 'md', 'lg', 'xl'].includes(value),
    },
  },
  emits: ['close'],
  setup(props, { emit }) {
    const handleClose = () => {
      emit('close');
    };

    return {
      handleClose,
    };
  },
  template: `
    <div v-if="show" class="modal" :class="'modal-' + size">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button @click="handleClose" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  `,
});

describe('Modal Component', () => {
  it('renders when show prop is true', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal',
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Modal');
  });

  it('does not render when show prop is false', () => {
    const wrapper = mount(Modal, {
      props: {
        show: false,
        title: 'Test Modal',
      },
    });

    expect(wrapper.find('.modal').exists()).toBe(false);
  });

  it('displays the correct title', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'My Custom Title',
      },
    });

    expect(wrapper.find('.modal-header h3').text()).toBe('My Custom Title');
  });

  it('applies the correct size class', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal',
        size: 'lg',
      },
    });

    expect(wrapper.find('.modal').classes()).toContain('modal-lg');
  });

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal',
      },
    });

    await wrapper.find('.close-btn').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('renders default slot content', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal',
      },
      slots: {
        default: '<p>Modal body content</p>',
      },
    });

    expect(wrapper.find('.modal-body').html()).toContain('Modal body content');
  });

  it('renders footer slot content', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal',
      },
      slots: {
        footer: '<button>Save</button><button>Cancel</button>',
      },
    });

    expect(wrapper.find('.modal-footer').html()).toContain('<button>Save</button>');
    expect(wrapper.find('.modal-footer').html()).toContain('<button>Cancel</button>');
  });

  it('validates size prop', () => {
    const wrapper = mount(Modal, {
      props: {
        show: true,
        title: 'Test Modal',
        size: 'xl',
      },
    });

    expect(wrapper.props('size')).toBe('xl');
  });
});
