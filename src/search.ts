import { QdrantClient } from "@qdrant/js-client-rest";
import dotenv from "dotenv";

// Load QDRANT_URL and QDRANT_API_KEY from the .env file into process.env
dotenv.config();

// Connect to the same Qdrant Cloud cluster we indexed into
const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// The search query written in plain natural language.
// Try changing this — e.g. "something spicy", "light vegetarian lunch",
// "seafood appetizer" — and see how results change.
const queryText = "protein rich dishes";

// Semantic search: Qdrant embeds the query text with the same model used at
// indexing time, then finds the stored vectors closest to the query vector
// by cosine distance.
// MUST use the same embedding model as indexing.ts — different models produce
// vectors in incompatible spaces, so results would be meaningless.
const results = await client.query("items", {
  query: {
    text: queryText,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  },
  with_payload: true, // also return the stored metadata (name, price, etc.)
  limit: 5,           // return the top 5 most similar items
});

// Results are ordered by score, highest first.
// Score = cosine similarity: closer to 1.0 means more semantically similar.
for (const result of results.points) {
  console.log(`Item: ${result.payload?.item_name || 'N/A'}`);
  console.log(`Score: ${result.score}`);
  console.log(`Description: ${result.payload?.description || 'N/A'}`);
  console.log(`Price: ${result.payload?.price || 'N/A'}`);
  console.log('---');
}
