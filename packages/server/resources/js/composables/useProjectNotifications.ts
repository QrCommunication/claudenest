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
    toast.warning(
      payload.title || t('projectChannel.workerNotification'),
      payload.message || undefined,
    );
  });
}
