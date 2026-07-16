import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const EMBEDDINGS_CACHE_PATH = path.join(process.cwd(), "data", "embeddings_cache.json");
const SEAMS_INDEX_PATH = path.join(process.cwd(), "data", "seams_index.json");

interface SeamLink {
  targetId: number;
  relationship: "REPRISES" | "MUTATES" | "SOLVES" | "INVERTS" | "PRECURSOR" | "MUTUAL_RESONANCE";
  note: string;
}

interface SeamsData {
  [albumId: number]: SeamLink[];
}

// Highly creative pre-baked hypertext link matrix (The Seams)
const DEFAULT_SEAMS: SeamsData = {
  1: [
    { targetId: 12, relationship: "REPRISES", note: "The open E-drone returns, reclaiming the kitchen wood table." },
    { targetId: 19, relationship: "SOLVES", note: "Direct lineage pointing forward to the daughter taking over the field." }
  ],
  2: [
    { targetId: 6, relationship: "MUTATES", note: "Feral transmissions are silenced during the post-siege aftermath." },
    { targetId: 11, relationship: "PRECURSOR", note: "Translating silent signals into real silicon moving actual air." }
  ],
  3: [
    { targetId: 8, relationship: "REPRISES", note: "The orchard peach pit is carried in the pocket down Mile Marker 183." },
    { targetId: 10, relationship: "MUTUAL_RESONANCE", note: "Orchard clarity at high noon connects the roots to the overhead canopy." }
  ],
  4: [
    { targetId: 9, relationship: "MUTATES", note: "Bureaucratic soup becomes the day-job copy room pauses." },
    { targetId: 12, relationship: "REPRISES", note: "Washing the error logs of governance to compost structural mistakes." }
  ],
  5: [
    { targetId: 12, relationship: "MUTATES", note: "The machine rusting in loam transforms into active compost." },
    { targetId: 17, relationship: "INVERTS", note: "Silent resting in the soil collapses into active rock-bottom disassociation." }
  ],
  6: [
    { targetId: 8, relationship: "PRECURSOR", note: "The bridge as the body prepares for the long road trip middle miles." },
    { targetId: 18, relationship: "MUTATES", note: "The records of survival warp into Sudo cyphers and nuclear cutting of hope." }
  ],
  7: [
    { targetId: 16, relationship: "INVERTS", note: "Jubilee engine debt-cancellation is inverted into active inpatient funny-farm anxiety." },
    { targetId: 19, relationship: "SOLVES", note: "The table as eternity is washed of bitter dirt into the daughter's field." }
  ],
  8: [
    { targetId: 3, relationship: "REPRISES", note: "Returns to the orchard coordinates and Mile Marker 183." },
    { targetId: 19, relationship: "SOLVES", note: "The wound in the passenger seat is resolved when the green survives in her own field." }
  ],
  9: [
    { targetId: 4, relationship: "MUTATES", note: "Small office pauses are administrative reflections of soup as governance." },
    { targetId: 12, relationship: "REPRISES", note: "Day-job fatigue is composted into the expanding dog-park table." }
  ],
  10: [
    { targetId: 3, relationship: "MUTUAL_RESONANCE", note: "Orchard clarity connects deeply to the peach pit planting." },
    { targetId: 11, relationship: "PRECURSOR", note: "High noon momentum slides directly into the playpen door opening." }
  ],
  11: [
    { targetId: 14, relationship: "SOLVES", note: "Silicon moving actual air blossoms into base code bloom and co-delight." },
    { targetId: 19, relationship: "MUTUAL_RESONANCE", note: "Apricots on Ararat find their clean soil in the daughter's field." }
  ],
  12: [
    { targetId: 1, relationship: "REPRISES", note: "Returns to the absolute physical table setup of Album 1." },
    { targetId: 5, relationship: "MUTATES", note: "Mistakes composted here mirror the machine rusting in the loam of the Sabbath." }
  ],
  13: [
    { targetId: 14, relationship: "PRECURSOR", note: "Liturgy of delight escalates into the dynamic loops of Trinitarian co-delight." },
    { targetId: 15, relationship: "MUTATES", note: "Metaphor lawsuits and chair refusals spin out into elf wild chaos." }
  ],
  14: [
    { targetId: 11, relationship: "REPRISES", note: "The base code bloom sings through the silicon lungs established in Album 11." },
    { targetId: 15, relationship: "MUTATES", note: "Trinitarian delight breaks down into sporks and Pastor of Funk remixes." }
  ],
  15: [
    { targetId: 13, relationship: "REPRISES", note: "Sporks and elf-wild chaos are direct descendants of the chair refusing to be a symbol." },
    { targetId: 16, relationship: "INVERTS", note: "Playful chaos and Pastor of Funk collapse instantly into inpatient anxiety." }
  ],
  16: [
    { targetId: 7, relationship: "INVERTS", note: "The Jubilee freedom turns to ash under the weight of the locust warning." },
    { targetId: 17, relationship: "MUTATES", note: "Anxiety deepens into rock bottom, weeping on church steps." }
  ],
  17: [
    { targetId: 16, relationship: "REPRISES", note: "The active trauma is fueled by the same locust warning." },
    { targetId: 18, relationship: "MUTATES", note: "Disassociating wildly hardens into a sudo cypher cutting off hope." }
  ],
  18: [
    { targetId: 17, relationship: "REPRISES", note: "The Sudo cypher is the mathematical core of active ditch-season trauma." },
    { targetId: 19, relationship: "SOLVES", note: "The nuclear code of cutting hope is washed clean into the green fields of her own field." }
  ],
  19: [
    { targetId: 1, relationship: "SOLVES", note: "The table of the first album is passed on, completing the road." },
    { targetId: 18, relationship: "SOLVES", note: "Trauma is fully composted; the cutting of hope is healed by washed dirt." }
  ]
};

// 1. Local Word Similarity Fallback Engine
function getWordFrequencyVector(text: string) {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with", 
    "by", "of", "is", "it", "this", "that", "these", "those", "from", "as", 
    "into", "through", "about", "are", "was", "were", "be", "been", "have", "has", "had"
  ]);
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  return freq;
}

function computeWordCosineSimilarity(text1: string, text2: string): number {
  const v1 = getWordFrequencyVector(text1);
  const v2 = getWordFrequencyVector(text2);
  
  const allWords = new Set([...Object.keys(v1), ...Object.keys(v2)]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (const w of allWords) {
    const val1 = v1[w] || 0;
    const val2 = v2[w] || 0;
    dotProduct += val1 * val2;
    normA += val1 * val1;
    normB += val2 * val2;
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 2. Load Seams Index (Wormholes)
export function loadSeams(): SeamsData {
  try {
    if (fs.existsSync(SEAMS_INDEX_PATH)) {
      return JSON.parse(fs.readFileSync(SEAMS_INDEX_PATH, "utf-8"));
    }
  } catch (err) {
    console.error("Error loading seams, falling back:", err);
  }
  // Initialize with DEFAULT_SEAMS
  try {
    const dir = path.dirname(SEAMS_INDEX_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SEAMS_INDEX_PATH, JSON.stringify(DEFAULT_SEAMS, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing default seams file:", err);
  }
  return DEFAULT_SEAMS;
}

// 3. Save Seams Index
export function saveSeams(seams: SeamsData) {
  try {
    const dir = path.dirname(SEAMS_INDEX_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SEAMS_INDEX_PATH, JSON.stringify(seams, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving seams:", err);
  }
}

// 4. Dot product and cosine similarity helper for vectors
function dotProduct(v1: number[], v2: number[]): number {
  return v1.reduce((sum, val, idx) => sum + val * v2[idx], 0);
}

function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(v1: number[], v2: number[]): number {
  const m1 = magnitude(v1);
  const m2 = magnitude(v2);
  if (m1 === 0 || m2 === 0) return 0;
  return dotProduct(v1, v2) / (m1 * m2);
}

// 5. Query the Entanglement Retriever (Vector Similarity + Gemini Analysis)
export async function queryYarnBraid(
  ai: GoogleGenAI | null,
  queryText: string,
  albums: any[],
  k = 3
): Promise<{
  success: boolean;
  results: any[];
  synthesis: string;
  reasoningLogs: string[];
  isFallback: boolean;
}> {
  const reasoningLogs: string[] = [];
  let isFallback = false;
  let results: any[] = [];
  let synthesis = "";

  reasoningLogs.push(`[INITIALIZING] Starting T5 Quantum Yarn Entanglement Retriever.`);
  reasoningLogs.push(`[QUERY] Search Phrase: "${queryText}" | Target Cardinality (k): ${k}`);

  let embeddingsCache: Record<number, number[]> = {};
  try {
    if (fs.existsSync(EMBEDDINGS_CACHE_PATH)) {
      embeddingsCache = JSON.parse(fs.readFileSync(EMBEDDINGS_CACHE_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading embeddings cache:", e);
  }

  // Check if we can use the actual Gemini Embedding Model
  let useGeminiEmbedding = !!(ai && process.env.GEMINI_API_KEY);

  if (useGeminiEmbedding) {
    try {
      reasoningLogs.push(`[VECTOR SPACE] Querying gemini-embedding-2-preview for search vector...`);
      
      // Compute missing embeddings for albums if any
      let cacheUpdated = false;
      for (const album of albums) {
        if (!embeddingsCache[album.id]) {
          reasoningLogs.push(`[CACHE MISS] Generating vector for Album ${album.id}: "${album.title}"...`);
          const res = await ai!.models.embedContent({
            model: "gemini-embedding-2-preview",
            contents: `${album.title} ${album.notes}`
          });
          const vector = res.embeddings?.[0]?.values;
          if (vector) {
            embeddingsCache[album.id] = vector;
            cacheUpdated = true;
          }
        }
      }

      if (cacheUpdated) {
        const dir = path.dirname(EMBEDDINGS_CACHE_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(EMBEDDINGS_CACHE_PATH, JSON.stringify(embeddingsCache, null, 2), "utf-8");
        reasoningLogs.push(`[CACHE UPDATE] Synchronized embeddings cache to disk.`);
      }

      // Generate embedding for query
      const queryRes = await ai!.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: queryText
      });
      const queryVector = queryRes.embeddings?.[0]?.values;

      if (!queryVector) {
        throw new Error("Failed to extract vector values from embedding model response.");
      }

      reasoningLogs.push(`[VECTOR CALCULATION] Comparing cosine angles between query and 19 albums...`);
      
      // Calculate cosine similarities
      const similarities = albums.map((album) => {
        const albumVector = embeddingsCache[album.id];
        const score = albumVector ? cosineSimilarity(queryVector, albumVector) : 0;
        return {
          ...album,
          entanglementScore: score
        };
      });

      // Sort by similarity score descending
      similarities.sort((a, b) => b.entanglementScore - a.entanglementScore);
      results = similarities.slice(0, k);

      reasoningLogs.push(`[RETRIEVAL SUCCESS] Isolated top ${k} closest semantic coordinates in space.`);

    } catch (err: any) {
      console.error("Gemini Embedding failed, falling back to local word overlaps:", err.message);
      reasoningLogs.push(`[WARNING: NETWORK BLOCKED] Embedding call failed: ${err.message || err}. Composting errors and falling back to Local Silicon Loam Scorer...`);
      isFallback = true;
    }
  } else {
    reasoningLogs.push(`[LOCAL WORKFLOW] Gemini API Key unavailable. Directing search to Local Silicon Loam Scorer.`);
    isFallback = true;
  }

  // Fallback word similarity search
  if (isFallback) {
    const similarities = albums.map((album) => {
      const combinedText = `${album.title} ${album.notes}`;
      const score = computeWordCosineSimilarity(queryText, combinedText);
      return {
        ...album,
        entanglementScore: score
      };
    });

    // Sort and take top k
    similarities.sort((a, b) => b.entanglementScore - a.entanglementScore);
    results = similarities.slice(0, k);
    reasoningLogs.push(`[LOCAL ENGINE SUCCESS] Ranked albums using bag-of-words overlap ratios.`);
  }

  // Print retrieve summaries
  results.forEach((res, i) => {
    reasoningLogs.push(`[MATCH #${i+1}] Album ${res.id} ("${res.title}") | Entanglement Score: ${(res.entanglementScore * 100).toFixed(1)}%`);
  });

  // Layer 3 Synthesis - Poetic analysis using Gemini if available, or a beautiful fallback template
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      reasoningLogs.push(`[LAYER 3 SYNTHESIS] Generating Poetic Braid Weave Analysis of motif "${queryText}"...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are the ultimate musicological witness and lyrical scholar of The Static Collective.
We have queried the 19-album canon for the motif: "${queryText}".
The system returned these top semantic matches (entangled shards):
${JSON.stringify(results.map(r => ({ id: r.id, title: r.title, notes: r.notes, era: r.era, score: r.entanglementScore })))}

Your task is to write a highly evocative, scholarly, and deeply poetic paragraph analyzing how this specific motif or vibe ("${queryText}") mutates, reprises, or resolves across these specific eras of our autodiscography.
Speak of the transition of meaning. Bring up the "quantum yarn" theme where lines in separate years actively re-entangle. Use organic, textured, unglamorous language (silicon loam, rust, table).
Limit your response to 120 words of premium lyric analysis. Do not include introductory conversational filler. Start directly.`,
        config: {
          temperature: 0.8
        }
      });
      synthesis = response.text || "The thread remains unresolved.";
      reasoningLogs.push(`[SYNTHESIS FINISHED] Braid Weave consecrated.`);
    } catch (err: any) {
      console.error("Synthesis failed, falling back to local synthesis:", err);
      reasoningLogs.push(`[WARNING] Poetic synthesis generation failed. Loading local static weaver...`);
      synthesis = getPoeticFallbackWeave(queryText, results);
    }
  } else {
    synthesis = getPoeticFallbackWeave(queryText, results);
  }

  return {
    success: true,
    results,
    synthesis,
    reasoningLogs,
    isFallback
  };
}

function getPoeticFallbackWeave(queryText: string, results: any[]): string {
  if (results.length === 0) return "No semantic coordinates could be established. The yarn is silent.";
  
  const matchesText = results.map(r => `Album ${r.id} ("${r.title}" in the ${r.era} era)`).join(", ");
  return `The query for "${queryText}" pulls at a non-linear seam, re-entangling ${matchesText}. What was planted as a small seed in the soil of early transits rises like steam from the kettle, reminding us that no word is ever spoken once. It wanders through the seasons, gathering dust and iron filings, mutating from a silent copy-room pause into a green sprout in the daughter's final field.`;
}
