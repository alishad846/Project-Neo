import express from "express";
import {
  extractHeuristic,
  parseModelResponse,
  parseModelDescription,
  type ExtractHint,
  type ExtractResult,
} from "./extract";

const app = express();
app.use(express.json({ limit: "10mb" }));

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "moondream";
// Warmed image inference on CPU is ~5s, but cold starts (first call / model
// load) and real photos can take up to ~45s. 8s was too aggressive and meant
// the model path never actually completed before falling back to heuristic.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 45000);

async function tryModelExtract(imageBase64: string): Promise<ExtractResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt:
          "Describe this clothing item: its neckline, sleeve length, pattern, occasion, " +
          "fabric and colour. Be specific.",
        images: [imageBase64],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const body = (await res.json()) as { response?: string };
    if (!body.response) return null;

    // moondream (and most small vision models) answer in prose, not JSON.
    // Try strict JSON parsing first in case a model ever returns it, then
    // fall back to keyword-mapping the prose. Never fabricate: only return a
    // model result when we actually detected something.
    const jsonAttributes = parseModelResponse(body.response);
    if (jsonAttributes && Object.keys(jsonAttributes).length > 0) {
      return { attributes: jsonAttributes, confidence: "high", source: "model" };
    }

    const proseAttributes = parseModelDescription(body.response);
    if (proseAttributes && Object.keys(proseAttributes).length > 0) {
      return { attributes: proseAttributes, confidence: "medium", source: "model" };
    }

    return null;
  } catch {
    return null;
  }
}

app.post("/api/extract", async (req, res) => {
  const { imageBase64, hint } = req.body as { imageBase64?: string; hint?: ExtractHint };
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const modelResult = await tryModelExtract(imageBase64);
  res.json(modelResult ?? extractHeuristic(hint ?? {}));
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => console.log(`extractor listening on ${port}`));
