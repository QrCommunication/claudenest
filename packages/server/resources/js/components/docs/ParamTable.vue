<template>
  <div class="param-table-wrapper">
    <table class="param-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th v-if="showRequired">Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="param in params" :key="param.name">
          <td class="param-name">
            <code>{{ param.name }}</code>
          </td>
          <td class="param-type">
            <span class="type-badge" :class="getTypeClass(param.type)">
              {{ param.type }}
            </span>
          </td>
          <td v-if="showRequired" class="param-required">
            <span v-if="param.required" class="required-badge">Required</span>
            <span v-else class="optional-badge">Optional</span>
          </td>
          <td class="param-description">
            {{ param.description }}
            <span v-if="param.default !== undefined" class="default-value">
              Default: <code>{{ formatDefault(param.default) }}</code>
            </span>
            <span v-if="param.enum" class="enum-values">
              Values: {{ param.enum.join(', ') }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
interface Param {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  default?: any;
  enum?: string[];
}

interface Props {
  params: Param[];
  showRequired?: boolean;
}

withDefaults(defineProps<Props>(), {
  showRequired: true,
});

const getTypeClass = (type: string): string => {
  const typeClasses: Record<string, string> = {
    'string': 'type-string',
    'integer': 'type-number',
    'number': 'type-number',
    'boolean': 'type-boolean',
    'array': 'type-array',
    'object': 'type-object',
    'uuid': 'type-uuid',
    'enum': 'type-enum',
  };
  
  // Handle array types like "string[]"
  if (type.endsWith('[]')) {
    return 'type-array';
  }
  
  return typeClasses[type] || 'type-default';
};

const formatDefault = (value: any): string => {
  if (value === null) return 'null';
  if (value === true) return 'true';
  if (value === false) return 'false';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
</script>

<style scoped>
.param-table-wrapper {
  overflow-x: auto;
  margin: 1rem 0;
  border-radius: 8px;
  border: 1px solid var(--border-color, var(--border));
}

.param-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.param-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 3%, transparent);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.param-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid color-mix(in srgb, var(--text-primary) 5%, transparent);
  vertical-align: top;
}

.param-table tr:last-child td {
  border-bottom: none;
}

.param-table tr:hover td {
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
}

.param-name code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: var(--accent-cyan-light, #7dd3fc);
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 10%, transparent);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}

.param-type {
  white-space: nowrap;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

.type-string {
  background: color-mix(in srgb, var(--status-success, #22c55e) 15%, transparent);
  color: var(--status-success-light, #4ade80);
}

.type-number {
  background: color-mix(in srgb, var(--status-warning, #f59e0b) 15%, transparent);
  color: var(--status-warning-light, #fbbf24);
}

.type-boolean {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple-light, #c084fc);
}

.type-array {
  background: color-mix(in srgb, var(--accent-blue, #3b82f6) 15%, transparent);
  color: var(--accent-blue-light, #60a5fa);
}

.type-object {
  background: color-mix(in srgb, var(--accent-pink, #ec4899) 15%, transparent);
  color: var(--accent-pink-light, #f472b6);
}

.type-uuid {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

.type-enum {
  background: color-mix(in srgb, var(--status-warning, #f59e0b) 15%, transparent);
  color: var(--status-warning-light, #fbbf24);
}

.type-default {
  background: color-mix(in srgb, var(--text-muted) 15%, transparent);
  color: var(--text-muted);
}

.required-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: color-mix(in srgb, var(--status-error, #ef4444) 15%, transparent);
  color: var(--status-error-light, #f87171);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.optional-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: color-mix(in srgb, var(--text-muted) 15%, transparent);
  color: var(--text-muted);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.param-description {
  color: var(--text-secondary);
  line-height: 1.5;
}

.default-value {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.default-value code {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
  background: color-mix(in srgb, var(--text-primary) 5%, transparent);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.enum-values {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .param-table th,
  .param-table td {
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
