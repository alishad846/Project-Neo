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

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "moondream";
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 45000);

// ADAPTIVE LEARNING: In-memory store to track what the model misses per category
const categoryLearning = new Map<string, string[]>();

function buildPrompt(hint?: ExtractHint, missedFields: string[] = []): string {
  const cat = hint?.category ? ` This is a "${hint.category}".` : "";
  
  let prompt = `Describe this clothing item factually in one sentence.${cat} Include the color, fabric, pattern, neckline, and sleeve length.`;

  // ADAPTIVE LEARNING: Give multiple-choice keywords as a gentle nudge, NOT as a question
  if (missedFields.length > 0) {
    prompt += " Please explicitly state the ";
    const hints = [];
    if (missedFields.includes("pattern")) hints.push("pattern (floral, solid, or printed)");
    if (missedFields.includes("fabric")) hints.push("fabric (cotton, silk, or denim)");
    if (missedFields.includes("sleeveLength")) hints.push("sleeve length (sleeveless, half sleeve, or full sleeve)");
    if (missedFields.includes("neckType")) hints.push("neckline (v-neck, round neck, or collar)");
    
    prompt += hints.join(", ") + ".";
  }

  return prompt;
}

async function tryModelExtract(imageBase64: string, hint?: ExtractHint): Promise<ExtractResult | null> {
  try {
    const categoryKey = hint?.category?.toLowerCase() ?? "default";
    const missedFields = categoryLearning.get(categoryKey) ?? [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    console.log(`\n--- NEW REQUEST ---`);
    console.log(`[AI] Sending prompt to Moondream (Learned misses: ${missedFields.length})`);
    
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildPrompt(hint, missedFields),
        images: [imageBase64],
        stream: false,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      console.error("[AI] Ollama responded with status:", res.status);
      return null;
    }

    const body = (await res.json()) as { response?: string };
    if (!body.response) return null;

    // LOG THE RAW OUTPUT to see exactly what Moondream is thinking
    console.log(`[AI] Raw model response: "${body.response}"`);

    const jsonAttributes = parseModelResponse(body.response);
    if (jsonAttributes && Object.keys(jsonAttributes).length > 0) {
      return { attributes: jsonAttributes, confidence: "high", source: "model" };
    }

    const proseAttributes = parseModelDescription(body.response);
    if (proseAttributes && Object.keys(proseAttributes).length > 0) {
      return { attributes: proseAttributes, confidence: "medium", source: "model" };
    }

    return null;
  } catch (error) {
    console.error("[AI] Model extraction failed:", error);
    return null;
  }
}

app.post("/api/extract", async (req, res) => {
  const { imageBase64, hint } = req.body as { imageBase64?: string; hint?: ExtractHint };
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const modelResult = await tryModelExtract(imageBase64, hint);

  // ADAPTIVE LEARNING: Audit the results and store missing fields for next time
  if (modelResult && modelResult.source === "model") {
    const expectedFields = ["color", "fabric", "pattern", "neckType", "sleeveLength"];
    const actualFields = Object.keys(modelResult.attributes);
    
    const missing = expectedFields.filter(field => !actualFields.includes(field));
    const categoryKey = hint?.category?.toLowerCase() ?? "default";
    
    if (missing.length > 0) {
      console.log(`[Adaptive Learning] Model missed ${missing.join(", ")} for '${categoryKey}'. Will emphasize next time.`);
      categoryLearning.set(categoryKey, missing);
    } else {
      console.log(`[Adaptive Learning] Perfect extraction! Clearing learned misses for '${categoryKey}'.`);
      categoryLearning.delete(categoryKey); 
    }
  }

  res.json(modelResult ?? extractHeuristic(hint ?? {}));
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => console.log(`extractor listening on ${port}`));