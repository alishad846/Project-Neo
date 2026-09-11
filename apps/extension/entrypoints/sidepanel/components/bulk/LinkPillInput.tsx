import { useState } from "react";
import { X } from "lucide-react";
import { parseImageLinks } from "./assemble";

// A tokenizing input for product image links. Each link the seller pastes (or
// types + separator) becomes a removable "pill" and is treated as one SKU.
// Links pasted back-to-back with no separator are split automatically (see
// parseImageLinks). Newly-found links are de-duplicated against existing pills.
export function LinkPillInput(props: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  // Optional cap on how many links may be added (e.g. 4 image slots).
  max?: number;
  // Optional custom pill label per index (default: "SKU {i+1}").
  labelFor?: (index: number, url: string) => string;
}) {
  const [draft, setDraft] = useState("");
  const atMax = props.max !== undefined && props.value.length >= props.max;

  // Extract any links from `text` and append the new ones (respecting `max`).
  // Returns whether any were added.
  function addFrom(text: string): boolean {
    const found = parseImageLinks(text);
    if (found.length === 0) return false;
    const merged = [...props.value];
    for (const url of found) {
      if (props.max !== undefined && merged.length >= props.max) break;
      if (!merged.includes(url)) merged.push(url);
    }
    if (merged.length === props.value.length) return false;
    props.onChange(merged);
    return true;
  }

  function commitDraft() {
    if (addFrom(draft)) setDraft("");
  }

  function shortLabel(url: string): string {
    try {
      const last = new URL(url).pathname.split("/").filter(Boolean).pop();
      return last || url;
    } catch {
      return url;
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border-2 border-black bg-white p-2">
      {props.value.map((url, i) => (
        <span
          key={url}
          className="inline-flex max-w-full items-center gap-1 rounded-full border-2 border-black bg-[#ff90e8] px-2 py-0.5 font-cartoon text-[11px] font-semibold shadow-[2px_2px_0px_0px_#000]"
        >
          <span className="max-w-[170px] truncate" title={url}>
            {(props.labelFor ? props.labelFor(i, url) : `SKU ${i + 1}`)}: {shortLabel(url)}
          </span>
          <button
            type="button"
            aria-label={`Remove SKU ${i + 1}`}
            className="shrink-0"
            onClick={() => props.onChange(props.value.filter((u) => u !== url))}
          >
            <X className="h-3 w-3 stroke-[3px]" />
          </button>
        </span>
      ))}

      {!atMax && (
      <input
        className="min-w-[130px] flex-1 bg-transparent px-1 py-0.5 font-cartoon text-xs outline-none"
        value={draft}
        placeholder={props.value.length ? "Paste another link…" : props.placeholder ?? "Paste image link(s)…"}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          // If the paste contains link(s), tokenize them into pills instead of
          // dropping raw text into the field.
          if (parseImageLinks(draft + " " + pasted).length) {
            e.preventDefault();
            addFrom(draft + " " + pasted);
            setDraft("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "," || e.key === " ") {
            if (parseImageLinks(draft).length) {
              e.preventDefault();
              commitDraft();
            }
          }
          if (e.key === "Backspace" && draft === "" && props.value.length) {
            // Backspace on an empty field removes the last pill.
            props.onChange(props.value.slice(0, -1));
          }
        }}
        onBlur={commitDraft}
      />
      )}
    </div>
  );
}
