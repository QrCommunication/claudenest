<template>
  <Modal :model-value="show" @close="$emit('close')" size="md">
    <template #header>
      <h3 class="text-lg font-semibold text-white">Add MCP Server</h3>
      <p class="mt-1 text-sm text-dark-4">Register a new Model Context Protocol server</p>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
        <Input v-model="form.name" placeholder="server-name" required />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Display Name</label>
        <Input v-model="form.display_name" placeholder="My MCP Server" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
        <textarea
          v-model="form.description"
          rows="2"
          placeholder="What does this server do?"
          class="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-purple resize-none"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-1">Transport</label>
        <select
          v-model="form.transport"
          class="w-full bg-dark-1 border border-dark-4 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-purple appearance-none"
        >
          <option value="stdio">stdio</option>
          <option value="sse">SSE</option>
          <option value="streamable-http">Streamable HTTP</option>
        </select>
      </div>

      <div v-if="form.transport === 'stdio'">
        <label class="block text-sm font-medium text-gray-300 mb-1">Command</label>
        <Input v-model="form.command" placeholder="npx -y @modelcontextprotocol/server" />
      </div>

      <div v-else>
        <label class="block text-sm font-medium text-gray-300 mb-1">URL</label>
        <Input v-model="form.url" placeholder="http://localhost:3000/mcp" />
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" @click="$emit('close')">Cancel</Button>
        <Button variant="primary" :loading="isSubmitting" @click="handleSubmit">
          Add Server
        </Button>
      </div>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import Modal from '@/components/common/Modal.vue';
import Input from '@/components/common/Input.vue';
import Button from '@/components/common/Button.vue';
import type { CreateMCPServerPayload, MCPTransport } from '@/types';

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
