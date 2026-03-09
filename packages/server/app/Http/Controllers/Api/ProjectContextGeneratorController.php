<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Machine;
use App\Services\SummarizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProjectContextGeneratorController extends Controller
{
    public function __construct(
        private SummarizationService $summarizationService,
    ) {}

    /**
     * Generate project context (summary, architecture, conventions, suggested tasks) via Ollama.
     *
     * POST /api/machines/{machine}/projects/generate-context
     */
    public function generate(Request $request, Machine $machine): JsonResponse
    {
        if ($machine->user_id !== $request->user()->id) {
            return $this->errorResponse('FORBIDDEN', 'Machine does not belong to you', 403);
        }

        $validated = $request->validate([
            'path' => 'required|string|max:1024',
            'tech_stack' => 'required|array',
            'readme' => 'nullable|string',
            'structure' => 'required|array',
            'project_name' => 'required|string|max:255',
        ]);

        if (!$this->summarizationService->isAvailable()) {
            return $this->generateFallback($validated);
        }

        $structureStr = implode("\n", array_slice($validated['structure'], 0, 100));
        $techStackStr = implode(', ', $validated['tech_stack']);
        $readmeExcerpt = $validated['readme']
            ? substr($validated['readme'], 0, 2000)
            : 'No README available.';

        // Generate summary
        $summary = $this->summarizationService->generate(
            "You are analyzing a software project. Project name: {$validated['project_name']}. " .
            "Tech stack: {$techStackStr}. " .
            "README excerpt:\n{$readmeExcerpt}\n\n" .
            "Write a concise project summary (2-3 sentences) describing what this project does and its main purpose.",
            300
        );

        // Generate architecture description
        $architecture = $this->summarizationService->generate(
            "Based on this file structure and tech stack ({$techStackStr}), describe the project architecture:\n\n{$structureStr}\n\n" .
            "Describe the architecture in 3-5 sentences, mentioning key directories and their roles.",
            500
        );

        // Generate conventions
        $conventions = $this->summarizationService->generate(
            "Based on this tech stack ({$techStackStr}) and file structure:\n{$structureStr}\n\n" .
            "List the likely coding conventions and best practices for this project. Keep it concise, 3-5 bullet points.",
            400
        );

        // Generate suggested tasks
        $tasksRaw = $this->summarizationService->generate(
            "You are a project manager analyzing a {$techStackStr} project named '{$validated['project_name']}'.\n" .
            "README: {$readmeExcerpt}\n" .
            "Structure:\n{$structureStr}\n\n" .
            "Suggest 3-5 initial tasks for a development team starting work on this project. " .
            "Format each task as: TASK: <title> | PRIORITY: <low|medium|high> | DESCRIPTION: <one sentence>\n" .
            "Focus on setup, documentation review, and initial development tasks.",
            800
        );

        $suggestedTasks = $this->parseSuggestedTasks($tasksRaw);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary ?? "A {$techStackStr} project.",
                'architecture' => $architecture ?? '',
                'conventions' => $conventions ?? '',
                'suggested_tasks' => $suggestedTasks,
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'generated_by' => 'ollama',
            ],
        ]);
    }

    /**
     * Fallback when Ollama is unavailable — returns template-based context.
     */
    private function generateFallback(array $validated): JsonResponse
    {
        $techStackStr = implode(', ', $validated['tech_stack']);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => "A {$techStackStr} project located at {$validated['path']}.",
                'architecture' => '',
                'conventions' => '',
                'suggested_tasks' => [
                    [
                        'title' => 'Review project documentation',
                        'priority' => 'high',
                        'description' => 'Read through README and existing documentation.',
                        'files' => [],
                    ],
                    [
                        'title' => 'Setup development environment',
                        'priority' => 'high',
                        'description' => 'Install dependencies and verify the project builds.',
                        'files' => [],
                    ],
                    [
                        'title' => 'Run existing tests',
                        'priority' => 'medium',
                        'description' => 'Execute the test suite and review results.',
                        'files' => [],
                    ],
                ],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
                'generated_by' => 'fallback',
            ],
        ]);
    }

    /**
     * Parse raw Ollama output into structured task objects.
     */
    private function parseSuggestedTasks(?string $raw): array
    {
        if (!$raw) {
            return [];
        }

        $tasks = [];
        $lines = preg_split('/\n+/', trim($raw));

        foreach ($lines as $line) {
            if (preg_match('/TASK:\s*(.+?)\s*\|\s*PRIORITY:\s*(\w+)\s*\|\s*DESCRIPTION:\s*(.+)/i', $line, $m)) {
                $tasks[] = [
                    'title' => trim($m[1]),
                    'priority' => strtolower(trim($m[2])),
                    'description' => trim($m[3]),
                    'files' => [],
                ];
            }
        }

        // If parsing failed, create a single task from the raw text
        if (empty($tasks) && strlen($raw) > 10) {
            $tasks[] = [
                'title' => 'Review project and plan work',
                'priority' => 'high',
                'description' => $raw,
                'files' => [],
            ];
        }

        return $tasks;
    }

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
