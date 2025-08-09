# smart-doc-finder

**AI‑powered assistant for real‑time document discovery!**

## Overview

smart-doc-finder continuously watches your personal document drive for new uploads and uses AI‑driven semantic search to instantly surface the most relevant files based on user queries or tasks. Whether you're looking for “the last Q3 budget approval draft” or a recent policy revision, this assistant has your back!

## What It Does

* Monitors a document drive for newly added files (e.g. via Redis Streams)
* Creates embedding vectors for each file and stores them in Redis for fast, semantic retrieval
* Offers full‑text filtering using stored metadata
* Implements a semantic cache to keep recent prompts and results ready for lightning–fast context reuse
* Pulls in results seamlessly from the tech stack and delivers them through a React frontend

## Tech Stack

* **Backend**: Python (for embedding generation, Redis integration, file monitoring)
* **Search**: MongoDB Cloud for metadata; Redis Cloud (vector database, cache, streams)
* **Frontend**: React

## Key Features

* **Real‑time monitoring**: Detects and processes new file uploads as they’re added
* **Semantic search**: Retrieves relevant documents using vector similarity, not just keyword matching
* **Hybrid search**: Combines embeddings with metadata filters for precision
* **Contextual memory**: Reuses recent queries and results to speed up workflows and enhance context
* **Scalable UI**: Clean React interface for querying and displaying document matches

## Run with Docker

Bring your dev environment online quickly:

```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# Restart services
docker compose -f docker-compose.dev.yml restart

# Bring down services and clean up volumes
docker compose -f docker-compose.dev.yml down -v
```
