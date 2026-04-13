/**
 * Type declarations for @headlessui/vue
 * Temporary shim for components used in UserMenu
 */

declare module '@headlessui/vue' {
  import type { DefineComponent } from 'vue';

  type HeadlessProps = Record<string, unknown>;

  export const Menu: DefineComponent<HeadlessProps>;
  export const MenuButton: DefineComponent<HeadlessProps>;
  export const MenuItems: DefineComponent<HeadlessProps>;
  export const MenuItem: DefineComponent<HeadlessProps>;
}
