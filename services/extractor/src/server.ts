import express from "express";
import {
  extractHeuristic,
  parseModelResponse,
  parseModelDescription,
  type ExtractHint,
  type ExtractResult,
} from "./extract";
import { raceModels } from "./race";

const app = express();
app.use(express.json({ limit: "10mb" }));

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://ollama:11434";
// Quality-first default: Qwen2.5-VL 7B extracts fashion attributes more
// reliably than the 3B tier. Sellers without a capable GPU never wait for
// it though — see OLLAMA_FALLBACK_MODEL/OLLAMA_FALLBACK_TIMEOUT_MS below.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5vl:7b";
// Lightweight tier, raced in behind the quality model so a slow/CPU-only
// Ollama install never makes a seller wait the full timeout for a result.
const OLLAMA_FALLBACK_MODEL = process.env.OLLAMA_FALLBACK_MODEL ?? "qwen2.5vl:3b";
// Warmed image inference on GPU is ~1-3s, CPU ~8-20s. Cold starts (model load)
// can take up to ~45s.
const TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? 45000);
// If the quality model hasn't answered by this point, a parallel call to the
// fallback model starts too — whichever settles first wins. Set above
// GPU-warmed latency (~1-3s) so GPU sellers essentially never trigger it, and
// well below CPU latency (~8-20s) so CPU-only sellers aren't stuck waiting.
const OLLAMA_FALLBACK_TIMEOUT_MS = Number(process.env.OLLAMA_FALLBACK_TIMEOUT_MS ?? 6000);
// Keep the model resident in (V)RAM instead of Ollama's 5-minute default
// eviction, so a seller who comes back after a break never re-pays the
// ~45s cold-load. Ollama's `keep_alive` accepts EITHER an integer number of
// seconds (-1 = never unload) OR a duration STRING with a unit ("30m"). A
// bare "-1" string is rejected ("missing unit in duration"), which silently
// broke all model extraction — so numeric values must be sent as numbers.
// Default: -1 (number). Override via OLLAMA_KEEP_ALIVE with a number ("-1",
// "1800") or a unit'd duration ("30m").
const OLLAMA_KEEP_ALIVE: number | string = (() => {
  const raw = process.env.OLLAMA_KEEP_ALIVE;
  if (raw === undefined) return -1;
  const asNumber = Number(raw);
  return Number.isFinite(asNumber) ? asNumber : raw;
})();

// Process-local adaptive hints. Only missing field names are retained; images
// and seller data never enter this map.
const categoryLearning = new Map<string, string[]>();
const EXPECTED_FIELDS = ["color", "fabric", "pattern", "neckType", "sleeveLength"];
const MAX_LEARNED_CATEGORIES = 100;

function categoryKey(category?: string): string {
  return category?.trim().toLowerCase() || "default";
}

function buildPrompt(hint?: ExtractHint, missedFields: string[] = []): string {
  const cat = hint?.category ? `\nProduct Category: "${hint.category}"` : "";
  let sellerContext = "";
  if (hint?.sellerPriors) {
    const priors = hint.sellerPriors;
    const parts: string[] = [];
    if (priors.frequentFabrics?.length) parts.push(`Common Fabrics: [${priors.frequentFabrics.join(", ")}]`);
    if (priors.frequentNeckTypes?.length) parts.push(`Common Necklines: [${priors.frequentNeckTypes.join(", ")}]`);
    if (priors.frequentSleeveLengths?.length) parts.push(`Common Sleeves: [${priors.frequentSleeveLengths.join(", ")}]`);
    if (priors.frequentPatterns?.length) parts.push(`Common Patterns: [${priors.frequentPatterns.join(", ")}]`);
    if (priors.frequentColors?.length) parts.push(`Common Colors: [${priors.frequentColors.join(", ")}]`);
    if (parts.length > 0) {
      sellerContext = `\nSeller History Context (${parts.join(" | ")}). Use these historical seller tendencies as soft priors to resolve visual ambiguity, while strictly verifying against the actual image.`;
    }
  }
  if (missedFields.length > 0) {
    sellerContext += `\nPay particular attention to these fields previously omitted for this category: ${missedFields.join(", ")}.`;
  }

  return (
    `You are an expert fashion e-commerce catalog annotator. Analyze this clothing product photo and extract its visual attributes strictly in valid JSON format.${cat}${sellerContext}\n` +
    `Return ONLY a JSON object with any of the following applicable keys:\n` +
    `- "color": Primary color (e.g., Red, Blue, Navy Blue, Maroon, Dark Green, Mustard, Pink, Black, White, etc.)\n` +
    `- "fabric": Visible fabric material if recognizable (e.g., Cotton, Silk, Georgette, Rayon, Chiffon, Denim, Linen, Polyester, Velvet, Net)\n` +
    `- "pattern": Pattern or surface design (e.g., Solid, Floral, Printed, Embroidered, Checked, Striped, Geometric, Self Design, Embellished)\n` +
    `- "neckType": Neckline or collar style if visible (e.g., Round Neck, V-Neck, Boat Neck, Collar, Square Neck, Mandarin / Chinese Neck, Halter Neck, Sweetheart, Off-Shoulder)\n` +
    `- "sleeveLength": Sleeve length if visible (e.g., Full Sleeve, Three-Quarter, Half Sleeve, Sleeveless, Short Sleeve)\n` +
    `- "occasion": Suitable occasion (e.g., Casual, Festive, Party, Formal)\n` +
    `- "sareeLength": If this is a saree, length (e.g., "5.5 metres", "6.3 metres")\n` +
    `- "blousePiece": If this is a saree/ethnic set with blouse piece, true or false\n\n` +
    `Rules:\n` +
    `1. Only include keys for attributes clearly visible in the image.\n` +
    `2. If the garment has no design or print, set "pattern": "Solid".\n` +
    `3. Do NOT guess or hallucinate unseen attributes.\n` +
    `4. Output ONLY valid JSON.`
  );
}

async function callOllamaModel(model: string, imageBase64: string, hint?: ExtractHint, missedFields: string[] = []): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: buildPrompt(hint, missedFields),
        images: [imageBase64],
        format: "json",
        stream: false,
        keep_alive: OLLAMA_KEEP_ALIVE,
        options: {
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { response?: string };
    return body.response ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryModelExtract(imageBase64: string, hint?: ExtractHint): Promise<ExtractResult | null> {
  const missedFields = categoryLearning.get(categoryKey(hint?.category)) ?? [];

  const { response } =
    OLLAMA_MODEL === OLLAMA_FALLBACK_MODEL
      ? { response: await callOllamaModel(OLLAMA_MODEL, imageBase64, hint, missedFields) }
      : await raceModels(
          (model) => callOllamaModel(model, imageBase64, hint, missedFields),
          OLLAMA_MODEL,
          OLLAMA_FALLBACK_MODEL,
          OLLAMA_FALLBACK_TIMEOUT_MS,
        );

  if (!response) return null;

  // Structured JSON parsing (confidence: "high")
  const jsonAttributes = parseModelResponse(response);
  if (jsonAttributes && Object.keys(jsonAttributes).length > 0) {
    return { attributes: jsonAttributes, confidence: "high", source: "model" };
  }

  // Fallback: keyword-map prose description if model returned unstructured text
  const proseAttributes = parseModelDescription(response);
  if (proseAttributes && Object.keys(proseAttributes).length > 0) {
    return { attributes: proseAttributes, confidence: "medium", source: "model" };
  }

  return null;
}

// Loads a model into (V)RAM without running inference. Ollama treats a
// generate call with an empty prompt as a pure model-load, so this is the
// cheapest way to pay the cold-load cost up front (on boot, or when the
// seller opens the AI tab) instead of on the seller's first real photo.
async function warmModel(model: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: "", stream: false, keep_alive: OLLAMA_KEEP_ALIVE }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Warm both tiers so whichever the seller's hardware ends up using is already
// resident. Fire-and-forget on boot; awaited (with a cap) on /api/warmup.
async function warmAllModels(): Promise<void> {
  const models = OLLAMA_MODEL === OLLAMA_FALLBACK_MODEL ? [OLLAMA_MODEL] : [OLLAMA_MODEL, OLLAMA_FALLBACK_MODEL];
  await Promise.all(models.map(warmModel));
}

// The extension pings this when the AI Autofill tab mounts, so the model is
// loading while the seller picks and uploads a photo. Returns immediately —
// warming continues in the background — so the tab never blocks on it.
app.post("/api/warmup", (_req, res) => {
  void warmAllModels();
  res.json({ ok: true, model: OLLAMA_MODEL, fallbackModel: OLLAMA_FALLBACK_MODEL });
});

app.post("/api/extract", async (req, res) => {
  const { imageBase64, hint } = req.body as { imageBase64?: string; hint?: ExtractHint };
  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  const modelResult = await tryModelExtract(imageBase64, hint);
  if (modelResult?.source === "model") {
    const missing = EXPECTED_FIELDS.filter((field) => !(field in modelResult.attributes));
    const key = categoryKey(hint?.category);
    if (missing.length > 0) {
      if (!categoryLearning.has(key) && categoryLearning.size >= MAX_LEARNED_CATEGORIES) {
        const oldest = categoryLearning.keys().next().value;
        if (oldest) categoryLearning.delete(oldest);
      }
      categoryLearning.set(key, missing);
    }
    else categoryLearning.delete(key);
  }
  res.json(modelResult ?? extractHeuristic(hint ?? {}));
});

app.get("/health", (_req, res) =>
  res.json({ ok: true, model: OLLAMA_MODEL, fallbackModel: OLLAMA_FALLBACK_MODEL }),
);

const port = Number(process.env.PORT ?? 8000);
app.listen(port, () => {
  console.log(`extractor listening on ${port}`);
  // Warm on boot so the very first seller of the day isn't the one who pays
  // the cold-load. Fire-and-forget: never blocks the server coming up.
  void warmAllModels();
});
