<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get aggregated dashboard statistics for the authenticated user.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $cacheKey = "dashboard_stats_{$user->id}";

        $data = Cache::remember($cacheKey, 30, function () use ($user) {
            return $this->buildStats($user);
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
                'cached' => Cache::has($cacheKey),
            ],
        ]);
    }

    private function buildStats($user): array
    {
        // Machines
        $machinesTotal = $user->machines()->count();
        $machinesOnline = $user->machines()->where('status', 'online')->count();

        // Sessions
        $sessionsActive = $user->sessions()->whereIn('status', ['running', 'active'])->count();
        $sessionsToday = $user->sessions()->whereDate('created_at', today())->count();

        // Projects
        $projectIds = $user->sharedProjects()->pluck('id');
        $projectsTotal = $projectIds->count();
        $projectsActive = $user->sharedProjects()
            ->whereHas('instances', fn ($q) => $q->where('status', 'active'))
            ->count();

        // Tasks
        $tasksPending = 0;
        $tasksInProgress = 0;
        $tasksDoneToday = 0;
        if ($projectIds->isNotEmpty()) {
            $tasksPending = DB::table('shared_tasks')
                ->whereIn('project_id', $projectIds)
                ->where('status', 'pending')
                ->count();

            $tasksInProgress = DB::table('shared_tasks')
                ->whereIn('project_id', $projectIds)
                ->where('status', 'in_progress')
                ->count();

            $tasksDoneToday = DB::table('shared_tasks')
                ->whereIn('project_id', $projectIds)
                ->where('status', 'done')
                ->whereDate('completed_at', today())
                ->count();
        }

        // Tokens & Cost
        $tokensTotal = $user->sessions()->sum('total_tokens');
        $tokensToday = $user->sessions()->whereDate('created_at', today())->sum('total_tokens');
        $costTotal = (float) $user->sessions()->sum('total_cost');
        $costToday = (float) $user->sessions()->whereDate('created_at', today())->sum('total_cost');

        // Locks
        $locksActive = 0;
        if ($projectIds->isNotEmpty()) {
            $locksActive = DB::table('file_locks')
                ->whereIn('project_id', $projectIds)
                ->where('expires_at', '>', now())
                ->count();
        }

        // Context chunks
        $contextChunksTotal = 0;
        if ($projectIds->isNotEmpty()) {
            $contextChunksTotal = DB::table('context_chunks')
                ->whereIn('project_id', $projectIds)
                ->count();
        }

        // Activity 24h
        $activity24h = 0;
        if ($projectIds->isNotEmpty()) {
            $activity24h = DB::table('activity_log')
                ->whereIn('project_id', $projectIds)
                ->where('created_at', '>=', now()->subDay())
                ->count();
        }

        // Sparklines (7 days)
        $sparklines = $this->buildSparklines($user, $projectIds);

        return [
            'machines' => ['total' => $machinesTotal, 'online' => $machinesOnline],
            'sessions' => ['active' => $sessionsActive, 'total_today' => $sessionsToday],
            'projects' => ['total' => $projectsTotal, 'active' => $projectsActive],
            'tasks' => ['pending' => $tasksPending, 'in_progress' => $tasksInProgress, 'done_today' => $tasksDoneToday],
            'tokens' => ['total' => (int) $tokensTotal, 'today' => (int) $tokensToday],
            'cost' => ['total' => round($costTotal, 2), 'today' => round($costToday, 2)],
            'locks' => ['active' => $locksActive],
            'context_chunks' => ['total' => $contextChunksTotal],
            'activity_24h' => $activity24h,
            'sparklines' => $sparklines,
        ];
    }

    private function buildSparklines($user, $projectIds): array
    {
        $days = collect(range(6, 0))->map(fn ($i) => now()->subDays($i)->toDateString());

        // Activity per day (last 7 days)
        $activityByDay = [];
        if ($projectIds->isNotEmpty()) {
            $activityByDay = DB::table('activity_log')
                ->whereIn('project_id', $projectIds)
                ->where('created_at', '>=', now()->subDays(7)->startOfDay())
                ->selectRaw('DATE(created_at) as day, COUNT(*) as cnt')
                ->groupBy('day')
                ->pluck('cnt', 'day')
                ->toArray();
        }

        // Sessions per day
        $sessionsByDay = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(7)->startOfDay())
            ->selectRaw('DATE(created_at) as day, COUNT(*) as cnt')
            ->groupBy('day')
            ->pluck('cnt', 'day')
            ->toArray();

        // Tokens per day
        $tokensByDay = DB::table('sessions')
            ->where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(7)->startOfDay())
            ->selectRaw('DATE(created_at) as day, COALESCE(SUM(total_tokens), 0) as cnt')
            ->groupBy('day')
            ->pluck('cnt', 'day')
            ->toArray();

        return [
            'activity_7d' => $days->map(fn ($d) => (int) ($activityByDay[$d] ?? 0))->values()->toArray(),
            'sessions_7d' => $days->map(fn ($d) => (int) ($sessionsByDay[$d] ?? 0))->values()->toArray(),
            'tokens_7d' => $days->map(fn ($d) => (int) ($tokensByDay[$d] ?? 0))->values()->toArray(),
        ];
    }
}
