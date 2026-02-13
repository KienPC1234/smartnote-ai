import { createWorker } from 'tesseract.js';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export const processFile = async (file: File | Blob, onProgress?: (p: string) => void): Promise<string> => {
  const fileName = (file as File).name || "file.png";
  const extension = fileName.split('.').pop()?.toLowerCase();

  console.log(`[PROCESSOR] Extension: ${extension}`);

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

async function processImage(file: File | Blob | Buffer, onProgress?: (p: string) => void): Promise<string> {
  const worker = await createWorker('vie+eng');

  if (onProgress) {
    onProgress("Initializing OCR...");
  }

  let buffer: Buffer;
  if (Buffer.isBuffer(file)) {
      buffer = file;
  } else {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
  }

  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();
  return text;
}

async function processPDF(file: File | Blob, onProgress?: (p: string) => void): Promise<string> {
  // Use the legacy build which is specifically designed for Node.js environments
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const { createCanvas } = await import('canvas');

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // We explicitly disable the worker to prevent it from trying to load an external .mjs file
  // This forces PDF.js to run in the main thread (fake worker mode) without dynamic imports
  const loadingTask = pdfjsLib.getDocument({
    data: uint8Array,
    disableWorker: true, 
    useSystemFonts: true,
    disableFontFace: true,
    isEvalSupported: false,
  } as any);

  try {
    const pdf = await loadingTask.promise;
    let fullText = "";

    console.log(`[PDF] Document loaded. Pages: ${pdf.numPages}`);

    for (let i = 1; i <= pdf.numPages; i++) {
      if (onProgress) onProgress(`Rendering Page ${i}/${pdf.numPages}`);
      console.log(`[PDF] Rendering Page ${i}...`);
      
      const page = await pdf.getPage(i);
      
      // Render to image for OCR
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context as any,
        viewport: viewport,
      } as any).promise;

      const buffer = canvas.toBuffer('image/png');
      
      if (onProgress) onProgress(`OCR Analyzing Page ${i}/${pdf.numPages}`);
      const ocrText = await processImage(buffer);

      fullText += `--- Page ${i} ---\n${ocrText}\n\n`;
    }
    
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
