<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeletePushTokenRequest;
use App\Http\Requests\StorePushTokenRequest;
use App\Http\Resources\PushTokenResource;
use App\Models\PushToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    /**
     * Register (upsert) an Expo push token for the authenticated user.
     *
     * POST /api/push-tokens
     */
    public function store(StorePushTokenRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $deviceInfo = [];
        if (! empty($validated['device_name'])) {
            $deviceInfo['name'] = $validated['device_name'];
        }

        $pushToken = PushToken::register(
            $request->user()->id,
            $validated['token'],
            $validated['platform'] ?? null,
            $deviceInfo,
        );

        return response()->json([
            'success' => true,
            'data' => new PushTokenResource($pushToken),
            'meta' => $this->meta($request),
        ], $pushToken->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Unregister an Expo push token (idempotent, scoped to the owner).
     *
     * DELETE /api/push-tokens
     */
    public function destroy(DeletePushTokenRequest $request): JsonResponse
    {
        $deleted = PushToken::forUser($request->user()->id)
            ->where('token', $request->validated()['token'])
            ->delete();

        return response()->json([
            'success' => true,
            'data' => [
                'deleted' => $deleted > 0,
            ],
            'meta' => $this->meta($request),
        ]);
    }

    /**
     * Helper: standard response metadata.
     */
    private function meta(Request $request): array
    {
        return [
            'timestamp' => now()->toIso8601String(),
            'request_id' => $request->header('X-Request-ID', uniqid()),
        ];
    }
}
