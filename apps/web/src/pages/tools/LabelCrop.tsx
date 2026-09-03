import { useCallback, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
// Vite-bundled worker asset — required so pdfjs doesn't try to fetch a worker
// from a CDN at runtime (no server, no external calls).
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { UploadCloud, Loader2, Download } from "lucide-react";
import { ToolPageLayout } from "../../components/tools/ToolPageLayout";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type Status = "idle" | "loading-preview" | "ready" | "processing" | "error";

const inputClass =
  "w-full rounded-lg border-2 border-black px-3 py-2 font-body text-sm outline-none focus:bg-[#fff8fb]";
const labelClass = "font-body text-xs font-semibold uppercase tracking-wide text-black/60";

export function LabelCrop() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Crop margins as a % of each page dimension, measured in from each edge —
  // robust and doesn't depend on a fiddly drag-rectangle to get right.
  const [top, setTop] = useState(5);
  const [right, setRight] = useState(5);
  const [bottom, setBottom] = useState(5);
  const [left, setLeft] = useState(5);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadFile = useCallback(async (file: File) => {
    setStatus("loading-preview");
    setError(null);
    setDownloadUrl(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      setFileBytes(buf);
      setFileName(file.name);

      const doc = await getDocument({ data: buf.slice() }).promise;
      const page = await doc.getPage(1);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      }
      setPreviewUrl(URL.createObjectURL(file));
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Couldn't read that PDF — it may be corrupt or password-protected.");
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void loadFile(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void loadFile(file);
  };

  const applyCrop = useCallback(async () => {
    if (!fileBytes) return;
    setStatus("processing");
    setError(null);
    try {
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const tFrac = Math.min(Math.max(top, 0), 49) / 100;
      const rFrac = Math.min(Math.max(right, 0), 49) / 100;
      const bFrac = Math.min(Math.max(bottom, 0), 49) / 100;
      const lFrac = Math.min(Math.max(left, 0), 49) / 100;

      for (const page of pages) {
        const { width, height } = page.getSize();
        const x = width * lFrac;
        const y = height * bFrac;
        const w = width * (1 - lFrac - rFrac);
        const h = height * (1 - tFrac - bFrac);
        if (w <= 0 || h <= 0) throw new Error("Crop margins leave nothing on the page.");
        page.setCropBox(x, y, w, h);
        page.setMediaBox(x, y, w, h);
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      setDownloadUrl(URL.createObjectURL(blob));
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't crop that PDF.");
    }
  }, [fileBytes, top, right, bottom, left]);

  return (
    <ToolPageLayout
      title="Shipping Label Crop"
      intro="Trim courier-generated PDF labels down to just the label — everything runs in your browser, nothing is uploaded anywhere."
    >
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/40 px-4 py-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <UploadCloud className="h-8 w-8 stroke-[2px] text-black/50" />
        <p className="font-body text-sm text-black/70">Drag a PDF here, or</p>
        <label className="cursor-pointer rounded-lg border-2 border-black bg-[#ffe680] px-4 py-2 font-body text-sm font-semibold shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 transition-transform">
          Choose file
          <input type="file" accept="application/pdf" className="hidden" onChange={onFileInput} />
        </label>
        {fileName && <p className="font-body text-xs text-black/50">{fileName}</p>}
      </div>

      {status === "loading-preview" && (
        <div className="mt-4 flex items-center gap-2 font-body text-sm text-black/60">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading PDF…
        </div>
      )}

      {status === "error" && error && (
        <div className="mt-4 rounded-lg border-2 border-black bg-[#ff6b6b] px-3 py-2 font-body text-sm font-semibold">
          {error}
        </div>
      )}

      {previewUrl && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className={labelClass}>Page 1 preview</p>
            <div className="mt-2 max-h-96 overflow-auto rounded-lg border-2 border-black bg-[#f5f5f5] p-2">
              <canvas ref={canvasRef} className="max-w-full" />
            </div>
          </div>

          <div>
            <p className={labelClass}>Crop margins (% of page, from each edge)</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="font-body text-xs">Top</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={49}
                  value={top}
                  onChange={(e) => setTop(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-xs">Right</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={49}
                  value={right}
                  onChange={(e) => setRight(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-xs">Bottom</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={49}
                  value={bottom}
                  onChange={(e) => setBottom(Number(e.target.value))}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-body text-xs">Left</span>
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  max={49}
                  value={left}
                  onChange={(e) => setLeft(Number(e.target.value))}
                />
              </label>
            </div>

            <button
              onClick={() => void applyCrop()}
              disabled={status === "processing"}
              className="mt-4 flex items-center gap-2 rounded-lg border-2 border-black bg-[#b2ff59] px-4 py-2 font-body text-sm font-semibold shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 transition-transform disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Cropping…
                </>
              ) : (
                "Crop all pages"
              )}
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={fileName.replace(/\.pdf$/i, "") + "-cropped.pdf"}
                className="mt-3 flex w-fit items-center gap-2 rounded-lg border-2 border-black bg-white px-4 py-2 font-body text-sm font-semibold shadow-[3px_3px_0px_0px_#000] hover:-translate-y-0.5 transition-transform"
              >
                <Download className="h-4 w-4" /> Download cropped PDF
              </a>
            )}
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
