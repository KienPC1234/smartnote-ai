import { createWorker } from 'tesseract.js';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const processFile = async (file: File | Blob, onProgress?: (p: string) => void): Promise<string> => {
  const fileName = (file as File).name || "file.png";
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (onProgress) onProgress(`Starting ${extension?.toUpperCase()} analysis...`);

  switch (extension) {
    case 'pdf':
      return await processPDF(file, onProgress);
    case 'docx':
      if (onProgress) onProgress("Reading Document structure...");
      return await processDocx(file);
    case 'xlsx':
    case 'xls':
    case 'csv':
      if (onProgress) onProgress("Parsing Spreadsheet data...");
      return await processSheet(file);
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return await processImage(file, onProgress);
    default:
      throw new Error(`Unsupported file format: ${extension}`);
  }
};

async function processImage(file: File | Blob | Buffer, onProgress?: (p: string) => void): Promise<string> {
  if (onProgress) onProgress("Initializing OCR Modules...");

  let data: Buffer | Uint8Array;
  if (Buffer.isBuffer(file)) {
      data = file;
  } else {
      const arrayBuffer = await file.arrayBuffer();
      data = new Uint8Array(arrayBuffer);
  }

  const worker = await createWorker({
    logger: m => {
      if (onProgress && m.status === 'recognizing text') {
        onProgress(`OCR Scanning: ${Math.round(m.progress * 100)}%`);
      }
    },
    errorHandler: e => console.error("[TESSERACT WORKER ERROR]", e),
  });

  try {
    // Step 1: Explicitly load languages
    await worker.loadLanguage('vie+eng');
    
    // Step 2: Explicitly initialize the engine
    await worker.initialize('vie+eng');

    // Step 3: Recognize with pre-initialized worker
    const { data: { text } } = await worker.recognize(data);

    await worker.terminate();
    return text;
  } catch (error: any) {
    // Crucial: always terminate to prevent memory leaks on failure
    await worker.terminate();
    console.error("[OCR ERROR]", error);
    throw new Error(`OCR Processing failed: ${error.message}`);
  }
}

async function processPDF(file: File | Blob, onProgress?: (p: string) => void): Promise<string> {
  try {
    if (onProgress) onProgress("Initializing Neural Uplink...");

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const canvasMod = await import('canvas');
    const { createCanvas, Image, ImageData } = canvasMod;

    // Polyfills for Node.js environment
    (globalThis as any).Image = Image;
    (globalThis as any).ImageData = ImageData;

    // Factory to manage canvas lifecycle correctly for PDF.js
    class NodeCanvasFactory {
      create(width: number, height: number) {
        const canvas = createCanvas(Math.ceil(width), Math.ceil(height));
        const context = canvas.getContext('2d');
        return { canvas, context };
      }
      reset(canvasAndContext: any, width: number, height: number) {
        canvasAndContext.canvas.width = Math.ceil(width);
        canvasAndContext.canvas.height = Math.ceil(height);
      }
      destroy(canvasAndContext: any) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
      }
    }

    if (typeof window === 'undefined') {
        await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
        (pdfjsLib as any).GlobalWorkerOptions.workerSrc = ''; 
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      disableWorker: true, 
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    if (onProgress) onProgress(`PDF Synced: ${pdf.numPages} pages identified.`);

    let fullText = "";
    const canvasFactory = new NodeCanvasFactory();

    for (let i = 1; i <= pdf.numPages; i++) {
      if (onProgress) onProgress(`Analyzing Page ${i}/${pdf.numPages}...`);
      const page = await pdf.getPage(i);

      // --- HYBRID APPROACH: Try TextContent First ---
      const textContent = await page.getTextContent();
      const extractedText = textContent.items.map((item: any) => (item as any).str).join(" ").trim();

      // If text exists and seems sufficient, use it. Otherwise fallback to OCR.
      if (extractedText.length > 100) {
          console.log(`[PDF] Page ${i}: Using direct text extraction (${extractedText.length} chars)`);
          fullText += `--- Page ${i} ---\n${extractedText}\n\n`;
      } else {
          console.log(`[PDF] Page ${i}: Text content sparse. Initiating OCR...`);
          if (onProgress) onProgress(`Scanning Page ${i} via Optical Sensor...`);

          const viewport = page.getViewport({ scale: 1.5 });
          const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

          await page.render({
            canvasContext: context as any,
            viewport,
            canvasFactory: canvasFactory as any,
          }).promise;

          const buffer = canvas.toBuffer('image/png');
          const ocrText = await processImage(buffer, onProgress);
          fullText += `--- Page ${i} (OCR) ---\n${ocrText}\n\n`;

          canvasFactory.destroy({ canvas, context });
      }
    }

    if (onProgress) onProgress("Neural Extraction Complete.");
    return fullText;
  } catch (error: any) {
    console.error("[PDF PROCESS ERROR]", error);
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}

async function processDocx(file: File | Blob): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function processSheet(file: File | Blob): Promise<string> {
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
