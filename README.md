# NEUROLEX — Neural Document Intelligence

A full-stack RAG (Retrieval-Augmented Generation) application that lets you upload any PDF and have a grounded conversation with it. Answers are strictly derived from the document — no hallucination, no external knowledge.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![Tech Stack](https://img.shields.io/badge/Express-5-green) ![Tech Stack](https://img.shields.io/badge/ChromaDB-Vector%20Store-orange) ![Tech Stack](https://img.shields.io/badge/HuggingFace-LLM-yellow)

## Live Demo

> **[Deployed Link](#)** — _Replace with your live URL after deployment_

---

## Features

- Upload any PDF document and chat with it in real-time
- Full RAG pipeline: ingestion → chunking → embedding → vector storage → retrieval → generation
- Recursive character text splitting with configurable chunk size and overlap
- Hybrid search ranking (vector similarity + keyword boost)
- Inline `[Page X]` citations on every factual claim
- Streaming responses via Server-Sent Events
- Strict grounding — refuses to answer questions not covered by the document
- Multilingual support (responds in the same language as the query)
- Cyberpunk-themed UI with neon aesthetics

---

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────────────┐
│   Frontend  │     │              Backend (Express)               │
│  React/Vite │◄───►│                                             │
│             │ SSE │  ┌──────────┐  ┌───────────┐  ┌──────────┐ │
└─────────────┘     │  │ Ingestion│  │  Chat     │  │ Convo    │ │
                    │  │ Service  │  │  Service  │  │ Store    │ │
                    │  └────┬─────┘  └─────┬─────┘  └──────────┘ │
                    │       │              │                       │
                    │  ┌────▼──────────────▼─────┐                │
                    │  │      Vector Index        │                │
                    │  │      (ChromaDB)          │                │
                    │  └────────────┬─────────────┘                │
                    │               │                              │
                    │  ┌────────────▼─────────────┐                │
                    │  │   Neural Embedder        │                │
                    │  │   (Local ONNX Runtime)   │                │
                    │  └──────────────────────────┘                │
                    │                                             │
                    │  ┌──────────────────────────┐                │
                    │  │   LLM Gateway            │                │
                    │  │   (HuggingFace Inference) │                │
                    │  └──────────────────────────┘                │
                    └─────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, react-pdf, react-markdown |
| Backend | Express 5, Node.js (ESM) |
| Vector DB | ChromaDB (Docker) |
| Embeddings | Local — `@xenova/transformers` (paraphrase-multilingual-MiniLM-L12-v2) |
| LLM | HuggingFace Inference API (Qwen2.5-7B-Instruct) |
| Streaming | Server-Sent Events (SSE) |

---

## RAG Pipeline

### 1. Ingestion
- PDF is parsed page-by-page using `pdf-parse`
- Section headers are detected via uppercase heuristic

### 2. Chunking Strategy
- **Recursive Character Text Splitting** with priority: `\n\n` → `\n` → `. ` → ` `
- Chunk size: 1000 characters
- Overlap: 200 characters (prevents context loss at boundaries)
- Each chunk retains source page number and section metadata

### 3. Embedding
- Runs **locally** using ONNX runtime (no external API calls)
- Model: `Xenova/paraphrase-multilingual-MiniLM-L12-v2`
- Supports multilingual queries out of the box

### 4. Storage
- ChromaDB with HNSW indexing and cosine similarity
- Batch ingestion (50 documents per batch)
- First 3 pages indexed synchronously, rest in background

### 5. Retrieval
- Top-10 vector search → hybrid reranking with keyword overlap boost
- Noise filtering (removes chunks < 50 chars)
- Relevance threshold: 0.88 (triggers polite refusal if exceeded)

### 6. Generation
- Context-injected system prompt with behavioral policy
- Zero temperature for deterministic output
- Mandatory `[Page X]` citations
- Conversation history (last 4 messages) for multi-turn context

---

## Getting Started

### Prerequisites
- Node.js 18+
- Docker Desktop

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/neurolex.git
cd neurolex

# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Environment Setup

Create `server/.env`:

```env
HF_TOKEN=hf_your_huggingface_token
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
CHROMA_URL=http://localhost:8000
```

Get a free HuggingFace token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) (Read access is sufficient).

### 3. Start ChromaDB

```bash
docker-compose up -d
```

### 4. Run

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
├── client/                  # React frontend
│   ├── src/
│   │   ├── api/             # API client (SSE streaming)
│   │   ├── components/      # Chat, Upload, DocViewer
│   │   ├── hooks/           # useChat, useUpload
│   │   └── index.css        # Cyberpunk theme
│   └── vite.config.js
├── server/                  # Express backend
│   ├── src/
│   │   ├── api/             # Routes & Controllers
│   │   ├── config/          # DI container, LLM policy
│   │   ├── core/services/   # Chat & Ingestion logic
│   │   └── infrastructure/  # ChromaDB, Embedder, LLM, PDF parser
│   └── index.js
└── docker-compose.yaml      # ChromaDB container
```

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | Vercel | Set `VITE_API_URL` env var |
| Backend | Render | Free web service |
| ChromaDB | Render | Deploy as Docker image `chromadb/chroma` |

---

## License

MIT
