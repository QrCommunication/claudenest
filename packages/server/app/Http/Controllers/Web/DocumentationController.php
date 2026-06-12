<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Documentation Controller
 *
 * Documentation pages themselves are served by the Vue SPA (catch-all route
 * in routes/web.php) with per-route meta resolved from config/seo.php.
 * This controller only exposes machine-readable documentation artifacts.
 */
class DocumentationController extends Controller
{
    /**
     * OpenAPI specification download endpoint.
     */
    public function openapi(): JsonResponse|BinaryFileResponse
    {
        $openapiPath = public_path('openapi.yaml');

        if (! file_exists($openapiPath)) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'DOC_001',
                    'message' => 'OpenAPI specification not found',
                ],
            ], 404);
        }

        return response()->file($openapiPath, [
            'Content-Type' => 'application/x-yaml',
            'Content-Disposition' => 'inline; filename="claudenest-openapi.yaml"',
        ]);
    }
}
