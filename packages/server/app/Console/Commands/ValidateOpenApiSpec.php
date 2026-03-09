<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class ValidateOpenApiSpec extends Command
{
    protected $signature = 'openapi:validate';

    protected $description = 'Compare Laravel API routes against the generated OpenAPI spec';

    public function handle(): int
    {
        $this->info('Validating OpenAPI spec against registered routes...');
        $this->newLine();

        // Get all API routes
        $apiRoutes = collect(Route::getRoutes()->getRoutes())
            ->filter(fn ($route) => str_starts_with($route->uri(), 'api/'))
            ->filter(fn ($route) => !str_starts_with($route->uri(), 'api/documentation'))
            ->filter(fn ($route) => !str_starts_with($route->uri(), 'api/docs'))
            ->map(fn ($route) => [
                'method' => collect($route->methods())->filter(fn ($m) => $m !== 'HEAD')->first(),
                'uri' => '/' . $route->uri(),
                'name' => $route->getName(),
                'action' => $route->getActionName(),
            ])
            ->values();

        // Try to load the generated spec
        $specPath = storage_path('api-docs/api-docs.json');
        if (!file_exists($specPath)) {
            $this->warn('OpenAPI spec not found at ' . $specPath);
            $this->warn('Run "php artisan l5-swagger:generate" first.');
            return self::FAILURE;
        }

        $spec = json_decode(file_get_contents($specPath), true);
        $paths = $spec['paths'] ?? [];

        // Build a set of documented paths
        $documented = collect();
        foreach ($paths as $path => $methods) {
            foreach (array_keys($methods) as $method) {
                if (in_array($method, ['get', 'post', 'put', 'patch', 'delete'])) {
                    $documented->push(strtoupper($method) . ' ' . $path);
                }
            }
        }

        // Compare
        $missing = [];
        $covered = [];

        foreach ($apiRoutes as $route) {
            $method = strtoupper($route['method']);
            $uri = $route['uri'];

            // Normalize Laravel route params {id} to OpenAPI {id}
            $normalizedUri = preg_replace('/\{([^}]+)\}/', '{$1}', $uri);

            $key = $method . ' ' . $normalizedUri;

            // Check if documented (also try with different param names)
            $found = $documented->contains(function ($docEntry) use ($key, $method, $normalizedUri) {
                if ($docEntry === $key) {
                    return true;
                }
                // Fuzzy match: replace all {param} with a regex
                $pattern = preg_replace('/\{[^}]+\}/', '{[^}]+}', preg_quote($method . ' ' . $normalizedUri, '/'));
                return preg_match('/^' . $pattern . '$/', $docEntry);
            });

            if ($found) {
                $covered[] = $route;
            } else {
                $missing[] = $route;
            }
        }

        // Report
        $total = count($apiRoutes);
        $coveredCount = count($covered);
        $missingCount = count($missing);
        $percentage = $total > 0 ? round(($coveredCount / $total) * 100, 1) : 0;

        $this->info("Total API routes: {$total}");
        $this->info("Documented: {$coveredCount} ({$percentage}%)");

        if ($missingCount > 0) {
            $this->newLine();
            $this->warn("Missing documentation ({$missingCount} routes):");
            $this->newLine();

            $this->table(
                ['Method', 'URI', 'Controller'],
                collect($missing)->map(fn ($r) => [
                    $r['method'],
                    $r['uri'],
                    class_basename($r['action']),
                ])->toArray()
            );

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('All API routes are documented!');

        return self::SUCCESS;
    }
}
