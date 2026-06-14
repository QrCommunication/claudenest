<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\ClaudeInstance;
use App\Models\Epic;
use App\Models\Session;
use App\Models\SharedTask;
use App\Models\Sprint;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\TransientToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts multi-agent scoped Sanctum tokens (abilities: ['multiagent',
 * 'project:{uuid}']) to the minimal API surface a Claude instance needs:
 * tasks, locks, context, broadcast, instances, activity of ITS project only.
 *
 * Tokens carrying the additional 'planning' ability (planning agent sessions)
 * get a wider allowlist on the SAME scoped project: epics and sprints CRUD
 * (projects/{p}/epics*, projects/{p}/sprints*, epics/{id}*, sprints/{id}/*),
 * task edition (PATCH tasks/{task}), and execution control
 * (projects/{p}/orchestrator/*) — workers keep claim-only access.
 *
 * Has strictly NO effect on:
 * - cookie/session auth (TransientToken)
 * - machine tokens (mn_ prefix, handled by AuthenticateAgentToken)
 * - full-access tokens (['*'])
 * - any token without the 'multiagent' ability
 *
 * Registered as an *append* middleware of the `api` group. It runs before the
 * `auth:sanctum` route middleware, so the user is resolved explicitly through
 * the sanctum guard (idempotent — the guard caches the resolution).
 */
class RestrictScopedTokens
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        // No bearer (cookie/session auth) or machine token: not our concern.
        if (! $bearer || str_starts_with($bearer, 'mn_')) {
            return $next($request);
        }

        $token = $request->user('sanctum')?->currentAccessToken();

        if (! $token || $token instanceof TransientToken) {
            return $next($request);
        }

        if ($token->can('*') || ! $token->can('multiagent')) {
            return $next($request);
        }

        $scopedProjectId = $this->extractScopedProjectId($token->abilities ?? []);

        if ($scopedProjectId && $this->isAllowed(
            $request,
            $scopedProjectId,
            $token->can('planning'),
            $token->can('decompose'),
        )) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'AUTH_003',
                'message' => 'This token is scoped to multi-agent operations on a single project and cannot access this resource',
            ],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ], 403);
    }

    /**
     * @param  array<int, string>  $abilities
     */
    private function extractScopedProjectId(array $abilities): ?string
    {
        foreach ($abilities as $ability) {
            if (is_string($ability) && str_starts_with($ability, 'project:')) {
                $projectId = substr($ability, strlen('project:'));

                return $projectId !== '' ? $projectId : null;
            }
        }

        return null;
    }

    /**
     * Resolve a route parameter to its scalar key, whether the router gave us a
     * raw value or a bound Eloquent model (implicit route-model binding).
     */
    private function routeParamId(\Illuminate\Routing\Route $route, string $name): ?string
    {
        $param = $route->parameter($name);

        if ($param instanceof \Illuminate\Database\Eloquent\Model) {
            return (string) $param->getKey();
        }

        return $param === null ? null : (string) $param;
    }

    private function isAllowed(
        Request $request,
        string $scopedProjectId,
        bool $hasPlanning = false,
        bool $hasDecompose = false,
    ): bool {
        $route = $request->route();
        if (! $route) {
            return false;
        }

        $uri = $route->uri(); // e.g. 'api/projects/{project}/tasks/next-available'

        // ---- projects/{project}/... (own project only) ----
        if ($uri === 'api/projects/{project}' || str_starts_with($uri, 'api/projects/{project}/')) {
            // `{project}` is a raw ID on worker routes but a bound SharedProject
            // model on routes that type-hint it (e.g. decompose). Normalise both
            // to the key before comparing — a stringified model is NOT the ID.
            if ((string) $this->routeParamId($route, 'project') !== $scopedProjectId) {
                return false;
            }

            if ($uri === 'api/projects/{project}') {
                return $request->isMethod('GET');
            }

            $rest = substr($uri, strlen('api/projects/{project}/'));

            // Decomposition sessions get a SINGLE extra endpoint on their scoped
            // project: submitting the generated master plan. Nothing else — the
            // decompose token must not be able to claim work or mutate the backlog.
            if ($hasDecompose && $rest === 'decompose/submit') {
                return $request->isMethod('POST');
            }

            $prefixes = ['tasks', 'locks', 'context', 'broadcast', 'instances', 'activity'];

            // Planning agents structure the backlog (epics & sprints CRUD) and
            // launch execution (orchestrator start/stop/status of THEIR project).
            if ($hasPlanning) {
                $prefixes = array_merge($prefixes, ['epics', 'sprints', 'orchestrator']);
            }

            foreach ($prefixes as $prefix) {
                if ($rest === $prefix || str_starts_with($rest, $prefix.'/')) {
                    return true;
                }
            }

            return false;
        }

        // ---- tasks/{task} + tasks/{task}/* (task must belong to the scoped project) ----
        if ($uri === 'api/tasks/{task}' || str_starts_with($uri, 'api/tasks/{task}/')) {
            // Bare tasks/{task}: read-only for workers (claim/release/complete
            // live on sub-routes). Planning tokens may also edit (PATCH).
            if ($uri === 'api/tasks/{task}' && ! $request->isMethod('GET')) {
                if (! ($hasPlanning && $request->isMethod('PATCH'))) {
                    return false;
                }
            }

            $task = SharedTask::find((string) $route->parameter('task'));

            return $task !== null && $task->project_id === $scopedProjectId;
        }

        // ---- epics/{epic} + epics/{epic}/* (planning ability, own project only) ----
        if ($uri === 'api/epics/{epic}' || str_starts_with($uri, 'api/epics/{epic}/')) {
            if (! $hasPlanning) {
                return false;
            }

            $epic = Epic::find((string) $route->parameter('epic'));

            return $epic !== null && $epic->project_id === $scopedProjectId;
        }

        // ---- sprints/{sprint} + sprints/{sprint}/* (planning ability, own project only) ----
        if ($uri === 'api/sprints/{sprint}' || str_starts_with($uri, 'api/sprints/{sprint}/')) {
            if (! $hasPlanning) {
                return false;
            }

            $sprint = Sprint::find((string) $route->parameter('sprint'));

            return $sprint !== null && $sprint->project_id === $scopedProjectId;
        }

        // ---- instances/{instanceId}/heartbeat|disconnect (instance of the scoped project) ----
        if ($uri === 'api/instances/{instanceId}/heartbeat' || $uri === 'api/instances/{instanceId}/disconnect') {
            $instance = ClaudeInstance::find((string) $route->parameter('instanceId'));

            return $instance !== null && $instance->project_id === $scopedProjectId;
        }

        // ---- sessions/{session}/notification (session bound to the scoped project) ----
        if ($uri === 'api/sessions/{session}/notification') {
            $session = Session::find((string) $route->parameter('session'));

            return $session !== null && $session->shared_project_id === $scopedProjectId;
        }

        return false;
    }
}
