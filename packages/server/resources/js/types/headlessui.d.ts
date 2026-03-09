/**
 * Type declarations for @headlessui/vue
 * Temporary shim for components used in UserMenu
 */

declare module '@headlessui/vue' {
  import type { DefineComponent } from 'vue';

  export const Menu: DefineComponent<any>;
  export const MenuButton: DefineComponent<any>;
  export const MenuItems: DefineComponent<any>;
  export const MenuItem: DefineComponent<any>;
}
