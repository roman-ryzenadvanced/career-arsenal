/**
 * Client-side file parser.
 *
 * WHY: The platform's edge layer (Alibaba Cloud Function Compute) has a body
 * size limit (~32KB) and corrupts multipart/form-data. So instead of uploading
 * the raw file to the server, we parse it IN THE BROWSER and send only the
 * extracted plain text (typically 5-15KB) via a small JSON PATCH request.
 *
 * Supported:
 *  - PDF  → via pdfjs-dist (browser build, worker disabled)
 *  - DOCX → via mammoth.browser.js
 *  - TXT/MD → direct read
 */

import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - mammoth.browser.js is a pre-built UMD bundle
import mammoth from 'mammoth/mammoth.browser.js';

// Disable the worker — runs on main thread (fine for resume-sized PDFs)
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerPort = null;

export interface ParsedFile {
  text: string;
  sourceKind: 'resume' | 'linkedin';
  fileName: string;
  fileSize: number;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const lowerName = file.name.toLowerCase();
  let text = '';

  if (lowerName.endsWith('.pdf')) {
    text = await parsePdf(file);
  } else if (lowerName.endsWith('.docx')) {
    text = await parseDocx(file);
  } else if (lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    text = await file.text();
  } else {
    throw new Error('Unsupported file type. Please upload PDF, DOCX, or TXT.');
  }

  text = text.trim();
  if (text.length < 50) {
    throw new Error('The file appears to be empty or could not be parsed (text too short).');
  }

  const sourceKind = lowerName.includes('linkedin') ? 'linkedin' : 'resume';

  return {
    text,
    sourceKind,
    fileName: file.name,
    fileSize: file.size,
  };
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);

  // @ts-ignore - pdfjs types are loose
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    isEvalSupported: false,
    useWorkerFetch: false,
  });

  const pdf = await loadingTask.promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (item.str ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n\n';
  }

  try { await pdf.destroy(); } catch {}

  return fullText;
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore - mammoth.browser.js types
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || '';
}
