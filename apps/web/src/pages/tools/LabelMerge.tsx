import { useCallback, useState } from "react";
import { PDFDocument, type PDFEmbeddedPage } from "pdf-lib";
import { UploadCloud, Loader2, Download } from "lucide-react";
import { ToolPageLayout } from "../../components/tools/ToolPageLayout";

type Status = "idle" | "processing" | "done" | "error";

// A4 in PDF points (72pt/in).
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 18;
const CELL_GAP = 8;

const GRID_OPTIONS: { value: number; label: string; cols: number; rows: number }[] = [
  { value: 2, label: "2 per page", cols: 1, rows: 2 },
  { value: 4, label: "4 per page", cols: 2, rows: 2 },
  { value: 6, label: "6 per page", cols: 2, rows: 3 },
  { value: 8, label: "8 per page", cols: 2, rows: 4 },
];

export function LabelMerge() {
  const [files, setFiles] = useState<File[]>([]);
  const [perPage, setPerPage] = useState(4);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list)]);
    setStatus("idle");
    setDownloadUrl(null);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const merge = useCallback(async () => {
    if (files.length === 0) return;
    setStatus("processing");
    setError(null);
    try {
      const outDoc = await PDFDocument.create();
      const grid = GRID_OPTIONS.find((g) => g.value === perPage) ?? GRID_OPTIONS[1];

      // Embed every page of every uploaded file, in upload order, into the
      // output document. embedPdf defaults to only page 0 unless given
      // explicit indices, so load each source first to find its page count.
      const embeddedPages: PDFEmbeddedPage[] = [];
      for (const file of files) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const srcDoc = await PDFDocument.load(bytes);
        const indices = srcDoc.getPageIndices();
        const pages = await outDoc.embedPdf(bytes, indices);
        embeddedPages.push(...pages);
      }
      if (embeddedPages.length === 0) throw new Error("No pages found in the uploaded files.");

      const cellW = (A4_WIDTH - PAGE_MARGIN * 2 - CELL_GAP * (grid.cols - 1)) / grid.cols;
      const cellH = (A4_HEIGHT - PAGE_MARGIN * 2 - CELL_GAP * (grid.rows - 1)) / grid.rows;

      for (let i = 0; i < embeddedPages.length; i += perPage) {
        const chunk = embeddedPages.slice(i, i + perPage);
        const page = outDoc.addPage([A4_WIDTH, A4_HEIGHT]);

        chunk.forEach((embedded, cellIdx) => {
          const col = cellIdx % grid.cols;
          const row = Math.floor(cellIdx / grid.cols);

          const scale = Math.min(cellW / embedded.width, cellH / embedded.height);
          const drawW = embedded.width * scale;
          const drawH = embedded.height * scale;

          const cellX = PAGE_MARGIN + col * (cellW + CELL_GAP);
          const cellTopY = A4_HEIGHT - PAGE_MARGIN - row * (cellH + CELL_GAP);
          const x = cellX + (cellW - drawW) / 2;
          const y = cellTopY - cellH + (cellH - drawH) / 2;

          page.drawPage(embedded, { x, y, xScale: scale, yScale: scale });
        });
      }

      const bytes = await outDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't merge those PDFs.");
    }
  }, [files, perPage]);

  return (
    <ToolPageLayout
      title="Label Merge"
      titleSuffix="(A4)"
      intro="Combine several shipping label PDFs onto shared A4 sheets — pick a grid, merge, print, cut. Everything happens in your browser."
    >
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/40 px-4 py-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <UploadCloud className="h-8 w-8 stroke-[2px] text-black/50" />
        <p className="font-body text-sm text-black/70">Drag one or more label PDFs here, or</p>
        <label className="cursor-pointer rounded-lg border-2 border-black bg-[#ffe680] px-4 py-2 font-body text-sm font-semibold shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 transition-transform">
          Choose files
          <input
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {files.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center justify-between rounded-lg border-2 border-black px-3 py-1.5 font-body text-sm"
            >
              <span className="truncate">{f.name}</span>
              <button
                onClick={() => removeFile(idx)}
                className="ml-2 font-body text-xs font-semibold text-black/60 hover:text-black"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold uppercase tracking-wide text-black/60">
            Labels per A4 page
          </span>
          <select
            className="rounded-lg border-2 border-black px-3 py-2 font-body text-sm"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            {GRID_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => void merge()}
          disabled={files.length === 0 || status === "processing"}
          className="flex items-center gap-2 rounded-lg border-2 border-black bg-[#b2ff59] px-4 py-2 font-body text-sm font-semibold shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 transition-transform disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "processing" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Merging…
            </>
          ) : (
            "Merge to A4"
          )}
        </button>
      </div>

      {status === "error" && error && (
        <div className="mt-4 rounded-lg border-2 border-black bg-[#ff6b6b] px-3 py-2 font-body text-sm font-semibold">
          {error}
        </div>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          download="merged-labels.pdf"
          className="mt-4 flex w-fit items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 font-body text-sm font-semibold shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 transition-transform"
        >
          <Download className="h-4 w-4" /> Download merged PDF
        </a>
      )}
    </ToolPageLayout>
  );
}
