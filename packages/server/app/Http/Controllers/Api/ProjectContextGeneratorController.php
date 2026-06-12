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
     * Maximum characters of README content forwarded to the LLM.
     */
    private const README_EXCERPT_LENGTH = 2000;

    /**
     * Maximum number of file paths from the structure forwarded to the LLM.
     */
    private const STRUCTURE_MAX_FILES = 100;

    /**
     * Token budget for the single JSON generation. mistral:7b on CPU runs at
     * ~3.4 tokens/s — 600 tokens caps the worst case at ~3 min, with typical
     * concise outputs landing around 1-2 min on a warm model.
     */
    private const CONTEXT_MAX_TOKENS = 600;

    /**
     * Maximum suggested tasks kept from the LLM output.
     */
    private const SUGGESTED_TASKS_MAX = 5;

    /**
     * Valid task priorities accepted from the LLM output.
     */
    private const TASK_PRIORITIES = ['low', 'medium', 'high'];

    /**
     * Generate project context (summary, architecture, conventions,
     * current focus, normalized tech stack, suggested tasks) via Ollama.
     *
     * Single bounded LLM call: the previous implementation made 5 sequential
     * generations (~70s each at 3.4 tok/s on CPU = 10-15 min total, guaranteed
     * HTTP timeout). One `format: json` call returns all sections at once;
     * any invalid/missing section falls back to the template — never a 500.
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
            'tech_stack.*' => 'string|max:100',
            'readme' => 'nullable|string',
            'structure' => 'required|array',
            'structure.*' => 'string|max:1024',
            // Optional: the wizard knows the typed name, but it is derivable
            // from the scanned path when omitted (robustness on both sides).
            'project_name' => 'nullable|string|max:255',
        ]);

        $validated['project_name'] = $validated['project_name']
            ?? (basename(rtrim($validated['path'], '/')) ?: 'Untitled project');
        $validated['tech_stack'] = $this->normalizeTechStack($validated['tech_stack']);

        if (!$this->summarizationService->isAvailable()) {
            return $this->generateFallback($validated);
        }

        $structureStr = implode("\n", array_slice($validated['structure'], 0, self::STRUCTURE_MAX_FILES));
        $techStackStr = implode(', ', $validated['tech_stack']);
        $readmeExcerpt = $validated['readme']
            ? substr($validated['readme'], 0, self::README_EXCERPT_LENGTH)
            : 'No README available.';

        $generated = $this->summarizationService->generateJson(
            $this->buildContextPrompt($validated['project_name'], $techStackStr, $readmeExcerpt, $structureStr),
            self::CONTEXT_MAX_TOKENS,
        ) ?? [];

        $fallback = $this->fallbackSections($validated);

        $summary = $this->sectionText($generated['summary'] ?? null);
        $architecture = $this->sectionText($generated['architecture'] ?? null);
        $conventions = $this->sectionText($generated['conventions'] ?? null);
        $currentFocus = $this->sectionText($generated['current_focus'] ?? null);
        $suggestedTasks = $this->sectionTasks($generated['suggested_tasks'] ?? null);

        $anySectionFromLlm = $summary !== null
            || $architecture !== null
            || $conventions !== null
            || $currentFocus !== null
            || $suggestedTasks !== null;

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary ?? $fallback['summary'],
                'architecture' => $architecture ?? $fallback['architecture'],
                'conventions' => $conventions ?? $fallback['conventions'],
                'current_focus' => $currentFocus ?? $fallback['current_focus'],
                'tech_stack' => $validated['tech_stack'],
                'suggested_tasks' => $suggestedTasks ?? $fallback['suggested_tasks'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'generated_by' => $anySectionFromLlm ? 'ollama' : 'fallback',
            ],
        ]);
    }

    /**
     * Build the single-call prompt asking for a strict, concise JSON object.
     */
    private function buildContextPrompt(
        string $projectName,
        string $techStackStr,
        string $readmeExcerpt,
        string $structureStr,
    ): string {
        return <<<PROMPT
You are analyzing a software project to produce concise onboarding context for a development team.

Project name: {$projectName}
Tech stack: {$techStackStr}
README excerpt:
{$readmeExcerpt}

File structure (truncated):
{$structureStr}

Respond with a single JSON object containing exactly these keys and nothing else:
- "summary": what the project does and its main purpose, 2 sentences maximum.
- "architecture": the architecture and the role of key directories, 3 sentences maximum.
- "conventions": likely coding conventions and best practices, 3 to 5 bullet points in one single string, one bullet per line, each line starting with "- ".
- "current_focus": the most likely current development focus inferred from the README (roadmap, TODO, changelog) and the structure, 1 sentence.
- "suggested_tasks": an array of 3 to 5 short task titles (plain strings) for a team starting work on this project, focused on setup, documentation review, and initial development.

Be concise. Do not include markdown fences, comments, or any keys other than the five listed.
PROMPT;
    }

    /**
     * Coerce an LLM-provided section into a non-empty trimmed string.
     *
     * Models occasionally return bullet lists as arrays despite instructions —
     * a list of strings is joined with newlines instead of being dropped.
     * Returns null when the value is unusable (caller falls back).
     */
    private function sectionText(mixed $value): ?string
    {
        if (is_string($value)) {
            $value = trim($value);

            return $value !== '' ? $value : null;
        }

        if (is_array($value)) {
            $lines = array_values(array_filter(
                array_map(
                    static fn ($line) => is_string($line) ? trim($line) : '',
                    $value,
                ),
                static fn (string $line) => $line !== '',
            ));

            return $lines !== [] ? implode("\n", $lines) : null;
        }

        return null;
    }

    /**
     * Coerce LLM-provided suggested tasks into structured task objects.
     *
     * The prompt asks for plain strings, but object-shaped entries are
     * tolerated. Returns null when nothing usable remains (caller falls back).
     *
     * @return array<int, array{title: string, priority: string, description: string, files: array<int, string>}>|null
     */
    private function sectionTasks(mixed $value): ?array
    {
        if (!is_array($value)) {
            return null;
        }

        $tasks = [];

        foreach ($value as $entry) {
            if (count($tasks) >= self::SUGGESTED_TASKS_MAX) {
                break;
            }

            if (is_string($entry)) {
                $title = trim($entry);

                if ($title === '') {
                    continue;
                }

                $tasks[] = [
                    'title' => mb_substr($title, 0, 255),
                    'priority' => 'medium',
                    'description' => '',
                    'files' => [],
                ];

                continue;
            }

            if (is_array($entry) && is_string($entry['title'] ?? null) && trim($entry['title']) !== '') {
                $priority = is_string($entry['priority'] ?? null)
                    ? strtolower(trim($entry['priority']))
                    : 'medium';

                $tasks[] = [
                    'title' => mb_substr(trim($entry['title']), 0, 255),
                    'priority' => in_array($priority, self::TASK_PRIORITIES, true) ? $priority : 'medium',
                    'description' => is_string($entry['description'] ?? null) ? trim($entry['description']) : '',
                    'files' => [],
                ];
            }
        }

        return $tasks !== [] ? $tasks : null;
    }

    /**
     * Normalize a raw tech-stack list: trim, drop empties, dedupe
     * case-insensitively (first casing wins), cap the list size.
     *
     * @param array<int, mixed> $techStack
     * @return array<int, string>
     */
    private function normalizeTechStack(array $techStack): array
    {
        $normalized = [];
        $seen = [];

        foreach ($techStack as $entry) {
            if (!is_string($entry)) {
                continue;
            }

            $entry = trim($entry);
            if ($entry === '') {
                continue;
            }

            $key = mb_strtolower($entry);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $normalized[] = $entry;

            if (count($normalized) >= 50) {
                break;
            }
        }

        return $normalized;
    }

    /**
     * Template-based section values used when Ollama is unavailable or a
     * specific section of its JSON output is invalid/missing.
     *
     * @param array<string, mixed> $validated
     * @return array{summary: string, architecture: string, conventions: string, current_focus: string, suggested_tasks: array<int, array{title: string, priority: string, description: string, files: array<int, string>}>}
     */
    private function fallbackSections(array $validated): array
    {
        $techStackStr = implode(', ', $validated['tech_stack']);

        return [
            'summary' => "A {$techStackStr} project located at {$validated['path']}.",
            'architecture' => '',
            'conventions' => '',
            'current_focus' => '',
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
        ];
    }

    /**
     * Fallback when Ollama is unavailable — returns template-based context.
     */
    private function generateFallback(array $validated): JsonResponse
    {
        $sections = $this->fallbackSections($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $sections['summary'],
                'architecture' => $sections['architecture'],
                'conventions' => $sections['conventions'],
                'current_focus' => $sections['current_focus'],
                'tech_stack' => $validated['tech_stack'],
                'suggested_tasks' => $sections['suggested_tasks'],
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => request()->header('X-Request-ID', uniqid()),
                'generated_by' => 'fallback',
            ],
        ]);
    }
}
