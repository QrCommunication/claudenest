/**
 * Project scan handler — scans a local directory and returns tech stack info
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { WebSocketClient } from '../websocket/client.js';
import type { Logger } from '../types/index.js';
import type { ProjectScanRequest, ProjectScanResult } from '../types/index.js';

interface HandlerContext {
  wsClient: WebSocketClient;
  logger: Logger;
}

/** Manifest files → tech stack labels */
const TECH_DETECTORS: Record<string, string[]> = {
  'package.json': ['node'],
  'composer.json': ['php'],
  'Cargo.toml': ['rust'],
  'go.mod': ['go'],
  'pyproject.toml': ['python'],
  'requirements.txt': ['python'],
  'Gemfile': ['ruby'],
  'pom.xml': ['java', 'maven'],
  'build.gradle': ['java', 'gradle'],
  'CMakeLists.txt': ['cpp', 'cmake'],
  'Makefile': ['make'],
};

/** Framework detectors inside package.json dependencies */
const NPM_FRAMEWORK_DETECTORS: Record<string, string> = {
  'react': 'react',
  'next': 'nextjs',
  'vue': 'vue',
  'nuxt': 'nuxt',
  'svelte': 'svelte',
  '@angular/core': 'angular',
  'express': 'express',
  'fastify': 'fastify',
  'nestjs': 'nestjs',
  '@nestjs/core': 'nestjs',
  'tailwindcss': 'tailwind',
  'typescript': 'typescript',
  'vite': 'vite',
  'electron': 'electron',
  'react-native': 'react-native',
  'expo': 'expo',
};

/** Composer framework detectors */
const COMPOSER_FRAMEWORK_DETECTORS: Record<string, string> = {
  'laravel/framework': 'laravel',
  'symfony/framework-bundle': 'symfony',
  'wordpress': 'wordpress',
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonSafe(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function detectTechStack(projectPath: string): Promise<string[]> {
  const stack = new Set<string>();

  // Check manifest files
  for (const [file, techs] of Object.entries(TECH_DETECTORS)) {
    if (await fileExists(path.join(projectPath, file))) {
      techs.forEach(t => stack.add(t));
    }
  }

  // Deep-scan package.json for npm frameworks
  const pkg = await readJsonSafe(path.join(projectPath, 'package.json'));
  if (pkg) {
    const allDeps = {
      ...(pkg.dependencies as Record<string, string> || {}),
      ...(pkg.devDependencies as Record<string, string> || {}),
    };
    for (const [dep, label] of Object.entries(NPM_FRAMEWORK_DETECTORS)) {
      if (dep in allDeps) {
        stack.add(label);
      }
    }
  }

  // Deep-scan composer.json for PHP frameworks
  const composer = await readJsonSafe(path.join(projectPath, 'composer.json'));
  if (composer) {
    const allDeps = {
      ...(composer.require as Record<string, string> || {}),
      ...(composer['require-dev'] as Record<string, string> || {}),
    };
    for (const [dep, label] of Object.entries(COMPOSER_FRAMEWORK_DETECTORS)) {
      if (dep in allDeps) {
        stack.add(label);
      }
    }
  }

  // Check for Docker
  if (await fileExists(path.join(projectPath, 'Dockerfile')) ||
      await fileExists(path.join(projectPath, 'docker-compose.yml')) ||
      await fileExists(path.join(projectPath, 'docker-compose.yaml'))) {
    stack.add('docker');
  }

  return [...stack];
}

async function getDirectoryStructure(projectPath: string, maxDepth = 2): Promise<string[]> {
  const results: string[] = [];
  const ignoreDirs = new Set([
    'node_modules', '.git', 'vendor', '.next', '.nuxt', 'dist',
    'build', '__pycache__', '.cache', '.turbo', 'target',
  ]);

  async function walk(dir: string, depth: number, prefix: string): Promise<void> {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    // Sort: dirs first, then files
    entries.sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    for (const entry of entries) {
      if (ignoreDirs.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;

      const indicator = entry.isDirectory() ? '/' : '';
      results.push(`${prefix}${entry.name}${indicator}`);

      if (entry.isDirectory() && depth < maxDepth) {
        await walk(path.join(dir, entry.name), depth + 1, prefix + '  ');
      }
    }
  }

  await walk(projectPath, 0, '');
  return results.slice(0, 200); // Cap output
}

export function createScanHandlers(context: HandlerContext) {
  const { wsClient, logger } = context;

  async function handleProjectScan(payload: ProjectScanRequest): Promise<void> {
    const { requestId, path: projectPath } = payload;
    logger.info({ requestId, path: projectPath }, 'Scanning project');

    try {
      // Validate path exists
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) {
        wsClient.send('project:scan_result', {
          requestId,
          projectName: '',
          techStack: [],
          hasGit: false,
          readme: null,
          structure: [],
          error: 'Path is not a directory',
        } satisfies ProjectScanResult);
        return;
      }

      // Run all scans in parallel
      const [techStack, hasGit, readme, structure] = await Promise.all([
        detectTechStack(projectPath),
        fileExists(path.join(projectPath, '.git')),
        readReadme(projectPath),
        getDirectoryStructure(projectPath),
      ]);

      const projectName = path.basename(projectPath);

      const result: ProjectScanResult = {
        requestId,
        projectName,
        techStack,
        hasGit,
        readme,
        structure,
      };

      logger.info({ requestId, techStack, hasGit }, 'Project scan complete');
      wsClient.send('project:scan_result', result);
    } catch (error) {
      logger.error({ err: error, requestId }, 'Project scan failed');
      wsClient.send('project:scan_result', {
        requestId,
        projectName: '',
        techStack: [],
        hasGit: false,
        readme: null,
        structure: [],
        error: error instanceof Error ? error.message : 'Scan failed',
      } satisfies ProjectScanResult);
    }
  }

  return {
    'project:scan': handleProjectScan,
  };
}

async function readReadme(projectPath: string): Promise<string | null> {
  const candidates = ['README.md', 'readme.md', 'README.rst', 'README.txt', 'README'];
  for (const name of candidates) {
    try {
      const content = await fs.readFile(path.join(projectPath, name), 'utf-8');
      // Truncate to 5000 chars to avoid huge payloads
      return content.length > 5000 ? content.slice(0, 5000) + '\n\n[...truncated]' : content;
    } catch {
      continue;
    }
  }
  return null;
}
