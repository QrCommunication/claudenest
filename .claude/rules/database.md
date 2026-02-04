# Règles Base de Données - PostgreSQL

## Standards

### Tables
```sql
-- Toujours UUID pour les clés primaires
CREATE TABLE example (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur les colonnes fréquemment recherchées
CREATE INDEX idx_example_user_id ON example(user_id);
CREATE INDEX idx_example_created_at ON example(created_at);
```

### pgvector (RAG)
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Context chunks with embeddings (384d for bge-small-en)
CREATE TABLE context_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES shared_projects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector index IVFFlat
CREATE INDEX idx_context_chunks_embedding ON context_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### Migrations Laravel
```php
// Toujours utiliser Blueprint
$table->foreignUuid('user_id')
    ->constrained()
    ->onDelete('cascade');

// Enums comme string avec check constraint
$table->string('status', 50)->default('pending');

// JSONB pour les données flexibles
$table->jsonb('metadata')->default('{}');
```

## Optimisations
- Connection pooling (PgBouncer)
- Read replicas pour les requêtes lourdes
- Vacuum régulier
- Monitoring des slow queries

## Backup
- Daily snapshots
- 30 days retention
- Tested restore procedure
