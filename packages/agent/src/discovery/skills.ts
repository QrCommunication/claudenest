/**
 * Skills discovery service
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { Logger } from '../utils/logger.js';
import type { Skill, DiscoveredCommand } from '../types/index.js';

interface SkillsDiscoveryOptions {
  projectPaths: string[];
  skillsDirs?: string[];
  logger: Logger;
}

interface SkillManifest {
  name: string;
  description: string;
  version: string;
  category: string;
  commands?: Array<{
    name: string;
    description: string;
    usage: string;
  }>;
  permissions?: string[];
  [key: string]: unknown;
}

const DEFAULT_SKILLS_DIRS = [
  '.claude/skills',
  '.claude/skills',
  'claude-skills',
];


export class SkillsDiscovery extends EventEmitter {
  private options: Required<SkillsDiscoveryOptions>;
  private logger: Logger;
  private skills = new Map<string, Skill>();
  private commands = new Map<string, DiscoveredCommand>();

  constructor(options: SkillsDiscoveryOptions) {
    super();
    this.options = {
      skillsDirs: DEFAULT_SKILLS_DIRS,
      ...options,
    };
    this.logger = options.logger.child({ component: 'SkillsDiscovery' });
  }

  /**
   * Initialize and scan for skills
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing skills discovery');
    await this.discoverAll();
  }

  /**
   * Discover all skills in configured paths
   */
  async discoverAll(): Promise<Skill[]> {
    this.logger.info('Discovering skills...');
    
    const discoveredSkills: Skill[] = [];

    for (const projectPath of this.options.projectPaths) {
      try {
        const skills = await this.discoverInPath(projectPath);
        discoveredSkills.push(...skills);
      } catch (error) {
        this.logger.error({ err: error }, `Failed to discover skills in ${projectPath}`);
      }
    }

    // Discover global skills from ~/.claude/skills/
    try {
      const globalSkills = await this.discoverGlobalSkills();
      for (const skill of globalSkills) {
        this.skills.set(skill.path, skill);
      }
      discoveredSkills.push(...globalSkills);
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to discover global skills');
    }

    // Discover global commands from ~/.claude/commands/
    try {
      await this.discoverGlobalCommands();
    } catch (error) {
      this.logger.error({ err: error }, 'Failed to discover global commands');
    }

    this.logger.info(`Discovered ${discoveredSkills.length} skills, ${this.commands.size} commands`);
    (this as any).emit('discovered', discoveredSkills);

    return discoveredSkills;
  }

  /**
   * Discover skills in a specific path
   */
  async discoverInPath(projectPath: string): Promise<Skill[]> {
    const discoveredSkills: Skill[] = [];

    for (const skillsDir of this.options.skillsDirs) {
      const fullPath = path.join(projectPath, skillsDir);
      
      try {
        const stat = await fs.stat(fullPath);
        if (!stat.isDirectory()) continue;

        const skills = await this.scanSkillsDirectory(fullPath);
        
        for (const skill of skills) {
          this.skills.set(skill.path, skill);
          discoveredSkills.push(skill);
          
          // Index commands
          if (skill.commands) {
            for (const cmd of skill.commands) {
              this.commands.set(cmd.name, {
                name: cmd.name,
                description: cmd.description,
                category: skill.category,
                source: skill.name,
              });
            }
          }
        }
      } catch (error) {
        // Directory doesn't exist, skip
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    return discoveredSkills;
  }

  /**
   * Scan a skills directory
   */
  private async scanSkillsDirectory(dirPath: string): Promise<Skill[]> {
    this.logger.debug(`Scanning skills directory: ${dirPath}`);
    
    const skills: Skill[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const skillPath = path.join(dirPath, entry.name);
      const manifestPath = path.join(skillPath, 'SKILL.md');

      try {
        const manifest = await this.loadSkillManifest(manifestPath, entry.name);
        if (manifest) {
          skills.push({
            name: manifest.name || entry.name,
            description: manifest.description || '',
            path: skillPath,
            version: manifest.version || '1.0.0',
            category: manifest.category || 'general',
            commands: manifest.commands || [],
            permissions: manifest.permissions || [],
            metadata: manifest,
          });
        }
      } catch (error) {
        this.logger.warn({ err: error }, `Failed to load skill manifest at ${manifestPath}`);
      }
    }

    return skills;
  }

  /**
   * Load a skill manifest from SKILL.md
   */
  private async loadSkillManifest(
    manifestPath: string, 
    defaultName: string
  ): Promise<SkillManifest | null> {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      
      // Try to parse as JSON first
      try {
        return JSON.parse(content) as SkillManifest;
      } catch {
        // Parse as Markdown frontmatter
        return this.parseMarkdownManifest(content, defaultName);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Parse markdown manifest with YAML frontmatter
   */
  private parseMarkdownManifest(content: string, defaultName: string): SkillManifest {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const lines = frontmatter.split('\n');
      const manifest: Record<string, unknown> = {};
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
          const value = valueParts.join(':').trim();
          
          // Try to parse as array or object
          if (value.startsWith('[') && value.endsWith(']')) {
            try {
              manifest[key.trim()] = JSON.parse(value);
              continue;
            } catch { /* fall through */ }
          }
          
          manifest[key.trim()] = value;
        }
      }
      
      return {
        name: (manifest.name as string) || defaultName,
        description: (manifest.description as string) || '',
        version: (manifest.version as string) || '1.0.0',
        category: (manifest.category as string) || 'general',
        commands: (manifest.commands as SkillManifest['commands']) || [],
        permissions: (manifest.permissions as string[]) || [],
        ...manifest,
      };
    }

    // No frontmatter, use defaults
    return {
      name: defaultName,
      description: content.slice(0, 200).replace(/\n/g, ' '),
      version: '1.0.0',
      category: 'general',
    };
  }

  /**
   * Discover global skills from ~/.claude/skills/ (Claude Code's native location)
   */
  private async discoverGlobalSkills(): Promise<Skill[]> {
    const claudeDir = path.join(os.homedir(), '.claude');
    const globalSkillsPath = path.join(claudeDir, 'skills');

    try {
      const stat = await fs.stat(globalSkillsPath);
      if (stat.isDirectory()) {
        const skills = await this.scanSkillsDirectory(globalSkillsPath);
        this.logger.info(`Found ${skills.length} global skills in ${globalSkillsPath}`);
        return skills;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return [];
  }

  /**
   * Discover global commands from ~/.claude/commands/
   */
  private async discoverGlobalCommands(): Promise<void> {
    const commandsPath = path.join(os.homedir(), '.claude', 'commands');

    try {
      const stat = await fs.stat(commandsPath);
      if (!stat.isDirectory()) return;

      const entries = await fs.readdir(commandsPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.md')) {
          await this.loadCommandFile(path.join(commandsPath, entry.name));
        } else if (entry.isDirectory()) {
          // Scan subdirectories for .md command files
          const subEntries = await fs.readdir(path.join(commandsPath, entry.name), { withFileTypes: true });
          for (const sub of subEntries) {
            if (sub.isFile() && sub.name.endsWith('.md')) {
              await this.loadCommandFile(path.join(commandsPath, entry.name, sub.name));
            }
          }
        }
      }

      this.logger.info(`Discovered ${this.commands.size} global commands from ${commandsPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.error({ err: error }, 'Failed to discover global commands');
      }
    }
  }

  /**
   * Load a single command .md file with YAML frontmatter
   */
  private async loadCommandFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

      const baseName = path.basename(filePath, '.md');
      const dirName = path.basename(path.dirname(filePath));
      // Use dir/name for nested commands, just name for top-level
      const cmdName = dirName === 'commands' ? baseName : `${dirName}/${baseName}`;

      let description = '';
      let category = 'command';

      if (frontmatterMatch) {
        const lines = frontmatterMatch[1].split('\n');
        for (const line of lines) {
          const [key, ...valueParts] = line.split(':');
          if (key?.trim() === 'description') {
            description = valueParts.join(':').trim();
          }
        }
      }

      this.commands.set(cmdName, {
        name: cmdName,
        description,
        category,
        source: 'claude-commands',
      });
    } catch (error) {
      this.logger.warn({ err: error }, `Failed to load command file: ${filePath}`);
    }
  }

  /**
   * Get all discovered skills
   */
  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get a specific skill by path
   */
  getSkill(path: string): Skill | undefined {
    return this.skills.get(path);
  }

  /**
   * Find skills by category
   */
  findByCategory(category: string): Skill[] {
    return this.getAllSkills().filter(s => s.category === category);
  }

  /**
   * Search skills by name or description
   */
  search(query: string): Skill[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllSkills().filter(s => 
      s.name.toLowerCase().includes(lowerQuery) ||
      s.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all discovered commands
   */
  getAllCommands(): DiscoveredCommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Refresh skills discovery
   */
  async refresh(): Promise<Skill[]> {
    this.skills.clear();
    this.commands.clear();
    return this.discoverAll();
  }

  /**
   * Add a skills directory to watch
   */
  addSkillsDirectory(dirPath: string): void {
    if (!this.options.skillsDirs.includes(dirPath)) {
      this.options.skillsDirs.push(dirPath);
    }
  }

  /**
   * Get skill file content
   */
  async getSkillContent(skillPath: string): Promise<string> {
    const skill = this.skills.get(skillPath);
    if (!skill) {
      throw new Error(`Skill not found: ${skillPath}`);
    }

    const readmePath = path.join(skillPath, 'SKILL.md');
    return fs.readFile(readmePath, 'utf-8');
  }

  /**
   * Install a skill from a path
   */
  async installSkill(sourcePath: string, name?: string): Promise<Skill> {
    const { getConfigDir } = await import('../utils/index.js');
    const configDir = getConfigDir();
    const globalSkillsPath = path.join(configDir, 'skills');
    
    // Ensure directory exists
    await fs.mkdir(globalSkillsPath, { recursive: true });
    
    const skillName = name || path.basename(sourcePath);
    const destPath = path.join(globalSkillsPath, skillName);
    
    // Copy skill directory
    await fs.cp(sourcePath, destPath, { recursive: true });
    
    this.logger.info(`Installed skill ${skillName} to ${destPath}`);
    
    // Reload skills
    await this.refresh();
    
    const skill = this.skills.get(destPath);
    if (!skill) {
      throw new Error('Failed to load installed skill');
    }
    
    return skill;
  }

  /**
   * Uninstall a skill
   */
  async uninstallSkill(skillPath: string): Promise<void> {
    const skill = this.skills.get(skillPath);
    if (!skill) {
      throw new Error(`Skill not found: ${skillPath}`);
    }

    await fs.rm(skillPath, { recursive: true, force: true });
    this.skills.delete(skillPath);
    
    this.logger.info(`Uninstalled skill: ${skill.name}`);
  }
}
