import { createWorker } from 'tesseract.js';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Cấu hình worker sẽ được thực hiện bên trong hàm processPDF hoi


export const processFile = async (file: File, onProgress?: (p: string) => void): Promise<string> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return await processPDF(file, onProgress);
    case 'docx':
      return await processDocx(file);
    case 'xlsx':
    case 'xls':
    case 'csv':
      return await processSheet(file);
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return await processImage(file, onProgress);
    default:
      throw new Error("Unsupported file format");
  }
};

async function processImage(file: File | Blob, onProgress?: (p: string) => void): Promise<string> {
  const worker = await createWorker('vie+eng');

  if (onProgress) {
    onProgress("Initializing OCR...");
  }

  const { data: { text } } = await worker.recognize(file);
  await worker.terminate();
  return text;
}

async function processPDF(file: File, onProgress?: (p: string) => void): Promise<string> {
  // Dynamic import to avoid SSR issues with canvas
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // @ts-ignore - canvas types might conflict or be missing in some setups
  const { createCanvas } = await import('canvas');

  // Set worker to local file using standard import if require is not available, 
  // or use the path. For Next.js/Webpack, dynamic import of worker file often helps.
  // We use a trick to make it work in Node without external HTTP fetch.
  // Actually, for legacy build in Node, it might work without setting workerSrc if we don't disable worker.
  // But to be safe, we point to the local file.
  // NOTE: require.resolve might not work in true ESM, but Next.js usually polyfills it.
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
  } catch (e) {
    // Fallback if require.resolve fails (e.g. pure ESM)
    // in that case potentially use a relative path or hope for default worker
    console.warn("Could not resolve local worker, relying on default", e);
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    // Disable worker if all else fails (slower but reliable in Node)
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;

  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    if (onProgress) onProgress(`Page ${i}/${pdf.numPages}`);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");

    // If text is too short, assume scanned and use OCR
    if (pageText.trim().length < 20) {
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context as any,
        viewport: viewport,
        canvasFactory: undefined, // Explicitly undefined to avoid type error if strict
      } as any).promise; // Cast to any to bypass strict 'canvas' property requirement

      const buffer = canvas.toBuffer('image/png');

      // Convert Node Buffer to Blob for Tesseract
      const blob = new Blob([buffer], { type: 'image/png' });
      const ocrText = await processImage(blob, undefined);
      fullText += ocrText + "\n";
    } else {
      fullText += pageText + "\n";
    }
  }
  return fullText;
}

async function processDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function processSheet(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  let text = "";
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    text += `--- Sheet: ${name} ---\n`;
    text += XLSX.utils.sheet_to_txt(sheet) + "\n";
  });
  return text;
}
