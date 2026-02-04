# 🤖 AI Models Configuration

ClaudeNest uses open-source AI models for RAG (Retrieval-Augmented Generation). All models run locally via Ollama - **zero cost, full privacy**.

---

## 📊 Models Overview

| Model | Purpose | Size | RAM | Speed | License |
|-------|---------|------|-----|-------|---------|
| **bge-small-en-v1.5** | Embeddings | 130 MB | 1 GB | ~500 emb/sec | MIT |
| **Mistral 7B Instruct** | Summarization | 4.4 GB | 6 GB | ~15-20 tok/sec | Apache 2.0 |
| **nomic-embed-text** | Embeddings (alt) | 274 MB | 1 GB | ~300 emb/sec | Apache 2.0 |
| **bge-reranker-base** | Reranking | 278 MB | 1 GB | ~100 pairs/sec | MIT |

**Total for basic setup:** ~5 GB disk, ~8 GB RAM

---

## 🎯 What Each Model Does

### 1. Embeddings Model (bge-small-en-v1.5)

**Purpose:** Convert text to vectors for semantic search

**How it works:**
```
"Implement JWT authentication with refresh tokens"
         ↓
    bge-small-en-v1.5
         ↓
[0.023, -0.156, 0.789, ...] 384 dimensions
```

**Use in ClaudeNest:**
- Store context chunks as vectors in PostgreSQL
- Search semantically similar content
- Find relevant past decisions and code changes

**Configuration:**
```env
EMBEDDING_MODEL=bge-small-en-v1.5
EMBEDDING_DIMENSIONS=384
```

### 2. Summarization Model (Mistral 7B)

**Purpose:** Compress old context when token limit reached

**How it works:**
```
[50 chunks of old context] (~5000 tokens)
           ↓
      Mistral 7B
           ↓
"Summary: Implemented JWT auth using Redis for refresh tokens,
 added rate limiting middleware, created TokenService class"
(~500 tokens)
```

**Use in ClaudeNest:**
- Auto-compress context when >80% of limit
- Maintain important decisions, remove details
- Keep context fresh under token budget

**Configuration:**
```env
OLLAMA_MODEL=mistral:7b
```

### 3. Reranking Model (bge-reranker-base) - Optional

**Purpose:** Improve search precision by reordering results

**How it works:**
```
Query: "JWT refresh tokens"
Top 20 results from vector search
         ↓
   bge-reranker-base
         ↓
Reordered by relevance score
         ↓
Top 5 most relevant chunks
```

**Use in ClaudeNest:**
- Optional enhancement to RAG pipeline
- Better precision for complex queries

---

## 🚀 Installation

### Using Ollama (Recommended)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull bge-small-en-v1.5
ollama pull mistral:7b

# Optional: Pull alternatives
ollama pull nomic-embed-text  # Alternative embeddings
ollama pull bge-reranker-base  # Optional reranking

# Verify installation
ollama list
```

### Manual Download (Without Ollama)

If you prefer not to use Ollama, you can run models directly:

```bash
# Install llama.cpp or similar
# Download GGUF models from HuggingFace
# Run with your preferred inference engine
```

---

## ⚙️ Configuration

### Environment Variables

```bash
# Server .env
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=mistral:7b
EMBEDDING_MODEL=bge-small-en-v1.5
EMBEDDING_DIMENSIONS=384
```

### PostgreSQL pgvector Setup

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vectors
CREATE TABLE context_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),  -- Match embedding model dimensions
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create vector index for fast search
CREATE INDEX idx_context_chunks_embedding ON context_chunks 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

---

## 🔄 RAG Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RAG PIPELINE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. QUERY                                                            │
│  "Implement JWT refresh tokens"                                      │
│       ↓                                                              │
│  2. EMBED                                                            │
│  bge-small-en-v1.5 → vector[384]                                     │
│       ↓                                                              │
│  3. SEARCH                                                           │
│  pgvector cosine similarity search                                   │
│  SELECT * FROM context_chunks                                        │
│  ORDER BY embedding <=> query_vector                                 │
│  LIMIT 20;                                                           │
│       ↓                                                              │
│  4. RERANK (Optional)                                                │
│  bge-reranker-base scores each result                                │
│  Keep top 5                                                          │
│       ↓                                                              │
│  5. ASSEMBLE CONTEXT                                                 │
│  ┌─────────────────┐                                                 │
│  │ Structured      │ 1000 tokens                                     │
│  │ Summary/Arch    │                                                 │
│  ├─────────────────┤                                                 │
│  │ RAG Results     │ 2000 tokens                                     │
│  │ Top 5 chunks    │                                                 │
│  ├─────────────────┤                                                 │
│  │ Live State      │ 1000 tokens                                     │
│  │ Tasks/Locks     │                                                 │
│  └─────────────────┘                                                 │
│  Total: ~4000 tokens                                                 │
│       ↓                                                              │
│  6. RETURN TO AGENT                                                  │
│  Fresh, relevant context under token limit                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Models

### Test Embeddings

```bash
# Via Ollama API
curl http://localhost:11434/api/embeddings -d '{
  "model": "bge-small-en-v1.5",
  "prompt": "Implement JWT authentication"
}'
```

### Test Mistral

```bash
# Via Ollama CLI
ollama run mistral:7b

# Or API
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:7b",
  "prompt": "Summarize this: Created TokenService class with JWT generation",
  "stream": false
}'
```

---

## 📈 Performance Tuning

### CPU-Only Optimization

For servers without GPU:

```bash
# Use quantized models (already default in Ollama)
# Mistral 7B Q4_K_M uses ~6GB RAM

# Limit Ollama threads to prevent CPU overload
export OLLAMA_NUM_THREADS=8

# Or set in systemd service
sudo systemctl edit ollama
```

Add:
```ini
[Service]
Environment="OLLAMA_NUM_THREADS=8"
```

### GPU Acceleration (Optional)

If you have an NVIDIA GPU:

```bash
# Install NVIDIA Container Toolkit (for Docker)
# Or install CUDA drivers for bare-metal

# Ollama automatically detects and uses GPU
# Verify with:
vidia-smi
ollama run mistral:7b  # Should show GPU usage
```

---

## 🔄 Model Updates

```bash
# Check for updates
ollama list

# Update a model
ollama pull mistral:7b

# Remove old version
ollama rm mistral:7b-old
```

---

## 🛠️ Troubleshooting

### Model download stuck

```bash
# Cancel and retry
Ctrl+C
ollama pull mistral:7b
```

### Out of memory

```bash
# Use smaller model
ollama pull phi3:3.8b  # Alternative to Mistral 7B

# Or reduce context window
export OLLAMA_CONTEXT_LENGTH=4096
```

### Slow inference

```bash
# Check CPU usage
top

# Limit threads if needed
export OLLAMA_NUM_THREADS=4
```

---

## 📚 Alternative Models

If the recommended models don't work for your use case:

### Embeddings Alternatives

| Model | Dimensions | Size | Notes |
|-------|-----------|------|-------|
| all-MiniLM-L6-v2 | 384 | 80 MB | Faster, less accurate |
| nomic-embed-text | 768 | 274 MB | Good multilingual |
| mxbai-embed-large | 1024 | 670 MB | Higher quality |

### LLM Alternatives

| Model | Size | RAM | Use Case |
|-------|------|-----|----------|
| Phi-3 Mini | 3.8B | 3 GB | Faster summarization |
| Llama 3.1 8B | 8B | 6 GB | Better reasoning |
| Qwen2.5 7B | 7B | 6 GB | Better multilingual |

---

## 🔐 Privacy & Security

All models run **locally** on your server:

- ✅ No data sent to external APIs
- ✅ No OpenAI/Anthropic API keys needed
- ✅ Complete data privacy
- ✅ Works offline

---

## 💰 Cost Analysis

| Approach | Monthly Cost | Latency | Privacy |
|----------|-------------|---------|---------|
| **ClaudeNest (Local)** | **0€** | ~500ms | ✅ Full |
| OpenAI API | 20-100€ | ~200ms | ❌ External |
| Anthropic API | 50-200€ | ~300ms | ❌ External |

**Savings:** 100% on AI inference costs

---

For installation instructions, see:
- [Bare-Metal Deployment](DEPLOYMENT-BAREMETAL.md)
- [Docker Deployment](DEPLOYMENT-DOCKER.md)
