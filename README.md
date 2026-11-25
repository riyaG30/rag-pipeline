# RAG Pipeline — Semantic Menu Search with Qdrant

A first project for learning vector databases. It indexes a restaurant menu into
[Qdrant](https://qdrant.tech/) and lets you search it with natural language
(e.g. `"protein rich dishes"`, `"something spicy"`) — matching by *meaning*,
not just keywords.

## How it works

1. **Indexing** (`src/indexing.ts`) — creates a Qdrant collection, converts each
   menu item into a vector embedding (via the `all-MiniLM-L6-v2` model), and
   upserts them as "points" with metadata (name, description, price, category).
2. **Search** (`src/search.ts`) — embeds your query text with the same model,
   finds the closest vectors by cosine similarity, and prints the top 5 results.

## Steps followed to build this project

1. Set up a Qdrant account at [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a cluster
3. Get the API key
4. Get the cluster URL
5. Set up the project — empty repo
6. `npm init` to create `package.json`
7. Create a `.env` file and paste the API key and URL:
   ```
   QDRANT_URL=https://<your-cluster>.cloud.qdrant.io:6333
   QDRANT_API_KEY=<your-api-key>
   ```
8. `git init` and add a `.gitignore` file (with `node_modules` and `.env` —
   never commit your API key)
9. Install the Qdrant client:
   ```bash
   npm install @qdrant/js-client-rest
   ```
10. Connect to Qdrant Cloud in `src/indexing.ts` using the `QdrantClient`
11. Install Node types — TypeScript doesn't know Node.js globals like
    `process.env` by default; `@types/node` adds type definitions for them so
    the editor stops showing errors and autocomplete works:
    ```bash
    npm i -D @types/node
    ```
12. Add `"types": ["node"]` to `tsconfig.json` — tells the TypeScript compiler
    to actually include those Node type definitions when checking this project
13. Create a collection named `items` with `size: 384` and `distance: "Cosine"`
14. Build the points array out of the menu data (id + vector + payload)
15. Upsert the points to the collection
16. Install `dotenv` and load `.env` in the scripts — Node doesn't read `.env`
    files on its own, so `process.env.QDRANT_URL` was `undefined` and the client
    defaulted to `localhost:6333`. `dotenv.config()` loads the `.env` values
    into `process.env` at runtime:
    ```bash
    npm install dotenv
    ```
    ```ts
    import dotenv from "dotenv";
    dotenv.config();
    ```
17. Run `node src/indexing.ts` — the collection gets created and populated
18. Create `src/search.ts` — embed the query text, search with `client.query`,
    and print the top 5 results with scores

## Usage

```bash
# One-time: create the collection and index all menu items
node src/indexing.ts

# Search (edit queryText in src/search.ts to try different queries)
node src/search.ts
```

Example output:

```
Item: Chicken Tikka Masala
Score: 0.50885826
Description: Tandoori chicken in creamy tomato sauce with aromatic spices...
Price: $15.95
---
```

## Key concepts learned

| Concept | What it means |
|---|---|
| **Vector embedding** | Text converted into a list of numbers (384 here) capturing its meaning. Similar texts → similar vectors. |
| **Collection** | A named store of vectors + payloads in Qdrant, like a table. |
| **Point** | One record: `id` + `vector` + `payload` (metadata). |
| **Cosine similarity** | Measures the angle between two vectors; score closer to 1.0 = more similar. |
| **Upsert** | Insert or update — re-running indexing overwrites points with the same id. |
| **Payload** | Metadata attached to a vector (name, price, category). Not used in similarity, but returned with results and usable for filtering. |

## Issues faced & fixes

- **`ECONNREFUSED 127.0.0.1:6333`** — `.env` wasn't loaded, so the client
  defaulted to localhost. Fixed by installing `dotenv` and calling
  `dotenv.config()`.
- **Version incompatibility** — client `1.18.0` vs server `1.20.2`. Fixed by
  upgrading: `npm install @qdrant/js-client-rest@latest`.
- **`409 Conflict: Collection items already exists`** — `createCollection`
  fails if the collection already exists. Indexing is meant to run once, or
  delete the collection first.
- **Model mismatch** — the embedding model must be the same for indexing and
  search, and its output size must match the collection's `size` (384 for
  `all-MiniLM-L6-v2`).

## Tech stack

- TypeScript (run directly via Node 24's native TS support)
- `@qdrant/js-client-rest` — official Qdrant JS client
- `dotenv` — loads `.env` variables
- `sentence-transformers/all-MiniLM-L6-v2` — embedding model (run server-side by Qdrant)
