<template>
  <Modal :model-value="show" @close="$emit('close')" size="md">
    <template #header>
      <h3 class="text-lg font-semibold text-skin-primary">{{ t('mcpAddservermodal.title') }}</h3>
      <p class="mt-1 text-sm text-skin-secondary">{{ t('mcpAddservermodal.subtitle') }}</p>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-skin-primary mb-1">{{ t('mcpAddservermodal.name') }}</label>
        <Input v-model="form.name" :placeholder="t('mcpAddservermodal.namePlaceholder')" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-skin-primary mb-1">{{ t('mcpAddservermodal.displayName') }}</label>
        <Input v-model="form.display_name" :placeholder="t('mcpAddservermodal.displayNamePlaceholder')" />
      </div>

      <div>
        <label class="block text-sm font-medium text-skin-primary mb-1">{{ t('mcpAddservermodal.description') }}</label>
        <textarea
          v-model="form.description"
          rows="2"
          :placeholder="t('mcpAddservermodal.descriptionPlaceholder')"
          class="w-full bg-surface-1 border border-skin rounded-lg px-3 py-2 text-skin-primary text-sm focus:outline-none focus:border-brand-purple resize-none"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-skin-primary mb-1">{{ t('mcpAddservermodal.transport') }}</label>
        <select
          v-model="form.transport"
          class="w-full bg-surface-1 border border-skin rounded-lg px-3 py-2 text-skin-primary text-sm focus:outline-none focus:border-brand-purple appearance-none"
        >
          <option value="stdio">stdio</option>
          <option value="sse">SSE</option>
          <option value="streamable-http">Streamable HTTP</option>
        </select>
      </div>

      <div v-if="form.transport === 'stdio'">
        <label class="block text-sm font-medium text-skin-primary mb-1">{{ t('mcpAddservermodal.command') }}</label>
        <Input v-model="form.command" placeholder="npx -y @modelcontextprotocol/server" />
      </div>

      <div v-else>
        <label class="block text-sm font-medium text-skin-primary mb-1">{{ t('mcpAddservermodal.url') }}</label>
        <Input v-model="form.url" placeholder="http://localhost:3000/mcp" />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" @click="$emit('close')">{{ t('mcpAddservermodal.cancel') }}</Button>
        <Button variant="primary" :loading="isSubmitting" @click="handleSubmit">
          {{ t('mcpAddservermodal.addServer') }}
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from '@/components/common/Modal.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import type { CreateMCPServerPayload, MCPTransport } from '@/types';

const { t } = useI18n();

interface Props {
  show: boolean;
  isSubmitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false,
});

const emit = defineEmits<{
  close: [];
  submit: [data: CreateMCPServerPayload];
}>();

const form = reactive<{
  name: string;
  display_name: string;
  description: string;
  transport: MCPTransport;
  command: string;
  url: string;
}>({
  name: '',
  display_name: '',
  description: '',
  transport: 'stdio',
  command: '',
  url: '',
});

watch(() => props.show, (val) => {
  if (!val) {
    form.name = '';
    form.display_name = '';
    form.description = '';
    form.transport = 'stdio';
    form.command = '';
    form.url = '';
  }
});

function handleSubmit(): void {
  if (!form.name.trim()) return;

  const payload: CreateMCPServerPayload = {
    name: form.name.trim(),
    transport: form.transport,
  };

  if (form.display_name.trim()) payload.display_name = form.display_name.trim();
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.transport === 'stdio' && form.command.trim()) payload.command = form.command.trim();
  if (form.transport !== 'stdio' && form.url.trim()) payload.url = form.url.trim();

  emit('submit', payload);
}
</script>
