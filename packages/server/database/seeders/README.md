# Database Seeders

## Available Seeders

### SkillSeeder
Seeds default skills for ClaudeNest machines.

### DemoSeeder
Comprehensive demo data seeder that creates:
- 1 Demo user (demo@claudenest.com / password)
- 2 Machines (MacBook Pro - online, Ubuntu Server - offline)
- 1 Shared Project (E-commerce API)
- 7 Context Chunks (realistic code, docs, decisions)
- 5 Shared Tasks (various statuses and priorities)
- 2 Claude Instances (one idle, one busy)
- 2 Sessions (one running, one completed)
- 3 Skills (code-generation, debugging, test-generator)
- 2 MCP Servers (GitHub, Filesystem)
- 5 Discovered Commands (npm, git, docker)

## Usage

### Seed all data (includes SkillSeeder + DemoSeeder)
```bash
# Uncomment DemoSeeder in DatabaseSeeder.php first
php artisan db:seed
```

### Seed only demo data
```bash
php artisan db:seed --class=DemoSeeder
```

### Seed only skills
```bash
php artisan db:seed --class=SkillSeeder
```

### Fresh migration with seeders
```bash
php artisan migrate:fresh --seed
```

## Demo Credentials

After running DemoSeeder, you can log in with:
- **Email**: demo@claudenest.com
- **Password**: password

## Idempotent Design

The DemoSeeder is designed to be idempotent:
- Checks if demo user already exists before creating
- Can be run multiple times safely
- Will skip user creation if already exists

## Realistic Data

All demo data is designed to be realistic and useful for:
- Demonstrating ClaudeNest features
- Testing the UI/UX
- Creating screenshots and videos
- Onboarding new users
- Development and debugging

The e-commerce API project includes:
- Realistic architecture and tech stack
- Actual coding patterns and decisions
- Performance optimizations context
- Security best practices
- Testing strategies
- Multiple task states showing workflow
