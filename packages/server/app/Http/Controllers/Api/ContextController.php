<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SharedProject;
use App\Models\ContextChunk;
use App\Services\EmbeddingService;
use App\Services\ContextRAGService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContextController extends Controller
{
    public function __construct(
        private EmbeddingService $embeddingService,
        private ContextRAGService $ragService,
    ) {}

    /**
     * @OA\Get(
     *     path="/api/projects/{projectId}/context",
     *     tags={"Context"},
     *     summary="Get project context",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Project context",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="summary", type="string", nullable=true),
     *                 @OA\Property(property="architecture", type="string", nullable=true),
     *                 @OA\Property(property="conventions", type="string", nullable=true),
     *                 @OA\Property(property="current_focus", type="string", nullable=true),
     *                 @OA\Property(property="recent_changes", type="string", nullable=true),
     *                 @OA\Property(property="total_tokens", type="integer"),
     *                 @OA\Property(property="max_tokens", type="integer"),
     *                 @OA\Property(property="token_usage_percent", type="number", format="float")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function show(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $project->summary,
                'architecture' => $project->architecture,
                'conventions' => $project->conventions,
                'current_focus' => $project->current_focus,
                'recent_changes' => $project->recent_changes,
                'total_tokens' => $project->total_tokens,
                'max_tokens' => $project->max_tokens,
                'token_usage_percent' => $project->token_usage_percent,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Patch(
     *     path="/api/projects/{projectId}/context",
     *     tags={"Context"},
     *     summary="Update project context",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(
     *             @OA\Property(property="summary", type="string", nullable=true),
     *             @OA\Property(property="architecture", type="string", nullable=true),
     *             @OA\Property(property="conventions", type="string", nullable=true),
     *             @OA\Property(property="current_focus", type="string", nullable=true),
     *             @OA\Property(property="recent_changes", type="string", nullable=true)
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Updated context",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="summary", type="string", nullable=true),
     *                 @OA\Property(property="architecture", type="string", nullable=true),
     *                 @OA\Property(property="conventions", type="string", nullable=true),
     *                 @OA\Property(property="current_focus", type="string", nullable=true),
     *                 @OA\Property(property="recent_changes", type="string", nullable=true)
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function update(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'summary' => 'nullable|string',
            'architecture' => 'nullable|string',
            'conventions' => 'nullable|string',
            'current_focus' => 'nullable|string',
            'recent_changes' => 'nullable|string',
        ]);

        $project->updateContext($validated);

        // Log activity
        $project->logActivity('context_updated', $request->input('instance_id'), [
            'updated_fields' => array_keys($validated),
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $project->summary,
                'architecture' => $project->architecture,
                'conventions' => $project->conventions,
                'current_focus' => $project->current_focus,
                'recent_changes' => $project->recent_changes,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/projects/{projectId}/context/query",
     *     tags={"Context"},
     *     summary="Query context chunks (RAG search)",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/ContextQueryRequest")
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Matching context chunks with similarity scores",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="string", format="uuid"),
     *                     @OA\Property(property="content", type="string"),
     *                     @OA\Property(property="type", type="string"),
     *                     @OA\Property(property="instance_id", type="string", nullable=true),
     *                     @OA\Property(property="task_id", type="string", format="uuid", nullable=true),
     *                     @OA\Property(property="files", type="array", @OA\Items(type="string")),
     *                     @OA\Property(property="importance_score", type="number", format="float"),
     *                     @OA\Property(property="similarity", type="number", format="float", nullable=true),
     *                     @OA\Property(property="created_at", type="string", format="date-time")
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function query(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'query' => 'required|string|min:1',
            'limit' => 'integer|min:1|max:50|default:10',
            'type' => 'string|in:task_completion,context_update,file_change,decision,summary,broadcast',
            'min_similarity' => 'numeric|min:0|max:1',
        ]);

        $query = $validated['query'];
        $limit = $validated['limit'] ?? 10;

        // Check if we have an embedding service available
        $ollamaUrl = config('services.ollama.url');
        $useEmbeddings = !empty($ollamaUrl);

        if ($useEmbeddings) {
            try {
                // Get embedding for query
                $embedding = $this->embeddingService->generate($query);

                if ($embedding) {
                    $chunks = ContextChunk::findSimilar(
                        $projectId,
                        $embedding,
                        $limit,
                        $validated['min_similarity'] ?? 0.7
                    );
                } else {
                    $chunks = ContextChunk::semanticSearch($projectId, $query, $limit);
                }
            } catch (\Exception $e) {
                // Fallback to text search
                $chunks = ContextChunk::semanticSearch($projectId, $query, $limit);
            }
        } else {
            // Use text search
            $chunksQuery = ContextChunk::forProject($projectId)
                ->active()
                ->where('content', 'ILIKE', '%' . $query . '%');

            if (isset($validated['type'])) {
                $chunksQuery->byType($validated['type']);
            }

            $chunks = $chunksQuery
                ->orderBy('importance_score', 'desc')
                ->limit($limit)
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $chunks->map(fn ($chunk) => [
                'id' => $chunk->id,
                'content' => $chunk->content,
                'type' => $chunk->type,
                'instance_id' => $chunk->instance_id,
                'task_id' => $chunk->task_id,
                'files' => $chunk->files,
                'importance_score' => $chunk->importance_score,
                'similarity' => $chunk->similarity ?? null,
                'created_at' => $chunk->created_at,
            ]),
            'meta' => [
                'query' => $query,
                'result_count' => $chunks->count(),
                'used_embeddings' => $useEmbeddings,
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Get(
     *     path="/api/projects/{projectId}/context/chunks",
     *     tags={"Context"},
     *     summary="List context chunks",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="type",
     *         in="query",
     *         required=false,
     *         description="Filter by chunk type",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="instance_id",
     *         in="query",
     *         required=false,
     *         description="Filter by instance ID",
     *         @OA\Schema(type="string")
     *     ),
     *     @OA\Parameter(
     *         name="limit",
     *         in="query",
     *         required=false,
     *         description="Number of results per page",
     *         @OA\Schema(type="integer", default=50)
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Paginated list of context chunks",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="array",
     *                 @OA\Items(ref="#/components/schemas/ContextChunk")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function chunks(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'type' => 'nullable|string|in:task_completion,context_update,file_change,decision,summary,broadcast',
            'instance_id' => 'nullable|string',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $limit = $request->integer('limit', 50);

        $query = $project->contextChunks()->active();

        if (isset($validated['type'])) {
            $query->byType($validated['type']);
        }

        if (isset($validated['instance_id'])) {
            $query->byInstance($validated['instance_id']);
        }

        $chunks = $query
            ->orderBy('created_at', 'desc')
            ->paginate($limit);

        return response()->json([
            'success' => true,
            'data' => $chunks->map(fn ($chunk) => [
                'id' => $chunk->id,
                'content' => $chunk->getTruncatedContent(500),
                'type' => $chunk->type,
                'instance_id' => $chunk->instance_id,
                'task_id' => $chunk->task_id,
                'files' => $chunk->files,
                'importance_score' => $chunk->importance_score,
                'expires_at' => $chunk->expires_at,
                'created_at' => $chunk->created_at,
            ]),
            'meta' => [
                'pagination' => [
                    'current_page' => $chunks->currentPage(),
                    'per_page' => $chunks->perPage(),
                    'total' => $chunks->total(),
                    'last_page' => $chunks->lastPage(),
                ],
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * @OA\Post(
     *     path="/api/projects/{projectId}/context/chunks",
     *     tags={"Context"},
     *     summary="Create context chunk",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/CreateChunkRequest")
     *     ),
     *     @OA\Response(
     *         response=201,
     *         description="Context chunk created",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="id", type="string", format="uuid"),
     *                 @OA\Property(property="type", type="string"),
     *                 @OA\Property(property="has_embedding", type="boolean"),
     *                 @OA\Property(property="created_at", type="string", format="date-time")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function storeChunk(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'content' => 'required|string|min:1',
            'type' => 'required|string|in:task_completion,context_update,file_change,decision,summary,broadcast',
            'instance_id' => 'nullable|string',
            'task_id' => 'nullable|uuid|exists:shared_tasks,id',
            'files' => 'array',
            'files.*' => 'string',
            'importance_score' => 'numeric|min:0|max:1',
            'generate_embedding' => 'boolean',
        ]);

        // Get embedding if requested and service available
        $embedding = null;
        if ($validated['generate_embedding'] ?? false) {
            $embedding = $this->embeddingService->generate($validated['content']);
        }

        $chunk = ContextChunk::create([
            'project_id' => $projectId,
            'content' => $validated['content'],
            'type' => $validated['type'],
            'instance_id' => $validated['instance_id'] ?? null,
            'task_id' => $validated['task_id'] ?? null,
            'files' => $validated['files'] ?? [],
            'importance_score' => $validated['importance_score'] ?? 0.5,
            'expires_at' => now()->addDays($project->getSetting('contextRetentionDays', 30)),
        ]);

        if ($embedding) {
            $chunk->setEmbedding($embedding);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $chunk->id,
                'type' => $chunk->type,
                'has_embedding' => !empty($embedding),
                'created_at' => $chunk->created_at,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * @OA\Post(
     *     path="/api/projects/{projectId}/context/summarize",
     *     tags={"Context"},
     *     summary="Summarize context chunks",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\RequestBody(
     *         required=false,
     *         @OA\JsonContent(
     *             @OA\Property(
     *                 property="chunk_ids",
     *                 type="array",
     *                 description="UUIDs of chunks to summarize; omit to use recent high-importance chunks",
     *                 @OA\Items(type="string", format="uuid")
     *             ),
     *             @OA\Property(property="max_length", type="integer", default=1000, description="Maximum summary length in characters")
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="Generated summary",
     *         @OA\JsonContent(
     *             @OA\Property(property="success", type="boolean", example=true),
     *             @OA\Property(
     *                 property="data",
     *                 type="object",
     *                 @OA\Property(property="summary", type="string"),
     *                 @OA\Property(property="chunks_used", type="integer"),
     *                 @OA\Property(property="total_chars", type="integer"),
     *                 @OA\Property(property="ai_generated", type="boolean")
     *             )
     *         )
     *     ),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function summarize(Request $request, string $projectId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $validated = $request->validate([
            'chunk_ids' => 'array',
            'chunk_ids.*' => 'uuid|exists:context_chunks,id',
            'max_length' => 'integer|min:100|max:4000|default:1000',
        ]);

        $chunkIds = $validated['chunk_ids'] ?? [];
        $maxLength = $validated['max_length'] ?? 1000;

        if (empty($chunkIds)) {
            // Get recent high-importance chunks
            $chunks = $project->contextChunks()
                ->active()
                ->highImportance(0.6)
                ->orderBy('created_at', 'desc')
                ->limit(20)
                ->pluck('content')
                ->toArray();
        } else {
            $chunks = $project->contextChunks()
                ->whereIn('id', $chunkIds)
                ->pluck('content')
                ->toArray();
        }

        $combined = implode("\n\n---\n\n", $chunks);

        // Try to use Ollama for summarization
        $summary = null;
        $ollamaUrl = config('services.ollama.url');
        $model = config('services.ollama.model', 'mistral');

        if (!empty($ollamaUrl) && strlen($combined) > 500) {
            try {
                $response = Http::timeout(30)->post("{$ollamaUrl}/api/generate", [
                    'model' => $model,
                    'prompt' => "Summarize the following context in {$maxLength} characters or less:\n\n{$combined}",
                    'stream' => false,
                ]);

                if ($response->successful()) {
                    $summary = $response->json('response');
                }
            } catch (\Exception $e) {
                // Fall through to simple summary
            }
        }

        // Fallback to simple summary if Ollama fails
        if (empty($summary)) {
            $summary = substr($combined, 0, $maxLength);
            if (strlen($combined) > $maxLength) {
                $summary .= '...';
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'chunks_used' => count($chunks),
                'total_chars' => strlen($combined),
                'ai_generated' => !empty($ollamaUrl) && strlen($combined) > 500,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Batch create context chunks from agent sync queue.
     * Accepts updates across multiple projects in a single request.
     */
    public function batch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'updates' => 'required|array|min:1|max:100',
            'updates.*.projectId' => 'required|uuid',
            'updates.*.content' => 'required|string|min:1',
            'updates.*.type' => 'required|string|in:task_completion,context_update,file_change,decision,summary,broadcast',
            'updates.*.files' => 'nullable|array',
            'updates.*.files.*' => 'string',
            'updates.*.importanceScore' => 'nullable|numeric|min:0|max:1',
        ]);

        $userId = $request->user()->id;
        $created = [];
        $errors = [];

        // Group updates by project for efficient ownership check
        $projectIds = collect($validated['updates'])->pluck('projectId')->unique();
        $userProjects = SharedProject::forUser($userId)
            ->whereIn('id', $projectIds)
            ->pluck('id')
            ->flip();

        foreach ($validated['updates'] as $i => $update) {
            if (!$userProjects->has($update['projectId'])) {
                $errors[] = ['index' => $i, 'error' => 'Project not found or not owned'];
                continue;
            }

            $chunk = ContextChunk::create([
                'project_id' => $update['projectId'],
                'content' => $update['content'],
                'type' => $update['type'],
                'instance_id' => $request->header('X-Instance-ID'),
                'files' => $update['files'] ?? [],
                'importance_score' => $update['importanceScore'] ?? 0.5,
                'expires_at' => now()->addDays(30),
            ]);

            $created[] = $chunk->id;

            // Dispatch embedding generation asynchronously if service is available
            if ($this->embeddingService->isAvailable()) {
                \App\Jobs\GenerateChunkEmbedding::dispatch($chunk);
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'created' => $created,
                'errors' => $errors,
            ],
            'meta' => [
                'total_received' => count($validated['updates']),
                'total_created' => count($created),
                'total_errors' => count($errors),
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 201);
    }

    /**
     * @OA\Delete(
     *     path="/api/projects/{projectId}/context/chunks/{chunkId}",
     *     tags={"Context"},
     *     summary="Delete context chunk",
     *     security={{"bearerAuth": {}}},
     *     @OA\Parameter(
     *         name="projectId",
     *         in="path",
     *         required=true,
     *         description="Project UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Parameter(
     *         name="chunkId",
     *         in="path",
     *         required=true,
     *         description="Context chunk UUID",
     *         @OA\Schema(type="string", format="uuid")
     *     ),
     *     @OA\Response(response=200, ref="#/components/responses/DeletedResponse"),
     *     @OA\Response(response=404, ref="#/components/responses/NotFound")
     * )
     */
    public function destroyChunk(Request $request, string $projectId, string $chunkId): JsonResponse
    {
        $project = $this->getUserProject($request, $projectId);

        if (!$project) {
            return $this->errorResponse('CTX_001', 'Project not found', 404);
        }

        $chunk = $project->contextChunks()->find($chunkId);

        if (!$chunk) {
            return $this->errorResponse('CTX_001', 'Context chunk not found', 404);
        }

        $chunk->delete();

        return response()->json([
            'success' => true,
            'data' => null,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }

    /**
     * Helper: Get project belonging to authenticated user.
     */
    private function getUserProject(Request $request, string $id): ?SharedProject
    {
        return SharedProject::forUser($request->user()->id)->find($id);
    }

    /**
     * Helper: Error response.
     */
    private function errorResponse(string $code, string $message, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
            ],
        ], $status);
    }
}
