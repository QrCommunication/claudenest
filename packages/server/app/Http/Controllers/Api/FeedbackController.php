<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeedbackRequest;
use App\Mail\FeedbackMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class FeedbackController extends Controller
{
    /**
     * Recipient inbox for user feedback.
     */
    private const FEEDBACK_RECIPIENT = 'contact@qrcommunication.com';

    /**
     * Send user feedback by email to the support inbox.
     */
    public function feedback(StoreFeedbackRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        try {
            Mail::to(self::FEEDBACK_RECIPIENT)->send(new FeedbackMail(
                category: $validated['category'],
                feedbackSubject: $validated['subject'],
                userMessage: $validated['message'],
                userName: $user->name,
                userEmail: $user->email,
            ));
        } catch (\Throwable $e) {
            Log::error('Feedback email failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'EMAIL_FAILED',
                    'message' => 'The feedback email could not be sent. Please try again later.',
                ],
                'meta' => [
                    'timestamp' => now()->toIso8601String(),
                    'request_id' => $request->header('X-Request-ID', uniqid()),
                ],
            ], 502);
        }

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Feedback sent successfully.'],
            'meta' => [
                'timestamp' => now()->toIso8601String(),
                'request_id' => $request->header('X-Request-ID', uniqid()),
            ],
        ]);
    }
}
