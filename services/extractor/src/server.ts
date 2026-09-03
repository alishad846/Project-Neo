import express from "express";
import { extractHeuristic, parseModelResponse, type ExtractHint, type ExtractResult } from "./extract";

const app = express();
app.use(express.json({ limit: "10mb" }));

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://ollama:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "moondream";

async function tryModelExtract(imageBase64: string): Promise<ExtractResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt:
          "Describe this clothing product as compact JSON with any of these keys you can " +
          "confidently determine: neckType, sleeveLength, pattern, occasion, sareeLength, blousePiece.",
        images: [imageBase64],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const body = (await res.json()) as { response?: string };
    if (!body.response) return null;

    const attributes = parseModelResponse(body.response);
    if (!attributes || Object.keys(attributes).length === 0) return null;

    return { attributes, confidence: "high", source: "model" };
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
