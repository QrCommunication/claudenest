<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Tasks</h1>
        <p class="text-dark-4 mt-1">Manage and track automated tasks</p>
      </div>
      <Button @click="showCreateModal = true">
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Task
      </Button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Card hoverable>
        <div class="text-center">
          <p class="text-2xl font-bold text-white">{{ tasks.length }}</p>
          <p class="text-xs text-dark-4 mt-1">Total Tasks</p>
        </div>
      </Card>
      <Card hoverable>
        <div class="text-center">
          <p class="text-2xl font-bold text-yellow-400">{{ pendingCount }}</p>
          <p class="text-xs text-dark-4 mt-1">Pending</p>
        </div>
      </Card>
      <Card hoverable>
        <div class="text-center">
          <p class="text-2xl font-bold text-brand-cyan">{{ inProgressCount }}</p>
          <p class="text-xs text-dark-4 mt-1">In Progress</p>
        </div>
      </Card>
      <Card hoverable>
        <div class="text-center">
          <p class="text-2xl font-bold text-green-400">{{ completedCount }}</p>
          <p class="text-xs text-dark-4 mt-1">Completed</p>
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <Input
        v-model="searchQuery"
        placeholder="Search tasks..."
        class="sm:w-64"
      />
      <Select
        v-model="statusFilter"
        :options="[
          { value: 'all', label: 'All Status' },
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'failed', label: 'Failed' },
        ]"
        class="sm:w-40"
      />
      <Select
        v-model="priorityFilter"
        :options="[
          { value: 'all', label: 'All Priorities' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ]"
        class="sm:w-40"
      />
    </div>

    <!-- Tasks List -->
    <Card>
      <Table
        :data="filteredTasks"
        :columns="columns"
        :is-loading="isLoading"
      >
        <template #row="{ row }">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <button
                :class="[
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                  row.status === 'completed'
                    ? 'bg-green-500 border-green-500'
                    : 'border-dark-4 hover:border-brand-purple',
                ]"
                @click="toggleTask(row)"
              >
                <svg
                  v-if="row.status === 'completed'"
                  class="w-3 h-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <div>
                <p
                  :class="[
                    'text-sm font-medium',
                    row.status === 'completed' ? 'text-dark-4 line-through' : 'text-white',
                  ]"
                >
                  {{ row.title }}
                </p>
                <p class="text-xs text-dark-4">{{ row.description }}</p>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <Badge :variant="priorityVariant(row.priority)" size="sm">
              {{ row.priority }}
            </Badge>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <Badge :variant="statusVariant(row.status)" size="sm" dot>
              {{ formatStatus(row.status) }}
            </Badge>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-dark-4">
            {{ formatTime(row.created_at) }}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right">
            <Button
              variant="ghost"
              size="sm"
              @click="deleteTask(row)"
            >
              <svg class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </td>
        </template>
      </Table>
    </Card>

    <!-- Create Task Modal -->
    <Modal v-model="showCreateModal" title="Create New Task">
      <div class="space-y-4">
        <Input
          v-model="newTask.title"
          label="Task Title"
          placeholder="Enter task title..."
          required
        />
        <div>
          <label class="block text-sm font-medium text-dark-4 mb-1.5">Description</label>
          <textarea
            v-model="newTask.description"
            rows="2"
            class="block w-full rounded-button bg-dark-3 border border-dark-4 text-white placeholder-dark-4 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/50 focus:border-brand-purple transition-colors resize-none"
            placeholder="Optional description..."
          />
        </div>
        <Select
          v-model="newTask.priority"
          label="Priority"
          :options="[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
          ]"
        />
        <div class="flex justify-end gap-3">
          <Button variant="secondary" @click="showCreateModal = false">
            Cancel
          </Button>
          <Button
            :disabled="!newTask.title"
            @click="createTask"
          >
            Create Task
          </Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from '@/composables/useToast';
import Card from '@/components/common/Card.vue';
import Button from '@/components/common/Button.vue';
import Input from '@/components/common/Input.vue';
import Select from '@/components/common/Select.vue';
import Badge from '@/components/common/Badge.vue';
import Table from '@/components/common/Table.vue';
import Modal from '@/components/common/Modal.vue';
import type { Task, TableColumn } from '@/types';

const toast = useToast();

const isLoading = ref(false);
const showCreateModal = ref(false);
const searchQuery = ref('');
const statusFilter = ref('all');
const priorityFilter = ref('all');

const tasks = ref<Task[]>([
  {
    id: 't1',
    title: 'Review pull request #234',
    description: 'Code review for the authentication module',
    status: 'pending',
    priority: 'high',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 't2',
    title: 'Update documentation',
    description: 'Add new API endpoints to the docs',
    status: 'in_progress',
    priority: 'medium',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 't3',
    title: 'Fix build pipeline',
    description: 'CI/CD pipeline is failing on main branch',
    status: 'completed',
    priority: 'high',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 't4',
    title: 'Optimize database queries',
    description: 'Performance improvements for user dashboard',
    status: 'pending',
    priority: 'low',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]);

const newTask = ref({
  title: '',
  description: '',
  priority: 'medium',
});

const columns: TableColumn<Task>[] = [
  { key: 'title', label: 'Task', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true, width: '100px' },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
  { key: 'created_at', label: 'Created', sortable: true, width: '120px' },
  { key: 'actions', label: '', sortable: false, width: '60px' },
];

const filteredTasks = computed(() => {
  let result = tasks.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  }
  
  if (statusFilter.value !== 'all') {
    result = result.filter(t => t.status === statusFilter.value);
  }
  
  if (priorityFilter.value !== 'all') {
    result = result.filter(t => t.priority === priorityFilter.value);
  }
  
  return result;
});

const pendingCount = computed(() => tasks.value.filter(t => t.status === 'pending').length);
const inProgressCount = computed(() => tasks.value.filter(t => t.status === 'in_progress').length);
const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length);

const priorityVariant = (priority: Task['priority']) => {
  const variants: Record<string, 'default' | 'error' | 'warning' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  };
  return variants[priority];
};

const statusVariant = (status: Task['status']) => {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    pending: 'default',
    in_progress: 'info',
    completed: 'success',
    failed: 'error',
  };
  return variants[status];
};

const formatStatus = (status: string) => {
  return status.replace('_', ' ');
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const toggleTask = (task: Task) => {
  if (task.status === 'completed') {
    task.status = 'pending';
  } else {
    task.status = 'completed';
    toast.success('Task Completed', task.title);
  }
  task.updated_at = new Date().toISOString();
};

const createTask = () => {
  const task: Task = {
    id: `t${Date.now()}`,
    title: newTask.value.title,
    description: newTask.value.description,
    status: 'pending',
    priority: newTask.value.priority as Task['priority'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  tasks.value.unshift(task);
  showCreateModal.value = false;
  newTask.value = { title: '', description: '', priority: 'medium' };
  toast.success('Task Created', 'New task has been created');
};

const deleteTask = (task: Task) => {
  if (confirm('Delete this task?')) {
    tasks.value = tasks.value.filter(t => t.id !== task.id);
    toast.success('Task Deleted');
  }
};
</script>
