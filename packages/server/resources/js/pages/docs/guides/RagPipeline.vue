<template>
  <article class="doc-content">
    <header class="doc-header">
      <h1>RAG Pipeline</h1>
      <p class="lead">
        Context retrieval augmented generation with pgvector. Share knowledge
        across Claude instances so every agent benefits from work already done.
      </p>
    </header>

    <section id="how-it-works">
      <h2>How It Works</h2>
      <p>
        The RAG pipeline turns free-text context into searchable vector
        embeddings stored in PostgreSQL via the pgvector extension. When an
        instance needs information, the server converts the query into an
        embedding and finds the most relevant chunks using cosine similarity.
      </p>
      <p>The pipeline follows four steps:</p>
      <ol>
        <li>
          <strong>Embed</strong> &mdash; The content is sent to the embedding
          model (<code>bge-small-en-v1.5</code>) which produces a 384-dimensional
          vector.
        </li>
        <li>
          <strong>Store</strong> &mdash; The vector and its source text are
          persisted in the <code>context_chunks</code> table alongside metadata
          such as the originating instance, related files, and an importance
          score.
        </li>
        <li>
          <strong>Search</strong> &mdash; At query time the same embedding model
          converts the question into a vector. An IVFFlat index on the
          <code>context_chunks</code> table returns the closest matches by
          cosine distance.
        </li>
        <li>
          <strong>Compile</strong> &mdash; The top-k results are assembled into
          a context payload that the requesting instance can consume directly.
        </li>
      </ol>
      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        If the embedding service (Ollama) is unavailable, the server falls back
        to keyword-based search so context queries never completely fail.
      </p>
    </section>

    <section id="adding-context">
      <h2>Adding Context</h2>
      <p>
        Context is added as <em>chunks</em>. Each chunk is a self-contained
        piece of knowledge &mdash; a task completion summary, an architecture
        decision, a code review note, etc. The server automatically generates
        the embedding when the chunk is created.
      </p>

      <h3>Create a Context Chunk</h3>
      <CodeTabs :tabs="addChunkTabs" />

      <CodeBlock language="json" :code="addChunkResponse" filename="Response" />

      <h3>Chunk Types</h3>
      <p>
        Use the <code>type</code> field to categorize chunks so you can filter
        them later:
      </p>
      <ul>
        <li><code>task_completion</code> &mdash; Summary produced when a task is marked done</li>
        <li><code>architecture</code> &mdash; System design decisions</li>
        <li><code>convention</code> &mdash; Coding standards and patterns</li>
        <li><code>note</code> &mdash; Ad-hoc knowledge from an instance</li>
        <li><code>file_summary</code> &mdash; Condensed description of a file or module</li>
      </ul>
    </section>

    <section id="querying">
      <h2>Querying Context</h2>
      <p>
        Send a natural-language query and the server returns the most relevant
        chunks ranked by similarity. You can control how many results are
        returned with the <code>limit</code> parameter.
      </p>

      <CodeTabs :tabs="queryTabs" />

      <CodeBlock language="json" :code="queryResponse" filename="Response" />

      <p>
        Each result includes a <code>similarity</code> score between 0 and 1.
        Values above 0.8 are usually highly relevant; below 0.5 the match is
        weak.
      </p>

      <h3>Summarizing Context</h3>
      <p>
        For a high-level overview of all project knowledge, use the summarize
        endpoint. It feeds the top chunks into the summarization model
        (<code>mistral:7b</code>) and returns a condensed summary.
      </p>

      <CodeTabs :tabs="summarizeTabs" />
    </section>

    <section id="embeddings">
      <h2>Embedding Model</h2>
      <p>
        ClaudeNest uses <strong>bge-small-en-v1.5</strong> served by Ollama for
        generating embeddings. This model produces 384-dimensional vectors and
        strikes a good balance between accuracy and speed.
      </p>
      <ul>
        <li><strong>Model:</strong> <code>bge-small-en-v1.5</code></li>
        <li><strong>Dimensions:</strong> 384</li>
        <li><strong>Distance metric:</strong> Cosine similarity</li>
        <li><strong>Index type:</strong> IVFFlat (lists = 100)</li>
        <li><strong>Served by:</strong> Ollama (<code>OLLAMA_HOST</code> env variable)</li>
      </ul>

      <p class="tip">
        <span class="tip-icon">&#128161;</span>
        Make sure Ollama is running and the embedding model is pulled before
        using RAG features:
      </p>

      <CodeBlock
        language="bash"
        code="ollama pull bge-small-en-v1.5"
        filename="Terminal"
      />

      <h3>Database Schema</h3>
      <p>
        The <code>context_chunks</code> table stores both the text content and
        its vector representation:
      </p>
      <CodeBlock language="json" :code="schemaExample" filename="context_chunks columns" />
    </section>

    <section id="next-steps">
      <h2>Next Steps</h2>
      <div class="next-steps">
        <router-link to="/docs/guides/multi-agent" class="next-step">
          <strong>Multi-Agent Coordination</strong>
          <span>See how RAG fits into the broader multi-agent workflow &#8594;</span>
        </router-link>
        <router-link to="/docs/guides/file-locking" class="next-step">
          <strong>File Locking</strong>
          <span>Prevent conflicts between agents editing the same files &#8594;</span>
        </router-link>
        <router-link to="/docs/api/projects" class="next-step">
          <strong>Context API Reference</strong>
          <span>Full endpoint documentation for context chunks and queries &#8594;</span>
        </router-link>
      </div>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';
import CodeTabs from '@/components/docs/CodeTabs.vue';

// -- Adding Context -----------------------------------------------------------

const addChunkTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/context/chunks \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "The payment module uses Stripe Elements on the frontend and creates PaymentIntents server-side. Webhooks are handled in src/webhooks.ts.",
    "type": "architecture",
    "instance_id": "inst-001",
    "files": ["src/checkout.ts", "src/stripe.ts", "src/webhooks.ts"],
    "importance_score": 0.8
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/context/chunks',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'The payment module uses Stripe Elements on the frontend and creates PaymentIntents server-side. Webhooks are handled in src/webhooks.ts.',
      type: 'architecture',
      instance_id: 'inst-001',
      files: ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts'],
      importance_score: 0.8,
    }),
  }
);
const chunk = await response.json();
console.log(chunk.data.id);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$chunk = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/context/chunks', [
        'content' => 'The payment module uses Stripe Elements on the frontend...',
        'type' => 'architecture',
        'instance_id' => 'inst-001',
        'files' => ['src/checkout.ts', 'src/stripe.ts', 'src/webhooks.ts'],
        'importance_score' => 0.8,
    ])['data'];`,
  },
]);

const addChunkResponse = ref(`{
  "success": true,
  "data": {
    "id": "660f9300-a12b-4c5d-b8e9-112233445566",
    "project_id": "550e8400-e29b-41d4-a716-446655440002",
    "content": "The payment module uses Stripe Elements on the frontend and creates PaymentIntents server-side. Webhooks are handled in src/webhooks.ts.",
    "type": "architecture",
    "instance_id": "inst-001",
    "files": ["src/checkout.ts", "src/stripe.ts", "src/webhooks.ts"],
    "importance_score": 0.8,
    "has_embedding": true,
    "expires_at": "2026-03-17T10:00:00Z",
    "created_at": "2026-02-15T10:00:00Z"
  }
}`);

// -- Querying -----------------------------------------------------------------

const queryTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/context/query \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "How are payments processed?",
    "limit": 5
  }'`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/context/query',
  {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'How are payments processed?',
      limit: 5,
    }),
  }
);
const results = await response.json();
results.data.forEach(chunk => {
  console.log(chunk.similarity, chunk.content);
});`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$results = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/context/query', [
        'query' => 'How are payments processed?',
        'limit' => 5,
    ])['data'];`,
  },
]);

const queryResponse = ref(`{
  "success": true,
  "data": [
    {
      "id": "660f9300-a12b-4c5d-b8e9-112233445566",
      "content": "The payment module uses Stripe Elements on the frontend and creates PaymentIntents server-side. Webhooks are handled in src/webhooks.ts.",
      "type": "architecture",
      "similarity": 0.94,
      "files": ["src/checkout.ts", "src/stripe.ts", "src/webhooks.ts"],
      "instance_id": "inst-001",
      "created_at": "2026-02-15T10:00:00Z"
    },
    {
      "id": "770a1200-b23c-4d6e-c9f0-223344556677",
      "content": "Implemented Stripe checkout with 3D Secure support and automatic retry on network failures.",
      "type": "task_completion",
      "similarity": 0.87,
      "files": ["src/checkout.ts"],
      "instance_id": "inst-002",
      "created_at": "2026-02-15T11:30:00Z"
    }
  ],
  "meta": {
    "query": "How are payments processed?",
    "result_count": 2,
    "used_embeddings": true
  }
}`);

// -- Summarize ----------------------------------------------------------------

const summarizeTabs = ref([
  {
    label: 'cURL',
    language: 'bash',
    code: `curl -X POST https://api.claudenest.io/api/projects/{project_id}/context/summarize \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
  },
  {
    label: 'JavaScript',
    language: 'javascript',
    code: `const response = await fetch(
  'https://api.claudenest.io/api/projects/{project_id}/context/summarize',
  {
    method: 'POST',
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
  }
);
const summary = await response.json();
console.log(summary.data.summary);`,
  },
  {
    label: 'PHP',
    language: 'php',
    code: `<?php
$summary = Http::withToken($token)
    ->post('https://api.claudenest.io/api/projects/{project_id}/context/summarize')['data'];`,
  },
]);

// -- Schema -------------------------------------------------------------------

const schemaExample = ref(`{
  "id":               "UUID (PK)",
  "project_id":       "UUID (FK -> shared_projects)",
  "content":          "TEXT — the raw text content",
  "type":             "VARCHAR(50) — chunk category",
  "embedding":        "vector(384) — bge-small-en-v1.5 output",
  "instance_id":      "VARCHAR(255) — creator instance",
  "task_id":          "UUID — related task (nullable)",
  "files":            "TEXT[] — related file paths",
  "importance_score":  "FLOAT — 0 to 1",
  "expires_at":       "TIMESTAMP — auto-cleanup date",
  "created_at":       "TIMESTAMP"
}`);
</script>

<style scoped>
.doc-content {
  max-width: 768px;
}

.doc-header {
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.doc-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem;
  background: linear-gradient(135deg, var(--accent-purple, #a855f7), var(--accent-cyan, #22d3ee));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.lead {
  font-size: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

section {
  margin-bottom: 3rem;
}

h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
  color: var(--text-primary);
}

h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 1.5rem 0 0.75rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul, ol {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

/* Tip */
.tip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: rgba(34, 211, 238, 0.1);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 10px;
  margin: 1rem 0;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip p {
  margin: 0;
  font-size: 0.95rem;
}

/* Next Steps */
.next-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.next-step {
  display: flex;
  flex-direction: column;
  padding: 1rem 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid color-mix(in srgb, var(--border-color, var(--border)) 50%, transparent);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.next-step:hover {
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border-color: color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
}

.next-step strong {
  color: var(--text-primary);
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.next-step span {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.next-step:hover span {
  color: var(--text-secondary);
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }
}
</style>
