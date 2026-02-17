<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">Concepts</span>
      <h1>RAG &amp; Embeddings</h1>
      <p class="lead">How ClaudeNest uses pgvector and embeddings for context retrieval across multi-agent projects.</p>
    </header>

    <section id="what-is-rag">
      <h2>What is RAG?</h2>
      <p>
        <strong>Retrieval-Augmented Generation</strong> (RAG) is a technique that enhances AI outputs by
        supplying relevant context at query time. Instead of relying solely on a model's training data,
        a RAG system retrieves semantically similar documents from a knowledge store and injects them
        into the prompt before generating a response.
      </p>
      <p>
        The core loop has two phases:
      </p>
      <div class="phase-grid">
        <div class="phase-card">
          <div class="phase-label ingestion">Ingestion</div>
          <h4>Index Phase</h4>
          <p>
            Documents (code snippets, decisions, summaries) are converted into dense numerical vectors
            called <strong>embeddings</strong> and stored alongside the original text in a vector database.
          </p>
        </div>
        <div class="phase-card">
          <div class="phase-label retrieval">Retrieval</div>
          <h4>Query Phase</h4>
          <p>
            An incoming query is embedded into the same vector space. The nearest stored vectors are
            retrieved by <strong>cosine similarity</strong> and returned as context chunks with relevance scores.
          </p>
        </div>
      </div>
    </section>

    <section id="why-rag-multi-agent">
      <h2>Why RAG for Multi-Agent?</h2>
      <p>
        When multiple Claude instances work on the same project simultaneously, they each have their own
        isolated context window. Without a shared knowledge store, Agent A has no awareness of the
        decisions or progress made by Agent B, leading to duplicated work, contradictory implementations,
        and wasted tokens.
      </p>
      <p>
        ClaudeNest solves this with a <strong>shared RAG context</strong> scoped to each project. Every
        agent contributing a context chunk enriches the shared pool. Every agent querying the pool
        benefits from the collective knowledge — creating a form of persistent, searchable team memory.
      </p>

      <div class="benefit-grid">
        <div class="benefit-card">
          <span class="benefit-icon">SYNC</span>
          <h4>Shared Understanding</h4>
          <p>All agents start each task with access to the same architectural decisions and conventions.</p>
        </div>
        <div class="benefit-card">
          <span class="benefit-icon">DEDUP</span>
          <h4>No Redundant Work</h4>
          <p>Before starting, an agent can query for prior completions on the same topic and avoid repeating it.</p>
        </div>
        <div class="benefit-card">
          <span class="benefit-icon">CTX</span>
          <h4>Token Efficiency</h4>
          <p>Only the most relevant chunks are injected into each agent's context, preserving the context window.</p>
        </div>
      </div>
    </section>

    <section id="embedding-model">
      <h2>Embedding Model</h2>
      <p>
        ClaudeNest uses <strong>bge-small-en-v1.5</strong> served locally via <strong>Ollama</strong> to
        generate embeddings. This model produces 384-dimensional dense vectors and strikes an excellent
        balance between retrieval quality and inference speed on commodity hardware.
      </p>

      <div class="model-card">
        <div class="model-row">
          <span class="model-key">Model</span>
          <code>bge-small-en-v1.5</code>
        </div>
        <div class="model-row">
          <span class="model-key">Provider</span>
          <code>Ollama (local)</code>
        </div>
        <div class="model-row">
          <span class="model-key">Dimensions</span>
          <code>384</code>
        </div>
        <div class="model-row">
          <span class="model-key">Similarity</span>
          <code>Cosine</code>
        </div>
        <div class="model-row">
          <span class="model-key">Config key</span>
          <code>OLLAMA_EMBEDDING_MODEL</code>
        </div>
      </div>

      <h3>Generating an Embedding</h3>
      <CodeBlock :code="embeddingGeneration" language="php" filename="app/Services/EmbeddingService.php" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Graceful Degradation</h4>
          <p>
            If Ollama is unavailable, <code>EmbeddingService::isAvailable()</code> returns
            <code>false</code> and chunks are stored without embeddings. They remain searchable
            by keyword but will not appear in vector similarity results.
          </p>
        </div>
      </div>
    </section>

    <section id="storage">
      <h2>Storage</h2>
      <p>
        Embeddings are stored directly in <strong>PostgreSQL</strong> using the
        <strong>pgvector</strong> extension. This removes the need for a separate vector database
        and keeps all project data co-located in a single durable store.
      </p>

      <h3>Schema</h3>
      <CodeBlock :code="pgvectorSchema" language="sql" filename="context_chunks table" />

      <h3>IVFFlat Index</h3>
      <p>
        An IVFFlat index enables approximate nearest-neighbor search. With <code>lists = 100</code>,
        PostgreSQL partitions the vector space into 100 clusters. At query time only the most
        promising clusters are probed, keeping latency low even at large scales.
      </p>
      <CodeBlock :code="ivfflatIndex" language="sql" filename="Vector index" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Index Tuning</h4>
          <p>
            The rule of thumb for IVFFlat is <code>lists = sqrt(total_rows)</code>. At 10 000 chunks
            use 100 lists; at 1 000 000 chunks use 1 000 lists. Rebuild the index after significant
            data growth with <code>REINDEX INDEX CONCURRENTLY idx_context_chunks_embedding</code>.
          </p>
        </div>
      </div>
    </section>

    <section id="context-chunks">
      <h2>Context Chunks</h2>
      <p>
        A <strong>context chunk</strong> is the atomic unit of shared knowledge. Each chunk captures
        a discrete piece of information produced by an agent — a decision, a summary, a code snippet —
        together with rich metadata for filtering and relevance scoring.
      </p>

      <h3>Chunk Types</h3>
      <div class="chunk-type-grid">
        <div class="chunk-type">
          <span class="chunk-badge code">code</span>
          <p>A significant code pattern, utility, or module implementation worth sharing.</p>
        </div>
        <div class="chunk-type">
          <span class="chunk-badge decision">decision</span>
          <p>An architectural or design decision with its rationale (e.g., "chose Redis over DB for sessions").</p>
        </div>
        <div class="chunk-type">
          <span class="chunk-badge summary">summary</span>
          <p>A high-level summary of a completed task or a session's work, often auto-generated.</p>
        </div>
        <div class="chunk-type">
          <span class="chunk-badge note">note</span>
          <p>A free-form observation, warning, or clarification that doesn't fit other types.</p>
        </div>
      </div>

      <h3>Chunk Metadata</h3>
      <CodeBlock :code="chunkMetadata" language="php" filename="Chunk fields" />
    </section>

    <section id="ingestion-pipeline">
      <h2>Ingestion Pipeline</h2>
      <p>
        When an agent produces new context it sends it to the server via the chunks API. The server
        generates an embedding and persists both the text and the vector atomically.
      </p>

      <h3>Step 1 — Agent sends a chunk</h3>
      <CodeBlock :code="ingestionRequest" language="bash" filename="POST /api/projects/{id}/context/chunks" />

      <h3>Step 2 — Server embeds and stores</h3>
      <CodeBlock :code="ingestionService" language="php" filename="app/Services/ContextRAGService.php" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Async Embedding</h4>
          <p>
            Embedding generation is dispatched as a queued job so the HTTP response is returned
            immediately. The chunk appears in vector search results once the job completes
            (typically under 200 ms on local Ollama).
          </p>
        </div>
      </div>
    </section>

    <section id="query-pipeline">
      <h2>Query Pipeline</h2>
      <p>
        Agents retrieve context by sending a natural language query. The server embeds the query
        text and runs a cosine similarity search, returning the top-k most semantically relevant chunks.
      </p>

      <h3>Step 1 — Agent sends a query</h3>
      <CodeBlock :code="queryRequest" language="bash" filename="POST /api/projects/{id}/context/query" />

      <h3>Step 2 — Server searches by similarity</h3>
      <CodeBlock :code="queryService" language="php" filename="ContextChunk::findSimilar()" />

      <h3>Step 3 — Response with relevance scores</h3>
      <CodeBlock :code="queryResponse" language="json" filename="Query response" />
    </section>

    <section id="summarization">
      <h2>Summarization</h2>
      <p>
        Over time a project accumulates many small context chunks. To keep retrieval efficient and
        avoid token bloat, ClaudeNest periodically <strong>summarizes</strong> clusters of related
        chunks into a single higher-level chunk using <strong>Mistral 7B</strong> via Ollama.
      </p>

      <CodeBlock :code="summarizationCode" language="php" filename="app/Services/SummarizationService.php" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>Triggering Summarization</h4>
          <p>
            Summarization can be triggered manually via
            <code>POST /api/projects/{id}/context/summarize</code> or automatically when the
            project's <code>total_tokens</code> exceeds the configured threshold in
            <code>config/claudenest.php</code>.
          </p>
        </div>
      </div>
    </section>

    <section id="expiration">
      <h2>Expiration</h2>
      <p>
        Every context chunk carries an <code>expires_at</code> timestamp. Chunks that outlive their
        usefulness are automatically excluded from search results and periodically pruned by a
        scheduled artisan command.
      </p>

      <h3>Default TTL</h3>
      <p>
        The default time-to-live is <strong>30 days</strong>. High-importance chunks (scores above
        <code>0.8</code>) can be pinned by setting <code>expires_at</code> far in the future, while
        transient operational notes should use shorter TTLs (1–7 days).
      </p>

      <CodeBlock :code="expirationCode" language="php" filename="Expiration examples" />

      <h3>Cleanup Command</h3>
      <CodeBlock :code="cleanupCommand" language="bash" filename="Artisan cleanup" />
    </section>

    <section id="performance">
      <h2>Performance</h2>
      <p>
        The following table summarises the latency targets and operational guidelines for the RAG
        subsystem in a standard ClaudeNest deployment.
      </p>

      <div class="perf-table">
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>Target Latency</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Embedding generation</td>
              <td><code>&lt; 100 ms</code></td>
              <td>bge-small-en-v1.5 on CPU (Ollama)</td>
            </tr>
            <tr>
              <td>Vector similarity search</td>
              <td><code>&lt; 20 ms</code></td>
              <td>IVFFlat index, up to 100 k chunks</td>
            </tr>
            <tr>
              <td>Chunk ingestion (end-to-end)</td>
              <td><code>&lt; 150 ms</code></td>
              <td>HTTP response before async embed job</td>
            </tr>
            <tr>
              <td>Context query (end-to-end)</td>
              <td><code>&lt; 250 ms</code></td>
              <td>Embed + search + serialization</td>
            </tr>
            <tr>
              <td>Summarization (Mistral 7B)</td>
              <td><code>2 – 8 s</code></td>
              <td>Runs as background job, not blocking</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Scaling Recommendations</h3>
      <ul>
        <li>Run Ollama on a machine with at least 8 GB RAM for bge-small-en-v1.5.</li>
        <li>Increase <code>lists</code> on the IVFFlat index proportionally to row count.</li>
        <li>Use <code>probes</code> query-time hint to trade accuracy for speed: <code>SET LOCAL ivfflat.probes = 10</code>.</li>
        <li>Enable <code>pgvector</code> parallel workers: <code>SET max_parallel_workers_per_gather = 4</code>.</li>
        <li>Schedule periodic <code>VACUUM ANALYZE context_chunks</code> to keep planner statistics fresh.</li>
      </ul>
    </section>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import CodeBlock from '@/components/docs/CodeBlock.vue';

const embeddingGeneration = ref(`namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;
use Illuminate\\Support\\Facades\\Log;

class EmbeddingService
{
    private string $ollamaHost;
    private string $model;

    public function __construct()
    {
        $this->ollamaHost = config('claudenest.ollama.host', 'http://localhost:11434');
        $this->model      = config('claudenest.ollama.embedding_model', 'bge-small-en-v1.5');
    }

    /**
     * Returns true when the Ollama service is reachable.
     */
    public function isAvailable(): bool
    {
        try {
            return Http::timeout(2)->get($this->ollamaHost . '/api/tags')->ok();
        } catch (\\Throwable) {
            return false;
        }
    }

    /**
     * Generate a 384-dimensional embedding vector for the given text.
     *
     * @return float[]
     */
    public function generate(string $text): array
    {
        $response = Http::post($this->ollamaHost . '/api/embeddings', [
            'model'  => $this->model,
            'prompt' => $text,
        ]);

        return $response->json('embedding');
    }
}`);

const pgvectorSchema = ref(`-- Enable the pgvector extension (once per database)
CREATE EXTENSION IF NOT EXISTS vector;

-- Context chunks table with 384-dimensional embeddings
CREATE TABLE context_chunks (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id       UUID        NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    content          TEXT        NOT NULL,
    type             VARCHAR(50) NOT NULL DEFAULT 'note',   -- code | decision | summary | note
    embedding        vector(384),                            -- NULL when Ollama unavailable
    instance_id      VARCHAR(255),                          -- which Claude instance produced this
    task_id          UUID        REFERENCES shared_tasks(id) ON DELETE SET NULL,
    files            TEXT[]      NOT NULL DEFAULT '{}',     -- files referenced by this chunk
    importance_score FLOAT       NOT NULL DEFAULT 0.5,      -- 0.0 – 1.0
    expires_at       TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standard indexes
CREATE INDEX idx_context_chunks_project_id  ON context_chunks(project_id);
CREATE INDEX idx_context_chunks_type        ON context_chunks(project_id, type);
CREATE INDEX idx_context_chunks_expires_at  ON context_chunks(expires_at)
    WHERE expires_at IS NOT NULL;`);

const ivfflatIndex = ref(`-- IVFFlat index for approximate nearest-neighbor cosine search.
-- lists = 100 is suitable for up to ~100 000 rows (rule: sqrt(total_rows)).
-- Rebuild when the chunk count grows significantly.
CREATE INDEX idx_context_chunks_embedding ON context_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- At query time, control the accuracy/speed trade-off via the probes setting.
-- Higher probes = more accurate but slower. Default is 1.
SET LOCAL ivfflat.probes = 10;

SELECT id, content, 1 - (embedding <=> query_vec) AS similarity
FROM   context_chunks
WHERE  project_id = $1
  AND  expires_at > NOW()
ORDER  BY embedding <=> query_vec
LIMIT  10;`);

const chunkMetadata = ref(`// Fields available on every ContextChunk model
[
    'id'               => '018f2e4b-...',        // UUID primary key
    'project_id'       => '018f2e4a-...',        // Parent SharedProject

    // Content
    'content'          => 'Auth middleware now validates JWT expiry…',
    'type'             => 'decision',            // code | decision | summary | note

    // Attribution
    'instance_id'      => 'claude-instance-7f3a', // which agent wrote this
    'task_id'          => '018f2e4c-...',          // optional: related SharedTask

    // File linkage
    'files'            => [
        'app/Http/Middleware/Authenticate.php',
        'config/auth.php',
    ],

    // Relevance signals
    'importance_score' => 0.85,  // 0.0 (trivial) – 1.0 (critical)

    // Lifecycle
    'expires_at'       => '2026-03-17T00:00:00Z', // default: +30 days
    'created_at'       => '2026-02-17T10:23:00Z',
]`);

const ingestionRequest = ref(`# An agent registers a context chunk after completing a task
curl -X POST https://claudenest.example.com/api/projects/018f2e4a-.../context/chunks \\
  -H 'Authorization: Bearer mn_...' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "content": "Refactored auth module to use middleware pattern. JWT validation is now centralised in App\\\\Http\\\\Middleware\\\\Authenticate.php.",
    "type": "decision",
    "instance_id": "claude-instance-7f3a",
    "task_id": "018f2e4c-...",
    "files": [
      "app/Http/Middleware/Authenticate.php",
      "config/auth.php"
    ],
    "importance_score": 0.85,
    "expires_at": "2026-05-17T00:00:00Z"
  }'

# Response
{
  "success": true,
  "data": {
    "id": "018f2e4d-...",
    "project_id": "018f2e4a-...",
    "type": "decision",
    "importance_score": 0.85,
    "embedding_status": "pending",
    "expires_at": "2026-05-17T00:00:00Z",
    "created_at": "2026-02-17T10:23:00Z"
  }
}`);

const ingestionService = ref(`namespace App\\Services;

use App\\Models\\ContextChunk;
use App\\Models\\SharedProject;

class ContextRAGService
{
    public function __construct(
        private EmbeddingService $embeddingService,
    ) {}

    /**
     * Persist a new context chunk and schedule async embedding.
     */
    public function addContext(
        SharedProject $project,
        string        $content,
        string        $type,
        array         $metadata = []
    ): ContextChunk {
        $chunk = ContextChunk::create([
            'project_id'       => $project->id,
            'content'          => $content,
            'type'             => $type,
            'instance_id'      => $metadata['instance_id'] ?? null,
            'task_id'          => $metadata['task_id']      ?? null,
            'files'            => $metadata['files']        ?? [],
            'importance_score' => $metadata['importance_score'] ?? 0.5,
            'expires_at'       => $metadata['expires_at']
                                    ?? now()->addDays(30),
        ]);

        // Dispatch async job — HTTP response is returned immediately.
        if ($this->embeddingService->isAvailable()) {
            \\App\\Jobs\\GenerateChunkEmbedding::dispatch($chunk);
        }

        return $chunk;
    }
}`);

const queryRequest = ref(`# An agent queries for context relevant to its current task
curl -X POST https://claudenest.example.com/api/projects/018f2e4a-.../context/query \\
  -H 'Authorization: Bearer mn_...' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "How is authentication handled in this project?",
    "limit": 5,
    "types": ["decision", "code"],
    "min_importance": 0.4
  }'`);

const queryService = ref(`namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Collection;

class ContextChunk extends Model
{
    /**
     * Find the top-k chunks most similar to the given embedding vector.
     *
     * @param  float[]  $embedding  384-dimensional query vector
     * @return Collection<ContextChunk>
     */
    public static function findSimilar(
        string $projectId,
        array  $embedding,
        int    $limit = 10,
        array  $types = [],
        float  $minImportance = 0.0
    ): Collection {
        $vectorLiteral = '[' . implode(',', $embedding) . ']';

        return static::query()
            ->select(['id', 'content', 'type', 'files', 'instance_id', 'importance_score',
                       \\DB::raw("1 - (embedding <=> '{$vectorLiteral}'::vector) AS similarity")])
            ->where('project_id', $projectId)
            ->where('expires_at', '>', now())
            ->whereNotNull('embedding')
            ->when(count($types), fn ($q) => $q->whereIn('type', $types))
            ->when($minImportance > 0, fn ($q) => $q->where('importance_score', '>=', $minImportance))
            ->orderByRaw("embedding <=> '{$vectorLiteral}'::vector")
            ->limit($limit)
            ->get();
    }
}`);

const queryResponse = ref(`{
  "success": true,
  "data": {
    "query": "How is authentication handled in this project?",
    "chunks": [
      {
        "id": "018f2e4d-...",
        "content": "Refactored auth module to use middleware pattern. JWT validation is now centralised in App\\\\Http\\\\Middleware\\\\Authenticate.php.",
        "type": "decision",
        "similarity": 0.921,
        "importance_score": 0.85,
        "files": ["app/Http/Middleware/Authenticate.php", "config/auth.php"],
        "instance_id": "claude-instance-7f3a",
        "created_at": "2026-02-17T10:23:00Z"
      },
      {
        "id": "018f2e3c-...",
        "content": "All API routes behind auth:sanctum middleware. Machine routes use a separate token-hash check.",
        "type": "code",
        "similarity": 0.874,
        "importance_score": 0.70,
        "files": ["routes/api.php"],
        "instance_id": "claude-instance-2b1d",
        "created_at": "2026-02-15T08:11:00Z"
      }
    ],
    "meta": {
      "total_results": 2,
      "query_embedding_dims": 384,
      "timestamp": "2026-02-17T10:25:00Z"
    }
  }
}`);

const summarizationCode = ref(`namespace App\\Services;

use App\\Models\\ContextChunk;
use App\\Models\\SharedProject;
use Illuminate\\Support\\Facades\\Http;

class SummarizationService
{
    private string $ollamaHost;
    private string $model;

    public function __construct()
    {
        $this->ollamaHost = config('claudenest.ollama.host', 'http://localhost:11434');
        $this->model      = config('claudenest.ollama.summarization_model', 'mistral:7b');
    }

    /**
     * Summarize a collection of chunks into a single high-level chunk
     * and persist it as a 'summary' type with elevated importance.
     */
    public function summarizeChunks(
        SharedProject $project,
        iterable      $chunks,
        ContextRAGService $ragService
    ): ContextChunk {
        $combined = collect($chunks)
            ->pluck('content')
            ->implode("\\n\\n---\\n\\n");

        $prompt = <<<PROMPT
        Summarize the following context chunks from a software project into a concise,
        developer-friendly paragraph. Preserve key decisions, file names, and rationale.

        {$combined}
        PROMPT;

        $response = Http::post($this->ollamaHost . '/api/generate', [
            'model'  => $this->model,
            'prompt' => $prompt,
            'stream' => false,
        ]);

        $summary = $response->json('response');

        return $ragService->addContext($project, $summary, 'summary', [
            'importance_score' => 0.9,
            'expires_at'       => now()->addDays(60),
        ]);
    }
}`);

const expirationCode = ref(`use App\\Models\\ContextChunk;

// Default: expires in 30 days (set by DB default and service layer)
$chunk = ContextChunk::create([
    'project_id' => $project->id,
    'content'    => 'Temporary debugging note about queue workers.',
    'type'       => 'note',
    'expires_at' => now()->addDays(3),   // short-lived operational note
]);

// Pin a critical architectural decision indefinitely
$pinnedChunk = ContextChunk::create([
    'project_id'       => $project->id,
    'content'          => 'We use UUIDs for all primary keys — never auto-increment integers.',
    'type'             => 'decision',
    'importance_score' => 1.0,
    'expires_at'       => now()->addYears(10),  // effectively permanent
]);

// Extend expiry on an existing chunk
$chunk->update(['expires_at' => now()->addDays(30)]);

// Query excludes expired chunks automatically
$active = ContextChunk::where('project_id', $projectId)
    ->where('expires_at', '>', now())
    ->get();`);

const cleanupCommand = ref(`# Prune all expired context chunks across all projects
php artisan claudenest:prune-context

# Prune chunks older than a specific date (override TTL)
php artisan claudenest:prune-context --before="2026-01-01"

# Dry-run: shows how many chunks would be deleted without removing them
php artisan claudenest:prune-context --dry-run

# Schedule in the Artisan console kernel (runs nightly at 02:00)
# app/Console/Kernel.php
$schedule->command('claudenest:prune-context')->dailyAt('02:00');`);
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

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 30%, transparent);
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
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

h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--text-primary);
}

p {
  color: var(--text-secondary);
  line-height: 1.7;
  margin: 0 0 1rem;
}

ul {
  color: var(--text-secondary);
  margin: 0 0 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

strong {
  color: var(--text-primary);
}

a {
  color: var(--accent-purple, #a855f7);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9em;
  background: var(--border-color, var(--border));
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  color: var(--accent-cyan, #22d3ee);
}

/* Phase Grid */
.phase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
}

.phase-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
}

.phase-label {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

.phase-label.ingestion {
  background: color-mix(in srgb, #6366f1 15%, transparent);
  color: #6366f1;
}

.phase-label.retrieval {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

.phase-card h4 {
  margin: 0 0 0.5rem;
}

.phase-card p {
  margin: 0;
  font-size: 0.9rem;
}

/* Benefit Grid */
.benefit-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.benefit-card {
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  text-align: center;
}

.benefit-icon {
  display: inline-block;
  padding: 0.3rem 0.6rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 15%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.benefit-card h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.benefit-card p {
  margin: 0;
  font-size: 0.85rem;
}

/* Model Card */
.model-card {
  margin: 1.25rem 0;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 12px;
  overflow: hidden;
}

.model-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border-color, var(--border));
}

.model-row:last-child {
  border-bottom: none;
}

.model-key {
  width: 140px;
  flex-shrink: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Chunk Type Grid */
.chunk-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0;
}

.chunk-type {
  padding: 1rem;
  background: color-mix(in srgb, var(--text-primary) 2%, transparent);
  border: 1px solid var(--border-color, var(--border));
  border-radius: 10px;
}

.chunk-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  margin-bottom: 0.6rem;
}

.chunk-badge.code {
  background: color-mix(in srgb, #22c55e 15%, transparent);
  color: #22c55e;
}

.chunk-badge.decision {
  background: color-mix(in srgb, #6366f1 15%, transparent);
  color: #6366f1;
}

.chunk-badge.summary {
  background: color-mix(in srgb, var(--accent-cyan, #22d3ee) 15%, transparent);
  color: var(--accent-cyan, #22d3ee);
}

.chunk-badge.note {
  background: color-mix(in srgb, #fbbf24 15%, transparent);
  color: #fbbf24;
}

.chunk-type p {
  margin: 0;
  font-size: 0.85rem;
}

/* Tip Box */
.tip {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  border-radius: 12px;
  margin: 1.5rem 0;
}

.tip-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent-purple, #a855f7) 20%, transparent);
  color: var(--accent-purple, #a855f7);
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.tip h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
}

.tip p {
  margin: 0;
  font-size: 0.9rem;
}

/* Performance Table */
.perf-table {
  margin: 1.5rem 0;
  overflow-x: auto;
}

.perf-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.perf-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  background: color-mix(in srgb, var(--text-primary) 4%, transparent);
  border-bottom: 2px solid var(--border-color, var(--border));
  color: var(--text-primary);
  font-weight: 600;
}

.perf-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color, var(--border));
  color: var(--text-secondary);
  vertical-align: top;
}

.perf-table tr:last-child td {
  border-bottom: none;
}

@media (max-width: 768px) {
  .doc-header h1 {
    font-size: 2rem;
  }

  .phase-grid {
    grid-template-columns: 1fr;
  }

  .benefit-grid {
    grid-template-columns: 1fr;
  }

  .chunk-type-grid {
    grid-template-columns: 1fr 1fr;
  }

  .model-key {
    width: 110px;
  }
}

@media (max-width: 480px) {
  .chunk-type-grid {
    grid-template-columns: 1fr;
  }
}
</style>
