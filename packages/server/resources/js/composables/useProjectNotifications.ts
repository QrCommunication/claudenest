/**
 * Surfaces `.session.notification` broadcasts of a project (e.g. an
 * orchestrated worker pausing for permission) as warning toasts.
 *
 * Safe to call alongside another useProjectChannel() on the same page: the
 * underlying channel is reference-counted.
 */

import type { Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from '@/composables/useToast';
import { useProjectChannel } from '@/composables/useProjectChannel';

export function useProjectNotifications(
  projectId: Readonly<Ref<string | null>>,
): void {
  const { on } = useProjectChannel(projectId);
  const toast = useToast();
  const { t } = useI18n();

  on('session.notification', (payload) => {
    // Prefer the i18n key (translated against the user's locale); fall back to
    // the server-sent English title/message for older/non-i18n payloads.
    const params = (payload.params ?? {}) as Record<string, unknown>;

    const title = payload.title_key
      ? t(payload.title_key, params)
      : payload.title || t('projectChannel.workerNotification');

    const message = payload.message_key
      ? t(payload.message_key, params)
      : payload.message || undefined;

    toast.warning(title, message);
  });
}
