<?php

namespace Database\Seeders;

use App\Models\Machine;
use App\Models\Skill;
use App\Services\SkillDiscoveryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class SkillSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first machine or create a default one
        $machine = Machine::first();
        
        if (!$machine) {
            $this->command->warn('No machines found. Skipping skill seeding.');
            return;
        }

        $this->command->info("Seeding default skills for machine: {$machine->name}");

        // Get skills from the seeder directory
        $skillsPath = database_path('seeders/skills');
        
        if (!File::isDirectory($skillsPath)) {
            $this->command->warn("Skills directory not found: {$skillsPath}");
            return;
        }

        $skillFiles = File::glob("{$skillsPath}/*.md");
        
        if (empty($skillFiles)) {
            $this->command->warn('No skill files found to seed.');
            return;
        }

        $discoveryService = app(SkillDiscoveryService::class);
        $seededCount = 0;

        foreach ($skillFiles as $file) {
            try {
                $content = File::get($file);
                $parsed = $discoveryService->parseSkill($content);
                
                if (!$parsed) {
                    $this->command->warn("Failed to parse skill: {$file}");
                    continue;
                }

                $filename = pathinfo($file, PATHINFO_FILENAME);
                $path = "seeded/{$filename}.md";

                // Check if skill already exists
                $existing = Skill::forMachine($machine->id)
                    ->byPath($path)
                    ->first();

                if ($existing) {
                    $this->command->info("  Skipping existing skill: {$parsed['name']}");
                    continue;
                }

                // Create the skill
                Skill::create([
                    'machine_id' => $machine->id,
                    'name' => $parsed['name'] ?? $filename,
                    'display_name' => $parsed['name'] ?? $filename,
                    'description' => $parsed['description'],
                    'category' => $parsed['category'] ?? 'general',
                    'path' => $path,
                    'version' => $parsed['version'] ?? '1.0.0',
                    'enabled' => true,
                    'config' => [
                        'content' => $parsed['content'],
                        'author' => $parsed['author'],
                    ],
                    'tags' => $parsed['tags'] ?? [],
                    'discovered_at' => now(),
                ]);

                $this->command->info("  Seeded skill: {$parsed['name']}");
                $seededCount++;
            } catch (\Exception $e) {
                $this->command->error("  Error seeding skill {$file}: {$e->getMessage()}");
                Log::error('Skill seeding failed', [
                    'file' => $file,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->command->info("Successfully seeded {$seededCount} skills.");
    }
}
