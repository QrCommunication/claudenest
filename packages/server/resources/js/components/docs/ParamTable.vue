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
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.param-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.param-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.param-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: top;
}

.param-table tr:last-child td {
  border-bottom: none;
}

.param-table tr:hover td {
  background: rgba(255, 255, 255, 0.02);
}

.param-name code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  color: #7dd3fc;
  background: rgba(125, 211, 252, 0.1);
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
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.type-number {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.type-boolean {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.type-array {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}

.type-object {
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
}

.type-uuid {
  background: rgba(34, 211, 238, 0.15);
  color: #22d3ee;
}

.type-enum {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.type-default {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.required-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.optional-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
}

.param-description {
  color: #cbd5e1;
  line-height: 1.5;
}

.default-value {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #64748b;
}

.default-value code {
  font-family: 'JetBrains Mono', monospace;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.enum-values {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #64748b;
}

@media (max-width: 640px) {
  .param-table th,
  .param-table td {
    padding: 0.6rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
