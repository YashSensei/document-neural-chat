# Neurolex — Technical Architecture

## System Overview
Neurolex is a full-stack RAG (Retrieval-Augmented Generation) application that allows users to upload PDF documents and conduct natural language conversations grounded strictly in the document content. The system refuses to answer questions whose answers are not present in the corpus.

## Architecture

### Ingestion Pipeline
1. **Document Parsing**: PDF binary is processed using `pdf-parse` to extract raw text. Content is segmented into page-level units based on line distribution across known page count.
2. **Recursive Chunking**: Pages are split using a recursive character text splitting strategy with configurable chunk size (default 1000 chars) and overlap (default 200 chars). The algorithm tries paragraph → line → sentence → word boundaries in priority order.
3. **Section Detection**: Simple heuristic identifies uppercase headers as section markers for metadata enrichment.
4. **Embedding Generation**: Text chunks are embedded locally using `Xenova/paraphrase-multilingual-MiniLM-L12-v2` via ONNX runtime (no external API calls for embeddings).
5. **Vector Storage**: Embeddings with page/section metadata are persisted in ChromaDB using cosine similarity indexing (HNSW).

### Retrieval Pipeline
1. **Query Vectorization**: User query is embedded with the same model used during ingestion.
2. **Hybrid Ranking**: Initial vector search returns top-10 candidates. A keyword overlap boost (0.6x multiplier) is applied for candidates containing query terms, creating a hybrid dense+sparse ranking.
3. **Noise Filtering**: Candidates shorter than 50 characters (likely headers/footers) are discarded.
4. **Relevance Threshold**: If the best hybrid score exceeds 0.88 (distance-based), the system triggers a polite refusal rather than generating from weak context.

### Generation Pipeline
1. **Context Assembly**: Top-5 ranked chunks are formatted with page citations into a structured system prompt.
2. **Behavioral Policy**: The LLM operates under a strict grounding protocol that mandates source-only answers, inline `[Page X]` citations, language matching, and zero-hallucination tolerance.
3. **Streaming**: Responses are streamed via Server-Sent Events for real-time UI updates.
4. **Conversation Memory**: An in-memory store retains recent exchanges for multi-turn context (last 4 messages injected into prompt).

## Technology Stack
- **Frontend**: React 19 + Vite, react-pdf for document viewing, react-markdown for formatted responses
- **Backend**: Express 5, modular service architecture with dependency injection
- **Vector DB**: ChromaDB (Docker)
- **Embeddings**: Local ONNX inference via @xenova/transformers
- **LLM**: HuggingFace Inference API (Qwen2.5-7B-Instruct) via OpenAI-compatible endpoint
- **Streaming**: Server-Sent Events (SSE)

## Chunking Strategy Detail
The recursive splitting algorithm attempts to preserve semantic coherence:
- First tries splitting on double newlines (paragraph boundaries)
- Falls back to single newlines, then sentence endings (`. `), then spaces
- Overlap window ensures no information is lost at chunk boundaries
- Each chunk retains its source page number and detected section header for citation accuracy
