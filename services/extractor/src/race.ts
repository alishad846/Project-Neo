export type OllamaCaller = (model: string) => Promise<string | null>;

export interface RaceResult {
  response: string | null;
  modelUsed: string;
}

// Resolves with the first promise to produce a non-null `.response`. If every
// promise ends up null (all models failed/unavailable), resolves with
// whichever settled last, so the caller still gets a definitive answer.
function firstNonNull(promises: Array<Promise<RaceResult>>): Promise<RaceResult> {
  return new Promise((resolve) => {
    let remaining = promises.length;
    let last: RaceResult;
    for (const p of promises) {
      p.then((result) => {
        last = result;
        remaining -= 1;
        if (result.response !== null) resolve(result);
        else if (remaining === 0) resolve(last);
      });
    }
  });
}

// Hedged-request pattern: calls `primaryModel` immediately. If it hasn't
// produced a usable response within `fallbackDelayMs` — because it's slow
// (CPU inference) OR because it failed fast (e.g. the model isn't pulled
// into Ollama) — a call to `fallbackModel` starts too, and whichever
// produces a real response first wins. This is what keeps extraction fast
// and resilient for sellers on slow/CPU-only hardware, or when the primary
// model is temporarily unavailable, without hard-coding a lightweight model
// for everyone: GPU-warmed inference (~1-3s) never trips the fallback delay.
export async function raceModels(
  callModel: OllamaCaller,
  primaryModel: string,
  fallbackModel: string,
  fallbackDelayMs: number,
): Promise<RaceResult> {
  const primary: Promise<RaceResult> = callModel(primaryModel).then((response) => ({
    response,
    modelUsed: primaryModel,
  }));

  const delayElapsed = new Promise<null>((resolve) => setTimeout(() => resolve(null), fallbackDelayMs));
  const early = await Promise.race([primary, delayElapsed]);

  // Primary produced a real result before the delay elapsed — use it.
  if (early !== null && early.response !== null) return early;

  // Primary is either still pending (slow) or already failed fast — either
  // way, bring in the fallback and take whichever produces a usable
  // response first.
  const fallback: Promise<RaceResult> = callModel(fallbackModel).then((response) => ({
    response,
    modelUsed: fallbackModel,
  }));

  return firstNonNull([primary, fallback]);
}
