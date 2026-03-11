import { NextRequest } from 'next/server';
import { PDFParse } from 'pdf-parse';
import path from 'path';

// Configure PDF.js worker - use file:// URL format
const workerPath = path.join(
  process.cwd(),
  'node_modules',
  '.pnpm',
  'pdf-parse@2.4.5',
  'node_modules',
  'pdf-parse',
  'dist',
  'worker',
  'pdf.worker.mjs'
).replace(/\\/g, '/');

// Convert to file:// URL
const workerUrl = `file:///${workerPath}`;
PDFParse.setWorker(workerUrl);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get file extension
    const fileName = file.name.toLowerCase();
    const isPdf = fileName.endsWith('.pdf');
    const isDocx = fileName.endsWith('.docx');

    // Also check MIME type as fallback
    const validMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const hasValidMimeType = validMimeTypes.includes(file.type);

    // Accept file if either extension or MIME type is valid
    if (!((isPdf || isDocx) || hasValidMimeType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PDF and DOCX are supported' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    let text = '';

    if (isPdf || file.type === 'application/pdf') {
      // Parse PDF on server
      const arrayBuffer = await file.arrayBuffer();
      const pdfParser = new PDFParse({ data: arrayBuffer });
      const result = await pdfParser.getText();
      text = result.text;
    } else if (isDocx || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Parse DOCX on server - use Node.js specific import
      const mammoth = await import('mammoth/lib');
      const arrayBuffer = await file.arrayBuffer();
      // Convert ArrayBuffer to Buffer for Node.js
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    if (!text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Could not extract text from file' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('File parsing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
