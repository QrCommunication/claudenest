<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Documentation Controller
 * 
 * Serves the API documentation pages as a Vue.js SPA.
 * All methods return the main app view which loads the documentation Vue components.
 */
class DocumentationController extends Controller
{
    /**
     * API Overview documentation page.
     */
    public function index(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'API Documentation - ClaudeNest',
            'pageDescription' => 'Complete API documentation for ClaudeNest - manage machines, sessions, projects, and multi-agent collaboration.',
        ]);
    }

    /**
     * Authentication documentation page.
     */
    public function authentication(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Authentication API - ClaudeNest Documentation',
            'pageDescription' => 'Learn how to authenticate with the ClaudeNest API using tokens, OAuth, and API keys.',
        ]);
    }

    /**
     * Machines API documentation page.
     */
    public function machines(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Machines API - ClaudeNest Documentation',
            'pageDescription' => 'API reference for managing machines, agents, and Wake-on-LAN functionality.',
        ]);
    }

    /**
     * Sessions API documentation page.
     */
    public function sessions(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Sessions API - ClaudeNest Documentation',
            'pageDescription' => 'API reference for creating and managing Claude Code sessions.',
        ]);
    }

    /**
     * Projects API documentation page.
     */
    public function projects(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Projects API - ClaudeNest Documentation',
            'pageDescription' => 'API reference for multi-agent projects and shared context management.',
        ]);
    }

    /**
     * Tasks API documentation page.
     */
    public function tasks(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Tasks API - ClaudeNest Documentation',
            'pageDescription' => 'API reference for task management in multi-agent projects.',
        ]);
    }

    /**
     * Skills API documentation page.
     */
    public function skills(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Skills API - ClaudeNest Documentation',
            'pageDescription' => 'API reference for ClaudeNest Skills system.',
        ]);
    }

    /**
     * MCP (Model Context Protocol) API documentation page.
     */
    public function mcp(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'MCP API - ClaudeNest Documentation',
            'pageDescription' => 'API reference for Model Context Protocol integration.',
        ]);
    }

    /**
     * WebSocket protocol documentation page.
     */
    public function websocket(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'WebSocket Protocol - ClaudeNest Documentation',
            'pageDescription' => 'Real-time communication protocol for sessions and events.',
        ]);
    }

    /**
     * Error codes and troubleshooting documentation page.
     */
    public function errors(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'Error Reference - ClaudeNest Documentation',
            'pageDescription' => 'Complete error code reference and troubleshooting guide.',
        ]);
    }

    /**
     * SDK reference documentation page.
     */
    public function sdks(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'SDKs & Libraries - ClaudeNest Documentation',
            'pageDescription' => 'Official SDKs and libraries for ClaudeNest API integration.',
        ]);
    }

    /**
     * API Changelog documentation page.
     */
    public function changelog(): \Illuminate\View\View
    {
        return view('app', [
            'pageTitle' => 'API Changelog - ClaudeNest Documentation',
            'pageDescription' => 'History of API changes and version updates.',
        ]);
    }

    /**
     * OpenAPI specification download endpoint.
     */
    public function openapi(): JsonResponse
    {
        $openapiPath = public_path('openapi.yaml');
        
        if (!file_exists($openapiPath)) {
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
