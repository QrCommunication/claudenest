<?php

namespace App\Services;

use App\Models\SharedProject;
use App\Models\SharedTask;
use App\Models\Sprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DecompositionService
{
    public function __construct(
        private readonly SummarizationService $summarizationService,
        private readonly ContextRAGService $contextRAGService,
    ) {}

    /**
     * Validate and normalize a master plan JSON structure.
     *
     * @return array{valid: bool, plan: ?array, errors: string[]}
     */
    public function validateMasterPlan(array $plan): array
    {
        $errors = [];

        if (!isset($plan['version']) || $plan['version'] !== 1) {
            $errors[] = 'Missing or invalid version (expected 1)';
        }

        if (empty($plan['waves']) || !is_array($plan['waves'])) {
            $errors[] = 'Missing or empty waves array';
            return ['valid' => false, 'plan' => null, 'errors' => $errors];
        }

        $normalizedWaves = [];
        foreach ($plan['waves'] as $i => $wave) {
            if (!isset($wave['name'])) {
                $errors[] = "Wave {$i}: missing name";
                continue;
            }

            if (empty($wave['tasks']) || !is_array($wave['tasks'])) {
                $errors[] = "Wave {$i} ({$wave['name']}): missing or empty tasks";
                continue;
            }

            $normalizedTasks = [];
            foreach ($wave['tasks'] as $j => $task) {
                if (empty($task['title'])) {
                    $errors[] = "Wave {$i}, Task {$j}: missing title";
                    continue;
                }

                $normalizedTasks[] = [
                    'title' => $task['title'],
                    'description' => $task['description'] ?? '',
                    'priority' => $this->normalizePriority($task['priority'] ?? 'medium'),
                    'files' => $task['files'] ?? [],
                    'estimated_tokens' => $task['estimated_tokens'] ?? null,
                    'depends_on' => $task['depends_on'] ?? [],
                ];
            }

            $normalizedWaves[] = [
                'id' => $wave['id'] ?? $i,
                'name' => $wave['name'],
                'description' => $wave['description'] ?? '',
                'tasks' => $normalizedTasks,
            ];
        }

        if (empty($normalizedWaves)) {
            $errors[] = 'No valid waves found';
            return ['valid' => false, 'plan' => null, 'errors' => $errors];
        }

        $normalized = [
            'version' => 1,
            'prd_summary' => $plan['prd_summary'] ?? '',
            'waves' => $normalizedWaves,
        ];

        return [
            'valid' => empty($errors),
            'plan' => $normalized,
            'errors' => $errors,
        ];
    }

    /**
     * Parse a JSON master plan from Claude's raw output.
     * Strips ANSI codes and finds the JSON block.
     *
     * @return array{success: bool, plan: ?array, error: ?string}
     */
    public function parseFromOutput(string $rawOutput): array
    {
        // Strip ANSI escape codes
        $clean = preg_replace('/\x1b\[[0-9;]*[a-zA-Z]/', '', $rawOutput);
        $clean = preg_replace('/\x1b\].*?\x07/', '', $clean);

        $jsonStr = $this->extractPlanJson($clean);
        if ($jsonStr === null) {
            return ['success' => false, 'plan' => null, 'error' => 'No JSON block found in output'];
        }

        $decoded = json_decode($jsonStr, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'success' => false,
                'plan' => null,
                'error' => 'Invalid JSON: ' . json_last_error_msg(),
            ];
        }

        $validation = $this->validateMasterPlan($decoded);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'plan' => $validation['plan'],
                'error' => implode('; ', $validation['errors']),
            ];
        }

        return ['success' => true, 'plan' => $validation['plan'], 'error' => null];
    }

    /**
     * Find the master plan JSON in cleaned PTY output.
     *
     * The PTY stream usually echoes the decomposition prompt, which itself
     * contains a ```json schema EXAMPLE (see buildDecompositionPrompt).
     * Candidates are therefore scanned from the END (Claude's answer is
     * printed after the echo) and any block carrying the example's sentinel
     * placeholder is skipped — a first-match parse used to return the echoed
     * schema example as a "successful" 1-task plan.
     */
    private function extractPlanJson(string $clean): ?string
    {
        $candidates = [];

        // Preferred: ```json ... ``` fenced blocks.
        if (preg_match_all('/```json\s*(\{[\s\S]*?\})\s*```/', $clean, $matches) && $matches[1]) {
            $candidates = $matches[1];
        }

        // Fallback: raw JSON starting with {"version": 1 (greedy to the last
        // closing brace, anchored on each occurrence).
        if (!$candidates && preg_match_all('/\{"version"\s*:\s*1/', $clean, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[0] as $match) {
                $candidate = substr($clean, (int) $match[1]);
                $endPos = strrpos($candidate, '}');
                if ($endPos !== false) {
                    $candidates[] = substr($candidate, 0, $endPos + 1);
                }
            }
        }

        foreach (array_reverse($candidates) as $candidate) {
            if (str_contains($candidate, 'Short task title')) {
                continue; // echoed prompt example, not Claude's answer
            }

            return $candidate;
        }

        return null;
    }

    /**
     * Apply a master plan to a project — create SharedTasks from waves.
     *
     * @return array{created: int, tasks: \Illuminate\Support\Collection}
     */
    public function applyMasterPlan(SharedProject $project): array
    {
        $plan = $project->master_plan;

        if (empty($plan) || empty($plan['waves'])) {
            throw new \InvalidArgumentException('Project has no master plan to apply');
        }

        // Generate the onboarding context (summary/architecture/conventions)
        // BEFORE the task transaction so workers spawned right after applying
        // the plan already have a populated project context to read from. Best
        // effort — a context-generation failure must never block task creation.
        $this->ensureProjectContext($project);

        return DB::transaction(function () use ($project, $plan) {
            $created = 0;
            $tasks = collect();
            $sprintsCreated = 0;

            // Build a task title → id map for dependency resolution
            $titleToId = [];

            // One Sprint per wave: waves are sequential, time-boxed phases
            // (Foundation → Backend → Frontend → Integration), which is exactly
            // the Sprint semantic. The first wave's sprint starts `active` so
            // the orchestrator/runner has a current iteration; later waves stay
            // `planning` until promoted. Tasks inherit their wave's sprint_id so
            // sprint completion (→ auto-PR) is driven by real task progress.
            $sortOrder = 0;

            foreach ($plan['waves'] as $wave) {
                $waveId = $wave['id'];

                $sprint = Sprint::create([
                    'project_id' => $project->id,
                    'name' => $wave['name'] ?? "Wave {$waveId}",
                    'goal' => $wave['description'] ?? '',
                    'status' => $sortOrder === 0 ? 'active' : 'planning',
                    'sort_order' => $sortOrder,
                ]);
                $sprintsCreated++;
                $sortOrder++;

                foreach ($wave['tasks'] as $taskDef) {
                    $task = SharedTask::create([
                        'project_id' => $project->id,
                        'sprint_id' => $sprint->id,
                        'wave' => $waveId,
                        'title' => $taskDef['title'],
                        'description' => $taskDef['description'] ?? '',
                        'priority' => $taskDef['priority'] ?? 'medium',
                        'status' => 'pending',
                        'files' => $taskDef['files'] ?? [],
                        'estimated_tokens' => $taskDef['estimated_tokens'] ?? null,
                        'dependencies' => [], // resolved below
                        'created_by' => 'decomposition',
                    ]);

                    $titleToId[$taskDef['title']] = $task->id;
                    $tasks->push($task);
                    $created++;
                }
            }

            // Second pass: resolve depends_on references (by title)
            foreach ($plan['waves'] as $wave) {
                foreach ($wave['tasks'] as $taskDef) {
                    if (!empty($taskDef['depends_on'])) {
                        $taskId = $titleToId[$taskDef['title']] ?? null;
                        if (!$taskId) {
                            continue;
                        }

                        $depIds = [];
                        foreach ($taskDef['depends_on'] as $depTitle) {
                            if (isset($titleToId[$depTitle])) {
                                $depIds[] = $titleToId[$depTitle];
                            }
                        }

                        if (!empty($depIds)) {
                            SharedTask::where('id', $taskId)
                                ->update(['dependencies' => json_encode($depIds)]);
                        }
                    }
                }
            }

            // Last-resort summary from the plan if context generation produced
            // nothing usable (offline Ollama + empty PRD summary is unlikely but
            // the field should never stay empty once a plan exists).
            if (!empty($plan['prd_summary']) && empty($project->fresh()->summary)) {
                $project->update(['summary' => $plan['prd_summary']]);
            }

            return ['created' => $created, 'sprints' => $sprintsCreated, 'tasks' => $tasks];
        });
    }

    /**
     * Ensure the project has onboarding context (summary, architecture,
     * conventions, current focus). No-op when all three core sections are
     * already populated; otherwise generates the missing ones from the PRD +
     * scan result via Ollama (falling back to a lightweight template when the
     * model is unavailable) and seeds the RAG store so instances can search it.
     *
     * Best-effort by contract: every failure is swallowed — generating context
     * must never block applying the master plan.
     *
     * @return array<string, string> the sections that were newly populated
     */
    public function ensureProjectContext(SharedProject $project): array
    {
        $project = $project->fresh() ?? $project;

        $hasSummary = trim((string) $project->summary) !== '';
        $hasArchitecture = trim((string) $project->architecture) !== '';
        $hasConventions = trim((string) $project->conventions) !== '';

        // Already onboarded — nothing to generate.
        if ($hasSummary && $hasArchitecture && $hasConventions) {
            return [];
        }

        try {
            $scanResult = is_array($project->settings['scan_result'] ?? null)
                ? $project->settings['scan_result']
                : [];
            $techStack = collect($scanResult['tech_stack'] ?? [])
                ->filter(fn ($t) => is_string($t) && trim($t) !== '')
                ->take(50)
                ->values()
                ->all();
            $prd = trim((string) $project->prd);
            $planSummary = trim((string) ($project->master_plan['prd_summary'] ?? ''));

            $generated = [];
            if ($this->summarizationService->isAvailable() && ($prd !== '' || $planSummary !== '' || $techStack !== [])) {
                $generated = $this->summarizationService->generateJson(
                    $this->buildProjectContextPrompt($project->name, $techStack, $prd, $planSummary),
                    700,
                ) ?? [];
            }

            $fallbackSummary = $planSummary !== ''
                ? $planSummary
                : ($prd !== '' ? \Illuminate\Support\Str::limit($prd, 280) : trim((string) $project->name).' project.');

            $sections = [
                'summary' => $this->sectionString($generated['summary'] ?? null) ?? $fallbackSummary,
                'architecture' => $this->sectionString($generated['architecture'] ?? null) ?? '',
                'conventions' => $this->sectionString($generated['conventions'] ?? null) ?? '',
                'current_focus' => $this->sectionString($generated['current_focus'] ?? null) ?? '',
            ];

            // Only fill the fields that are currently empty — never overwrite
            // context a human (or a prior run) already curated.
            $updates = [];
            $newlyPopulated = [];
            foreach ($sections as $field => $value) {
                $value = trim((string) $value);
                if ($value === '') {
                    continue;
                }
                if (trim((string) ($project->{$field} ?? '')) === '') {
                    $updates[$field] = $value;
                    $newlyPopulated[$field] = $value;
                }
            }

            if ($updates !== []) {
                $project->update($updates);
                $this->seedContextChunks($project, $newlyPopulated);
            }

            return $newlyPopulated;
        } catch (\Throwable $e) {
            Log::warning('Project context generation failed during decomposition', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Seed the RAG store with one chunk per newly populated context section so
     * the generated project context is immediately searchable by instances.
     * Best-effort: a RAG failure must never block the decomposition.
     *
     * @param array<string, string> $sections
     */
    private function seedContextChunks(SharedProject $project, array $sections): void
    {
        foreach ($sections as $type => $content) {
            $content = trim((string) $content);
            if ($content === '') {
                continue;
            }

            try {
                $this->contextRAGService->addContext($project, $content, $type, [
                    'importance_score' => 0.8,
                ]);
            } catch (\Throwable $e) {
                Log::warning('Failed to seed project context chunk during decomposition', [
                    'project_id' => $project->id,
                    'type' => $type,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Coerce an LLM section value (string, or list of bullet strings) into a
     * non-empty trimmed string, or null when unusable.
     */
    private function sectionString(mixed $value): ?string
    {
        if (is_string($value)) {
            $value = trim($value);

            return $value !== '' ? $value : null;
        }

        if (is_array($value)) {
            $lines = array_values(array_filter(array_map(
                static fn ($line) => is_string($line) ? trim($line) : '',
                $value,
            ), static fn (string $line) => $line !== ''));

            return $lines !== [] ? implode("\n", $lines) : null;
        }

        return null;
    }

    /**
     * Build the single-call JSON prompt asking Ollama for the project context
     * sections, grounded in the PRD + plan summary + detected tech stack.
     *
     * @param array<int, string> $techStack
     */
    private function buildProjectContextPrompt(
        string $projectName,
        array $techStack,
        string $prd,
        string $planSummary,
    ): string {
        $techStackStr = $techStack !== [] ? implode(', ', $techStack) : 'unknown';
        $prdExcerpt = $prd !== '' ? \Illuminate\Support\Str::limit($prd, 3000) : 'No PRD provided.';
        $planBlock = $planSummary !== '' ? "Plan summary:\n{$planSummary}\n" : '';

        return <<<PROMPT
You are analyzing a software project to produce concise onboarding context for a development team that is about to start implementing the following requirements.

Project name: {$projectName}
Tech stack: {$techStackStr}
{$planBlock}
Product requirements (truncated):
{$prdExcerpt}

Respond with a single JSON object containing exactly these keys and nothing else:
- "summary": what the project does and its main purpose, 2 sentences maximum.
- "architecture": the intended architecture and the role of key layers/directories, 3 sentences maximum.
- "conventions": coding conventions and best practices the team should follow, 3 to 5 bullet points in one single string, one bullet per line, each line starting with "- ".
- "current_focus": the most immediate development focus implied by the requirements, 1 sentence.

Be concise. Do not include markdown fences, comments, or any keys other than the four listed.
PROMPT;
    }

    /**
     * Build the decomposition prompt for Claude.
     */
    public function buildDecompositionPrompt(string $prd, ?array $scanResult = null): string
    {
        $contextBlock = '';
        if ($scanResult) {
            $techStack = implode(', ', $scanResult['tech_stack'] ?? []);
            $contextBlock = <<<CONTEXT

## Project Context
- Tech stack: {$techStack}
- Has git: {$scanResult['has_git']}
CONTEXT;
        }

        return <<<PROMPT
You are a software architect. Decompose the following PRD (Product Requirements Document) into a structured Master Plan with waves and tasks.
{$contextBlock}

## PRD
{$prd}

## Output Format
Return ONLY a JSON block (wrapped in ```json ... ```) with this exact schema:

```json
{
  "version": 1,
  "prd_summary": "One-paragraph summary of the PRD",
  "waves": [
    {
      "id": 0,
      "name": "Wave name (e.g. Foundation, Backend, Frontend)",
      "description": "What this wave accomplishes",
      "tasks": [
        {
          "title": "Short task title",
          "description": "Detailed description with acceptance criteria",
          "priority": "critical|high|medium|low",
          "files": ["path/to/file.ext"],
          "estimated_tokens": 5000,
          "depends_on": ["Title of dependency task"]
        }
      ]
    }
  ]
}
```

## Rules
1. Wave 0 = Foundation (DB, models, config)
2. Wave 1 = Backend (services, controllers, routes)
3. Wave 2 = Frontend (components, pages, state)
4. Wave 3 = Integration (tests, docs, CI/CD)
5. Each task = ONE atomic unit of work (1 file or 1 logical change)
6. Tasks should be completable in < 30 minutes each
7. Dependencies reference task titles from earlier waves
8. Priority: critical = blocks everything, high = important, medium = standard, low = nice-to-have
9. Estimate tokens per task (5000-50000 range)
10. Be specific about file paths when possible
PROMPT;
    }

    private function normalizePriority(string $priority): string
    {
        return match (strtolower($priority)) {
            'critical' => 'critical',
            'high' => 'high',
            'medium', 'med', 'normal' => 'medium',
            'low' => 'low',
            default => 'medium',
        };
    }
}
