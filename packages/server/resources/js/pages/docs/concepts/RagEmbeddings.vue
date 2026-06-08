<template>
  <article class="doc-content">
    <header class="doc-header">
      <span class="badge">{{ $t('docDocsConceptsRagembeddings.badge') }}</span>
      <h1>RAG &amp; Embeddings</h1>
      <p class="lead">{{ $t('docDocsConceptsRagembeddings.lead') }}</p>
    </header>

    <section id="what-is-rag">
      <h2>{{ $t('docDocsConceptsRagembeddings.whatIsRagTitle') }}</h2>
      <p>
        <strong>{{ $t('docDocsConceptsRagembeddings.ragTerm') }}</strong> {{ $t('docDocsConceptsRagembeddings.whatIsRagPara1') }}
      </p>
      <p>
        {{ $t('docDocsConceptsRagembeddings.coreLoopIntro') }}
      </p>
      <div class="phase-grid">
        <div class="phase-card">
          <div class="phase-label ingestion">{{ $t('docDocsConceptsRagembeddings.ingestionLabel') }}</div>
          <h4>{{ $t('docDocsConceptsRagembeddings.indexPhaseTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsRagembeddings.indexPhasePara1') }}<strong>{{ $t('docDocsConceptsRagembeddings.embeddingsWord') }}</strong>{{ $t('docDocsConceptsRagembeddings.indexPhasePara2') }}
          </p>
        </div>
        <div class="phase-card">
          <div class="phase-label retrieval">{{ $t('docDocsConceptsRagembeddings.retrievalLabel') }}</div>
          <h4>{{ $t('docDocsConceptsRagembeddings.queryPhaseTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsRagembeddings.queryPhasePara1') }}<strong>{{ $t('docDocsConceptsRagembeddings.cosineSimilarityWord') }}</strong>{{ $t('docDocsConceptsRagembeddings.queryPhasePara2') }}
          </p>
        </div>
      </div>
    </section>

    <section id="why-rag-multi-agent">
      <h2>{{ $t('docDocsConceptsRagembeddings.whyRagTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.whyRagPara1') }}
      </p>
      <p>
        {{ $t('docDocsConceptsRagembeddings.whyRagPara2a') }}<strong>{{ $t('docDocsConceptsRagembeddings.sharedRagContextWord') }}</strong>{{ $t('docDocsConceptsRagembeddings.whyRagPara2b') }}
      </p>

      <div class="benefit-grid">
        <div class="benefit-card">
          <span class="benefit-icon">SYNC</span>
          <h4>{{ $t('docDocsConceptsRagembeddings.benefitSharedTitle') }}</h4>
          <p>{{ $t('docDocsConceptsRagembeddings.benefitSharedDesc') }}</p>
        </div>
        <div class="benefit-card">
          <span class="benefit-icon">DEDUP</span>
          <h4>{{ $t('docDocsConceptsRagembeddings.benefitDedupTitle') }}</h4>
          <p>{{ $t('docDocsConceptsRagembeddings.benefitDedupDesc') }}</p>
        </div>
        <div class="benefit-card">
          <span class="benefit-icon">CTX</span>
          <h4>{{ $t('docDocsConceptsRagembeddings.benefitTokenTitle') }}</h4>
          <p>{{ $t('docDocsConceptsRagembeddings.benefitTokenDesc') }}</p>
        </div>
      </div>
    </section>

    <section id="embedding-model">
      <h2>{{ $t('docDocsConceptsRagembeddings.embeddingModelTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.embeddingModelPara1a') }}<strong>bge-small-en-v1.5</strong>{{ $t('docDocsConceptsRagembeddings.embeddingModelPara1b') }}<strong>Ollama</strong>{{ $t('docDocsConceptsRagembeddings.embeddingModelPara1c') }}
      </p>

      <div class="model-card">
        <div class="model-row">
          <span class="model-key">{{ $t('docDocsConceptsRagembeddings.modelKeyModel') }}</span>
          <code>bge-small-en-v1.5</code>
        </div>
        <div class="model-row">
          <span class="model-key">{{ $t('docDocsConceptsRagembeddings.modelKeyProvider') }}</span>
          <code>Ollama (local)</code>
        </div>
        <div class="model-row">
          <span class="model-key">{{ $t('docDocsConceptsRagembeddings.modelKeyDimensions') }}</span>
          <code>384</code>
        </div>
        <div class="model-row">
          <span class="model-key">{{ $t('docDocsConceptsRagembeddings.modelKeySimilarity') }}</span>
          <code>Cosine</code>
        </div>
        <div class="model-row">
          <span class="model-key">{{ $t('docDocsConceptsRagembeddings.modelKeyConfigKey') }}</span>
          <code>OLLAMA_EMBEDDING_MODEL</code>
        </div>
      </div>

      <h3>{{ $t('docDocsConceptsRagembeddings.generatingEmbeddingTitle') }}</h3>
      <CodeBlock :code="embeddingGeneration" language="php" filename="app/Services/EmbeddingService.php" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsRagembeddings.gracefulDegradationTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsRagembeddings.gracefulDegradationPara1a') }}<code>EmbeddingService::isAvailable()</code>{{ $t('docDocsConceptsRagembeddings.gracefulDegradationPara1b') }}<code>false</code>{{ $t('docDocsConceptsRagembeddings.gracefulDegradationPara1c') }}
          </p>
        </div>
      </div>
    </section>

    <section id="storage">
      <h2>{{ $t('docDocsConceptsRagembeddings.storageTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.storagePara1a') }}<strong>PostgreSQL</strong>{{ $t('docDocsConceptsRagembeddings.storagePara1b') }}<strong>pgvector</strong>{{ $t('docDocsConceptsRagembeddings.storagePara1c') }}
      </p>

      <h3>{{ $t('docDocsConceptsRagembeddings.schemaTitle') }}</h3>
      <CodeBlock :code="pgvectorSchema" language="sql" filename="context_chunks table" />

      <h3>{{ $t('docDocsConceptsRagembeddings.ivfflatIndexTitle') }}</h3>
      <p>
        {{ $t('docDocsConceptsRagembeddings.ivfflatPara1a') }}<code>lists = 100</code>{{ $t('docDocsConceptsRagembeddings.ivfflatPara1b') }}
      </p>
      <CodeBlock :code="ivfflatIndex" language="sql" filename="Vector index" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsRagembeddings.indexTuningTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsRagembeddings.indexTuningPara1a') }}<code>lists = sqrt(total_rows)</code>{{ $t('docDocsConceptsRagembeddings.indexTuningPara1b') }}<code>REINDEX INDEX CONCURRENTLY idx_context_chunks_embedding</code>.
          </p>
        </div>
      </div>
    </section>

    <section id="context-chunks">
      <h2>{{ $t('docDocsConceptsRagembeddings.contextChunksTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.contextChunksPara1a') }}<strong>{{ $t('docDocsConceptsRagembeddings.contextChunkWord') }}</strong>{{ $t('docDocsConceptsRagembeddings.contextChunksPara1b') }}
      </p>

      <h3>{{ $t('docDocsConceptsRagembeddings.chunkTypesTitle') }}</h3>
      <div class="chunk-type-grid">
        <div class="chunk-type">
          <span class="chunk-badge code">code</span>
          <p>{{ $t('docDocsConceptsRagembeddings.chunkTypeCode') }}</p>
        </div>
        <div class="chunk-type">
          <span class="chunk-badge decision">decision</span>
          <p>{{ $t('docDocsConceptsRagembeddings.chunkTypeDecision') }}</p>
        </div>
        <div class="chunk-type">
          <span class="chunk-badge summary">summary</span>
          <p>{{ $t('docDocsConceptsRagembeddings.chunkTypeSummary') }}</p>
        </div>
        <div class="chunk-type">
          <span class="chunk-badge note">note</span>
          <p>{{ $t('docDocsConceptsRagembeddings.chunkTypeNote') }}</p>
        </div>
      </div>

      <h3>{{ $t('docDocsConceptsRagembeddings.chunkMetadataTitle') }}</h3>
      <CodeBlock :code="chunkMetadata" language="php" filename="Chunk fields" />
    </section>

    <section id="ingestion-pipeline">
      <h2>{{ $t('docDocsConceptsRagembeddings.ingestionPipelineTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.ingestionPipelinePara1') }}
      </p>

      <h3>{{ $t('docDocsConceptsRagembeddings.ingestionStep1Title') }}</h3>
      <CodeBlock :code="ingestionRequest" language="bash" filename="POST /api/projects/{id}/context/chunks" />

      <h3>{{ $t('docDocsConceptsRagembeddings.ingestionStep2Title') }}</h3>
      <CodeBlock :code="ingestionService" language="php" filename="app/Services/ContextRAGService.php" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsRagembeddings.asyncEmbeddingTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsRagembeddings.asyncEmbeddingPara1') }}
          </p>
        </div>
      </div>
    </section>

    <section id="query-pipeline">
      <h2>{{ $t('docDocsConceptsRagembeddings.queryPipelineTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.queryPipelinePara1') }}
      </p>

      <h3>{{ $t('docDocsConceptsRagembeddings.queryStep1Title') }}</h3>
      <CodeBlock :code="queryRequest" language="bash" filename="POST /api/projects/{id}/context/query" />

      <h3>{{ $t('docDocsConceptsRagembeddings.queryStep2Title') }}</h3>
      <CodeBlock :code="queryService" language="php" filename="ContextChunk::findSimilar()" />

      <h3>{{ $t('docDocsConceptsRagembeddings.queryStep3Title') }}</h3>
      <CodeBlock :code="queryResponse" language="json" filename="Query response" />
    </section>

    <section id="summarization">
      <h2>{{ $t('docDocsConceptsRagembeddings.summarizationTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.summarizationPara1a') }}<strong>{{ $t('docDocsConceptsRagembeddings.summarizesWord') }}</strong>{{ $t('docDocsConceptsRagembeddings.summarizationPara1b') }}<strong>Mistral 7B</strong>{{ $t('docDocsConceptsRagembeddings.summarizationPara1c') }}
      </p>

      <CodeBlock :code="summarizationCode" language="php" filename="app/Services/SummarizationService.php" />

      <div class="tip">
        <span class="tip-icon">i</span>
        <div>
          <h4>{{ $t('docDocsConceptsRagembeddings.triggeringSummarizationTitle') }}</h4>
          <p>
            {{ $t('docDocsConceptsRagembeddings.triggeringSummarizationPara1a') }}<code>POST /api/projects/{id}/context/summarize</code>{{ $t('docDocsConceptsRagembeddings.triggeringSummarizationPara1b') }}<code>total_tokens</code>{{ $t('docDocsConceptsRagembeddings.triggeringSummarizationPara1c') }}<code>config/claudenest.php</code>.
          </p>
        </div>
      </div>
    </section>

    <section id="expiration">
      <h2>{{ $t('docDocsConceptsRagembeddings.expirationTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.expirationPara1a') }}<code>expires_at</code>{{ $t('docDocsConceptsRagembeddings.expirationPara1b') }}
      </p>

      <h3>{{ $t('docDocsConceptsRagembeddings.defaultTtlTitle') }}</h3>
      <p>
        {{ $t('docDocsConceptsRagembeddings.defaultTtlPara1a') }}<strong>{{ $t('docDocsConceptsRagembeddings.thirtyDaysWord') }}</strong>{{ $t('docDocsConceptsRagembeddings.defaultTtlPara1b') }}<code>0.8</code>{{ $t('docDocsConceptsRagembeddings.defaultTtlPara1c') }}<code>expires_at</code>{{ $t('docDocsConceptsRagembeddings.defaultTtlPara1d') }}
      </p>

      <CodeBlock :code="expirationCode" language="php" filename="Expiration examples" />

      <h3>{{ $t('docDocsConceptsRagembeddings.cleanupCommandTitle') }}</h3>
      <CodeBlock :code="cleanupCommand" language="bash" filename="Artisan cleanup" />
    </section>

    <section id="performance">
      <h2>{{ $t('docDocsConceptsRagembeddings.performanceTitle') }}</h2>
      <p>
        {{ $t('docDocsConceptsRagembeddings.performancePara1') }}
      </p>

      <div class="perf-table">
        <table>
          <thead>
            <tr>
              <th>{{ $t('docDocsConceptsRagembeddings.thOperation') }}</th>
              <th>{{ $t('docDocsConceptsRagembeddings.thTargetLatency') }}</th>
              <th>{{ $t('docDocsConceptsRagembeddings.thNotes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow1Op') }}</td>
              <td><code>&lt; 100 ms</code></td>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow1Notes') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow2Op') }}</td>
              <td><code>&lt; 20 ms</code></td>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow2Notes') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow3Op') }}</td>
              <td><code>&lt; 150 ms</code></td>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow3Notes') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow4Op') }}</td>
              <td><code>&lt; 250 ms</code></td>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow4Notes') }}</td>
            </tr>
            <tr>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow5Op') }}</td>
              <td><code>2 – 8 s</code></td>
              <td>{{ $t('docDocsConceptsRagembeddings.perfRow5Notes') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>{{ $t('docDocsConceptsRagembeddings.scalingTitle') }}</h3>
      <ul>
        <li>{{ $t('docDocsConceptsRagembeddings.scalingItem1') }}</li>
        <li>{{ $t('docDocsConceptsRagembeddings.scalingItem2a') }}<code>lists</code>{{ $t('docDocsConceptsRagembeddings.scalingItem2b') }}</li>
        <li>{{ $t('docDocsConceptsRagembeddings.scalingItem3a') }}<code>probes</code>{{ $t('docDocsConceptsRagembeddings.scalingItem3b') }}<code>SET LOCAL ivfflat.probes = 10</code>.</li>
        <li>{{ $t('docDocsConceptsRagembeddings.scalingItem4a') }}<code>pgvector</code>{{ $t('docDocsConceptsRagembeddings.scalingItem4b') }}<code>SET max_parallel_workers_per_gather = 4</code>.</li>
        <li>{{ $t('docDocsConceptsRagembeddings.scalingItem5a') }}<code>VACUUM ANALYZE context_chunks</code>{{ $t('docDocsConceptsRagembeddings.scalingItem5b') }}</li>
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
