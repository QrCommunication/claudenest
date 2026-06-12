<?php

namespace App\Services;

use App\Events\ProjectBroadcast;
use App\Models\SharedProject;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Routes the agent messages of ephemeral decomposition sessions into the
 * decomposition flow.
 *
 * PRD decomposition runs as a oneshot Claude session created agent-side with
 * the synthetic id `decompose-{projectId}-{timestamp}` — it has NO Session
 * row. The agent forwards the generic session lifecycle for it anyway
 * (session:output / session:status / session:exited), and those ids used to
 * reach `Session::find()` where PostgreSQL rejected them with
 * `SQLSTATE[22P02] invalid input syntax for type uuid`, dropping the whole
 * message ("Error handling agent message" in prod).
 *
 * This service is the routing target for those messages instead:
 *  - output chunks are accumulated in memory (agent:serve is a single
 *    long-running process, hence the singleton binding);
 *  - on exit the buffer is parsed server-side and the decomposition is
 *    finalized (master_plan stored + `decompose:result` broadcast), exactly
 *    like the agent's own `decompose:result` path.
 *
 * Both completion paths (server-side parse on session:exited, agent-side
 * `decompose:result`) converge on {@see complete()} which is idempotent per
 * decomposition run: the first completion wins, the other is suppressed via
 * an atomic cache lock. The lock is reset by the controller on each
 * `decompose:start` (see {@see reset()}), so a regenerate can emit again.
 *
 * Progress is intentionally NOT re-broadcast from the accumulated output:
 * the agent already streams throttled `decompose:progress` messages, and a
 * second progress source would duplicate text in the frontend accumulator.
 */
class DecompositionStreamService
{
    /** Prefix of agent-side ephemeral decomposition session ids. */
    public const SESSION_PREFIX = 'decompose-';

    /**
     * Output buffer hard cap. The plan JSON is printed at the END of the
     * oneshot output, so when the cap is hit we keep the TAIL of the stream.
     */
    private const MAX_BUFFER_BYTES = 2097152; // 2 MB

    /** Abandoned streams (exit never received) are pruned after this delay. */
    private const STREAM_TTL_SECONDS = 3600;

    /**
     * Dedup lock lifetime. Long enough to cover the gap between the two
     * completion paths; reset on every new decompose:start anyway.
     */
    private const DEDUP_TTL_SECONDS = 3600;

    /**
     * In-memory output buffers, keyed by ephemeral session id.
     * Only populated inside the agent:serve process.
     *
     * @var array<string, array{buffer: string, started_at: int}>
     */
    private array $streams = [];

    public function __construct(
        private DecompositionService $decompositionService,
    ) {}

    /**
     * Whether a session id belongs to an ephemeral decomposition session.
     */
    public function isDecomposeSessionId(string $sessionId): bool
    {
        return str_starts_with($sessionId, self::SESSION_PREFIX);
    }

    /**
     * Extract the project UUID from `decompose-{projectId}-{timestamp}`.
     * Returns null for malformed ids so callers never feed a non-UUID
     * string into a uuid-typed query.
     */
    public function extractProjectId(string $sessionId): ?string
    {
        if (!preg_match('/^decompose-([0-9a-fA-F-]{36})-\d+$/', $sessionId, $matches)) {
            return null;
        }

        return Str::isUuid($matches[1]) ? $matches[1] : null;
    }

    /**
     * Accumulate an output chunk of an ephemeral decomposition session.
     */
    public function handleOutput(string $sessionId, string $chunk): void
    {
        $this->pruneStaleStreams();

        if (!isset($this->streams[$sessionId])) {
            $this->streams[$sessionId] = ['buffer' => '', 'started_at' => time()];
        }

        $buffer = $this->streams[$sessionId]['buffer'] . $chunk;
        if (strlen($buffer) > self::MAX_BUFFER_BYTES) {
            // Keep the tail — the master plan JSON is the last thing printed.
            $buffer = substr($buffer, -self::MAX_BUFFER_BYTES);
        }

        $this->streams[$sessionId]['buffer'] = $buffer;
    }

    /**
     * The ephemeral decomposition session exited — parse the accumulated
     * output and finalize the decomposition (server-side completion path).
     */
    public function handleExited(string $sessionId): void
    {
        $buffer = $this->streams[$sessionId]['buffer'] ?? '';
        unset($this->streams[$sessionId]);

        $projectId = $this->extractProjectId($sessionId);
        if ($projectId === null) {
            Log::warning('Decompose session exited with malformed session id', [
                'session_id' => $sessionId,
            ]);

            return;
        }

        $project = SharedProject::find($projectId);
        if (!$project) {
            Log::warning('Decompose session exited for unknown project', [
                'session_id' => $sessionId,
                'project_id' => $projectId,
            ]);

            return;
        }

        $this->completeFromOutput($project, $buffer);
    }

    /**
     * Server-side completion path: parse the raw PTY output into a master
     * plan and finalize.
     */
    public function completeFromOutput(SharedProject $project, string $rawOutput): void
    {
        $parsed = $this->decompositionService->parseFromOutput($rawOutput);

        if ($parsed['success'] && $parsed['plan']) {
            $this->complete($project, [
                'success' => true,
                'plan' => $parsed['plan'],
                'errors' => [],
            ]);

            return;
        }

        $this->complete($project, [
            'success' => false,
            'error' => $parsed['error'] ?? 'Failed to parse master plan from decomposition output',
        ]);
    }

    /**
     * Agent-side completion path: the agent parsed its own buffer and sent a
     * `decompose:result` message. Payload shape mirrors the historical
     * onDecomposeResult contract.
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
     * Called by the controller on every decompose:start / regenerate.
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
        // First completion wins — the slower path (usually the agent's
        // decompose:result, which arrives after our session:exited parse) is
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

        broadcast(new ProjectBroadcast($project, ['type' => 'decompose:result'] + $message));
    }

    private function dedupKey(string $projectId): string
    {
        return "decompose:result_emitted:{$projectId}";
    }

    private function pruneStaleStreams(): void
    {
        $cutoff = time() - self::STREAM_TTL_SECONDS;

        foreach ($this->streams as $sessionId => $stream) {
            if ($stream['started_at'] < $cutoff) {
                unset($this->streams[$sessionId]);
            }
        }
    }
}
