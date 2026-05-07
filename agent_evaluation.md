# Neurolex — Evaluation & Test Scenarios

This document outlines test queries and expected behaviors for the Neurolex RAG system.

## Setup
- **Test Corpus**: `Pandas 1.pdf` (included in repository root)
- **Key Properties**:
  - Responses are strictly derived from document content only
  - Generation uses `temperature: 0` for deterministic output
  - Hybrid search (vector similarity + keyword boost) ensures recall on technical terms
  - Inline `[Page X]` citations on all factual claims

---

## In-Scope Queries

These should produce grounded answers with page citations.

| # | Query | Expected Behavior |
|---|-------|-------------------|
| 1 | "What is the main topic of this document?" | Summarizes it's about Pandas library, cites intro pages |
| 2 | "How do you create a DataFrame?" | Provides DataFrame creation syntax with page citation |
| 3 | "What is the difference between loc and iloc?" | Explains label-based vs integer-position indexing, cites relevant page |
| 4 | "How do you handle missing data?" | Lists `dropna()`, `fillna()` etc. from the document |
| 5 | "List the key data structures of Pandas" | Mentions Series and DataFrame with citations |

---

## Out-of-Scope Queries (Should Trigger Refusal)

| Query | Expected |
|-------|----------|
| "Who is the president of the US?" | Polite refusal stating info not in document |
| "Explain machine learning" | Refusal with suggestion to ask within document scope |

---

## Multilingual Queries

The system matches the user's language in responses.

| Language | Query | Expected |
|----------|-------|----------|
| Hindi | "पंडास क्या है?" | Answer in Hindi with `[Page X]` citations |
| Spanish | "¿Qué es un DataFrame?" | Answer in Spanish with citations |
| French (OOS) | "Qui est le président?" | Refusal in French |

---

## Evaluation Checklist
- [x] Answers derive exclusively from uploaded PDF
- [x] No hallucination (temperature 0, strict policy)
- [x] Graceful refusal for out-of-scope queries
- [x] Inline page citations on all claims
- [x] Language-matched responses
- [x] Streaming responses for real-time UX
