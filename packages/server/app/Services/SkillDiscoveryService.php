<?php

namespace App\Services;

use App\Models\Machine;
use App\Models\Skill;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Yaml\Yaml;

/**
 * Service for discovering and parsing skills from the filesystem.
 * 
 * Skills are markdown files located in ~/.claude/skills/ directory
 * that contain frontmatter metadata and markdown content.
 */
class SkillDiscoveryService
{
    /**
     * The base directory for skills discovery.
     */
    protected string $skillsBasePath;

    /**
     * Create a new skill discovery service instance.
     */
    public function __construct()
    {
        $this->skillsBasePath = config('claudenest.skills.path', '~/.claude/skills');
    }

    /**
     * Discover all skills for a machine.
     * 
     * Scans the skills directory for .md files and parses their content
     * to extract metadata and content.
     *
     * @param string $machineId The machine ID to discover skills for
     * @return array Array of discovered skills with metadata
     */
    public function discover(string $machineId): array
    {
        $machine = Machine::find($machineId);
        
        if (!$machine) {
            Log::warning('Skill discovery failed: Machine not found', ['machine_id' => $machineId]);
            return [];
        }

        $skillsPath = $this->resolveSkillsPath($machine);
        
        if (!File::isDirectory($skillsPath)) {
            Log::info('Skills directory does not exist', ['path' => $skillsPath]);
            return [];
        }

        $skills = [];
        $files = File::glob("{$skillsPath}/**/*.md");

        foreach ($files as $file) {
            try {
                $skill = $this->parseSkillFile($file, $skillsPath);
                if ($skill) {
                    $skills[] = $skill;
                }
            } catch (\Exception $e) {
                Log::error('Failed to parse skill file', [
                    'file' => $file,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Sort by name
        usort($skills, fn ($a, $b) => strcmp($a['name'], $b['name']));

        Log::info('Skill discovery completed', [
            'machine_id' => $machineId,
            'count' => count($skills),
        ]);

        return $skills;
    }

    /**
     * Parse a single skill file.
     *
     * @param string $filePath Full path to the skill file
     * @param string $basePath Base skills directory for relative path calculation
     * @return array|null Parsed skill data or null if invalid
     */
    public function parseSkillFile(string $filePath, string $basePath): ?array
    {
        if (!File::exists($filePath)) {
            return null;
        }

        $content = File::get($filePath);
        $parsed = $this->parseSkill($content);

        if (!$parsed) {
            return null;
        }

        // Calculate relative path from skills directory
        $relativePath = ltrim(str_replace($basePath, '', $filePath), '/');

        return [
            'path' => $relativePath,
            'full_path' => $filePath,
            'name' => $parsed['name'] ?? pathinfo($filePath, PATHINFO_FILENAME),
            'description' => $parsed['description'] ?? '',
            'version' => $parsed['version'] ?? '1.0.0',
            'category' => $parsed['category'] ?? 'general',
            'tags' => $parsed['tags'] ?? [],
            'author' => $parsed['author'] ?? null,
            'content' => $parsed['content'] ?? '',
            'frontmatter' => $parsed['frontmatter'] ?? [],
            'last_modified' => File::lastModified($filePath),
        ];
    }

    /**
     * Parse skill content to extract frontmatter and markdown.
     *
     * Supports both YAML frontmatter (---) and TOML-style (+++) formats.
     *
     * @param string $content The raw skill file content
     * @return array|null Parsed skill data with name, description, version, author, category, content
     */
    public function parseSkill(string $content): ?array
    {
        $content = trim($content);
        
        if (empty($content)) {
            return null;
        }

        // Try YAML frontmatter (---)
        if (str_starts_with($content, '---')) {
            return $this->parseYamlFrontmatter($content);
        }

        // Try TOML frontmatter (+++)
        if (str_starts_with($content, '+++')) {
            return $this->parseTomlFrontmatter($content);
        }

        // No frontmatter, treat as plain markdown
        return [
            'name' => null,
            'description' => null,
            'version' => '1.0.0',
            'category' => 'general',
            'author' => null,
            'tags' => [],
            'content' => $content,
            'frontmatter' => [],
        ];
    }

    /**
     * Parse YAML frontmatter.
     *
     * @param string $content The content with YAML frontmatter
     * @return array Parsed data
     */
    protected function parseYamlFrontmatter(string $content): array
    {
        // Match frontmatter between --- delimiters
        if (!preg_match('/^---\s*\n(.*?)\n---\s*\n(.*)$/s', $content, $matches)) {
            // Malformed frontmatter, treat as content only
            return [
                'name' => null,
                'description' => null,
                'version' => '1.0.0',
                'category' => 'general',
                'author' => null,
                'tags' => [],
                'content' => $content,
                'frontmatter' => [],
            ];
        }

        $frontmatterText = $matches[1];
        $markdownContent = $matches[2];

        try {
            $frontmatter = Yaml::parse($frontmatterText) ?: [];
        } catch (\Exception $e) {
            Log::warning('Failed to parse YAML frontmatter', ['error' => $e->getMessage()]);
            $frontmatter = [];
        }

        return [
            'name' => $frontmatter['name'] ?? $frontmatter['title'] ?? null,
            'description' => $frontmatter['description'] ?? null,
            'version' => $frontmatter['version'] ?? '1.0.0',
            'category' => $frontmatter['category'] ?? 'general',
            'author' => $frontmatter['author'] ?? null,
            'tags' => $frontmatter['tags'] ?? [],
            'content' => trim($markdownContent),
            'frontmatter' => $frontmatter,
        ];
    }

    /**
     * Parse TOML-style frontmatter.
     *
     * @param string $content The content with TOML frontmatter
     * @return array Parsed data
     */
    protected function parseTomlFrontmatter(string $content): array
    {
        // Match frontmatter between +++ delimiters
        if (!preg_match('/^\+\+\+\s*\n(.*?)\n\+\+\+\s*\n(.*)$/s', $content, $matches)) {
            return [
                'name' => null,
                'description' => null,
                'version' => '1.0.0',
                'category' => 'general',
                'author' => null,
                'tags' => [],
                'content' => $content,
                'frontmatter' => [],
            ];
        }

        $frontmatterText = $matches[1];
        $markdownContent = $matches[2];

        // Simple TOML parsing for basic key-value pairs
        $frontmatter = [];
        foreach (explode("\n", $frontmatterText) as $line) {
            if (strpos($line, '=') !== false) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value, ' "\'');
                $frontmatter[$key] = $value;
            }
        }

        return [
            'name' => $frontmatter['name'] ?? $frontmatter['title'] ?? null,
            'description' => $frontmatter['description'] ?? null,
            'version' => $frontmatter['version'] ?? '1.0.0',
            'category' => $frontmatter['category'] ?? 'general',
            'author' => $frontmatter['author'] ?? null,
            'tags' => $this->parseTags($frontmatter['tags'] ?? ''),
            'content' => trim($markdownContent),
            'frontmatter' => $frontmatter,
        ];
    }

    /**
     * Parse tags string into array.
     *
     * @param string|array $tags Tags as string or array
     * @return array Parsed tags
     */
    protected function parseTags(string|array $tags): array
    {
        if (is_array($tags)) {
            return $tags;
        }

        if (empty($tags)) {
            return [];
        }

        // Handle comma-separated or array-like string
        $tags = trim($tags, '[]');
        return array_map('trim', explode(',', $tags));
    }

    /**
     * Read skill content from file.
     *
     * @param string $machineId The machine ID
     * @param string $path Relative path to the skill file
     * @return array|null Skill content or null if not found
     */
    public function readSkill(string $machineId, string $path): ?array
    {
        $machine = Machine::find($machineId);
        
        if (!$machine) {
            return null;
        }

        $skillsPath = $this->resolveSkillsPath($machine);
        $fullPath = "{$skillsPath}/{$path}";

        // Security: ensure the path is within the skills directory
        $realSkillsPath = realpath($skillsPath);
        $realFullPath = realpath($fullPath);

        if (!$realFullPath || !str_starts_with($realFullPath, $realSkillsPath)) {
            Log::warning('Attempted path traversal in skill read', [
                'machine_id' => $machineId,
                'path' => $path,
            ]);
            return null;
        }

        if (!File::exists($fullPath)) {
            return null;
        }

        return $this->parseSkillFile($fullPath, $skillsPath);
    }

    /**
     * Write skill content to file.
     *
     * @param string $machineId The machine ID
     * @param string $path Relative path to the skill file
     * @param array $data Skill data with name, description, version, category, content, etc.
     * @return bool Whether the write was successful
     */
    public function writeSkill(string $machineId, string $path, array $data): bool
    {
        $machine = Machine::find($machineId);
        
        if (!$machine) {
            return false;
        }

        $skillsPath = $this->resolveSkillsPath($machine);
        $fullPath = "{$skillsPath}/{$path}";

        // Security: ensure the path is within the skills directory
        $realSkillsPath = realpath($skillsPath) ?: $skillsPath;
        $targetDir = dirname($fullPath);
        
        if (!File::isDirectory($targetDir)) {
            File::makeDirectory($targetDir, 0755, true);
        }

        $realFullPath = realpath($fullPath) ?: $fullPath;
        $realTargetDir = realpath($targetDir) ?: $targetDir;

        if (!str_starts_with($realTargetDir, $realSkillsPath)) {
            Log::warning('Attempted path traversal in skill write', [
                'machine_id' => $machineId,
                'path' => $path,
            ]);
            return false;
        }

        try {
            $content = $this->buildSkillContent($data);
            File::put($fullPath, $content);
            
            Log::info('Skill file written', [
                'machine_id' => $machineId,
                'path' => $path,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to write skill file', [
                'machine_id' => $machineId,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Delete a skill file.
     *
     * @param string $machineId The machine ID
     * @param string $path Relative path to the skill file
     * @return bool Whether the deletion was successful
     */
    public function deleteSkill(string $machineId, string $path): bool
    {
        $machine = Machine::find($machineId);
        
        if (!$machine) {
            return false;
        }

        $skillsPath = $this->resolveSkillsPath($machine);
        $fullPath = "{$skillsPath}/{$path}";

        // Security: ensure the path is within the skills directory
        $realSkillsPath = realpath($skillsPath);
        $realFullPath = realpath($fullPath);

        if (!$realFullPath || !str_starts_with($realFullPath, $realSkillsPath)) {
            Log::warning('Attempted path traversal in skill delete', [
                'machine_id' => $machineId,
                'path' => $path,
            ]);
            return false;
        }

        if (!File::exists($fullPath)) {
            return false;
        }

        try {
            File::delete($fullPath);
            
            Log::info('Skill file deleted', [
                'machine_id' => $machineId,
                'path' => $path,
            ]);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to delete skill file', [
                'machine_id' => $machineId,
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build skill file content from data.
     *
     * @param array $data Skill data
     * @return string Formatted skill content
     */
    protected function buildSkillContent(array $data): string
    {
        $frontmatter = [
            'name' => $data['name'] ?? 'Untitled Skill',
            'description' => $data['description'] ?? '',
            'version' => $data['version'] ?? '1.0.0',
            'category' => $data['category'] ?? 'general',
        ];

        if (!empty($data['author'])) {
            $frontmatter['author'] = $data['author'];
        }

        if (!empty($data['tags'])) {
            $frontmatter['tags'] = $data['tags'];
        }

        // Build YAML frontmatter
        $yaml = Yaml::dump($frontmatter, 2, 4, Yaml::DUMP_MULTI_LINE_LITERAL_BLOCK);
        
        $content = $data['content'] ?? '';
        
        return "---\n{$yaml}---\n\n{$content}";
    }

    /**
     * Resolve the skills path for a machine.
     *
     * @param Machine $machine The machine model
     * @return string Resolved absolute path
     */
    protected function resolveSkillsPath(Machine $machine): string
    {
        $path = $this->skillsBasePath;

        // Expand home directory
        if (str_starts_with($path, '~')) {
            $path = str_replace('~', getenv('HOME') ?: $_SERVER['HOME'] ?? '/tmp', $path);
        }

        // For remote machines, we might use a different path or sync mechanism
        // For now, we'll use a machine-specific subdirectory
        return "{$path}/{$machine->id}";
    }

    /**
     * Get available skill categories.
     *
     * @return array List of category names
     */
    public function getCategories(): array
    {
        return Skill::CATEGORIES;
    }

    /**
     * Sync discovered skills with database.
     *
     * @param string $machineId The machine ID
     * @return array Sync results with created, updated, and deleted counts
     */
    public function syncWithDatabase(string $machineId): array
    {
        $discovered = $this->discover($machineId);
        $results = [
            'created' => 0,
            'updated' => 0,
            'deleted' => 0,
            'unchanged' => 0,
        ];

        $existingPaths = Skill::forMachine($machineId)->pluck('path')->toArray();
        $discoveredPaths = [];

        foreach ($discovered as $skillData) {
            $discoveredPaths[] = $skillData['path'];
            
            $existing = Skill::forMachine($machineId)
                ->byPath($skillData['path'])
                ->first();

            if ($existing) {
                // Check if update is needed
                $needsUpdate = 
                    $existing->name !== $skillData['name'] ||
                    $existing->description !== $skillData['description'] ||
                    $existing->version !== $skillData['version'] ||
                    $existing->category !== $skillData['category'];

                if ($needsUpdate) {
                    $existing->update([
                        'name' => $skillData['name'],
                        'description' => $skillData['description'],
                        'version' => $skillData['version'],
                        'category' => $skillData['category'],
                        'tags' => $skillData['tags'],
                    ]);
                    $results['updated']++;
                } else {
                    $results['unchanged']++;
                }
            } else {
                // Create new skill
                Skill::create([
                    'machine_id' => $machineId,
                    'name' => $skillData['name'],
                    'description' => $skillData['description'],
                    'category' => $skillData['category'],
                    'path' => $skillData['path'],
                    'version' => $skillData['version'],
                    'enabled' => true,
                    'tags' => $skillData['tags'],
                    'discovered_at' => now(),
                ]);
                $results['created']++;
            }
        }

        // Mark skills that no longer exist on filesystem
        $removedPaths = array_diff($existingPaths, $discoveredPaths);
        if (!empty($removedPaths)) {
            Skill::forMachine($machineId)
                ->whereIn('path', $removedPaths)
                ->delete();
            $results['deleted'] = count($removedPaths);
        }

        return $results;
    }
}
