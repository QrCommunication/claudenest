<?php

namespace App\Services;

use App\Events\ProjectBroadcast;
use App\Models\SharedProject;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Finalizes a PRD decomposition once the plan is produced.
 *
 * Decomposition runs as an interactive Claude session (on the user's
 * subscription — no `claude -p`). The session returns its result by calling
 * the `submit_master_plan` MCP tool, which hits the server and routes here via
 * {@see completeFromAgentResult()}. There is no stdout to parse anymore.
 *
 * {@see complete()} is idempotent per run: the first completion wins, any
 * duplicate is suppressed via an atomic cache lock. The lock is reset by the
 * controller when a new decomposition starts (see {@see reset()}), so a
 * regenerate can emit again.
 */
class DecompositionStreamService
{
    /**
     * Dedup lock lifetime — long enough to span a decomposition run; reset on
     * every new decomposition start anyway.
     */
    private const DEDUP_TTL_SECONDS = 3600;

    public function __construct(
        private DecompositionService $decompositionService,
    ) {}

    /**
     * Completion path: the decomposition session submitted its plan through the
     * `submit_master_plan` MCP tool. Validates, stores `master_plan`, and
     * broadcasts `decompose:result`.
     *
     * @param array{success?: bool, plan?: ?array, error?: ?string} $data
     */
    public function completeFromAgentResult(SharedProject $project, array $data): void
    {
        if (!empty($data['success']) && !empty($data['plan'])) {
            $validation = $this->decompositionService->validateMasterPlan($data['plan']);

            $this->complete($project, [
                'success' => $validation['valid'],
                'plan' => $validation['plan'],
                'errors' => $validation['errors'],
            ]);

            return;
        }

        $this->complete($project, [
            'success' => false,
            'error' => $data['error'] ?? 'Unknown decomposition error',
        ]);
    }

    /**
     * Allow the next completion to be emitted for this project.
     * Called by the controller whenever a new decomposition starts.
     */
    public function reset(string $projectId): void
    {
        Cache::forget($this->dedupKey($projectId));
    }

    /**
     * Finalize a decomposition exactly once per run: persist the plan when
     * valid and broadcast the `decompose:result` the frontend awaits on
     * `private projects.{id}` (event `.project.broadcast`).
     *
     * @param array{success: bool, plan?: ?array, errors?: array, error?: ?string} $message
     */
    private function complete(SharedProject $project, array $message): void
    {
        // First completion wins — a duplicate (e.g. a retried submit) is
        // suppressed instead of double-broadcasting to the frontend.
        if (!Cache::add($this->dedupKey($project->id), 1, self::DEDUP_TTL_SECONDS)) {
            Log::debug('Decomposition result already emitted — duplicate suppressed', [
                'project_id' => $project->id,
            ]);

            return;
        }

        if (!empty($message['success']) && !empty($message['plan'])) {
            $project->update(['master_plan' => $message['plan']]);
        }

        // Slim signal: a full plan (waves × tasks × descriptions) exceeds
        // Reverb's max message size — broadcasting it raised "Pusher error:
        // Payload too large" and the frontend never saw the completion. The
        // plan is persisted above; clients refetch GET master-plan on signal.
        $signal = $message;
        unset($signal['plan']);
        $signal['has_plan'] = !empty($message['success']) && !empty($message['plan']);

        broadcast(new ProjectBroadcast($project, ['type' => 'decompose:result'] + $signal));
    }

    private function dedupKey(string $projectId): string
    {
        return "decompose:result_emitted:{$projectId}";
    }
}
