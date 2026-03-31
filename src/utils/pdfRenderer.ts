import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export async function renderPdfToImages(
  file: File,
  maxPages = 15
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdfDoc = await loadingTask.promise;

  const totalPages = pdfDoc.numPages;
  const pagesToProcess = Math.min(totalPages, maxPages);
  const images: string[] = [];

  for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      // Ensure the backing store is created before rendering.
      canvas.getContext("2d")!;

      await page.render({ canvas, viewport }).promise;

      const base64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      images.push(base64);
    } catch (e) {
      console.error(`Failed to render page ${pageNum}:`, e);
      continue;
    }
  }

  return images;
}

