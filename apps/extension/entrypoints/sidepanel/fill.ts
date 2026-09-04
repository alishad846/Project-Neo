import { browser } from "wxt/browser";

export interface FillResult {
  ok: boolean;
  error?: string;
  filled?: string[];
  skipped?: string[];
  failed?: Array<{
    field: string;
    error: string;
  }>;
  warnings?: string[];
  requiredMissing?: string[];
  mapped?: Array<{
    field: string;
    from: unknown;
    to: unknown;
  }>;
}

export async function sendFill(
  product: unknown,
): Promise<FillResult> {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

    const tabId = tabs?.[0]?.id;

    if (!tabId) {
      return {
        ok: false,
        error: "No active tab found",
      };
    }

    const result = (await browser.tabs.sendMessage(
      tabId,
      {
        type: "PROJECT_NEO_AUTOFILL_MEESHO",
        product,
      },
    )) as
      | {
          success?: boolean;
          filled?: string[];
          skipped?: string[];
          failed?: Array<{
            field: string;
            error: string;
          }>;
          warnings?: string[];
          requiredMissing?: string[];
          mapped?: Array<{
            field: string;
            from: unknown;
            to: unknown;
          }>;
          error?: string;
        }
      | undefined;

    if (!result) {
      return {
        ok: false,
        error: "No autofill result returned",
      };
    }

    return {
      ok: Boolean(result.success),
      error: result.error,
      filled: result.filled ?? [],
      skipped: result.skipped ?? [],
      failed: result.failed ?? [],
      warnings: result.warnings ?? [],
      requiredMissing: result.requiredMissing ?? [],
      mapped: result.mapped ?? [],
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : String(err),
    };
  }
}