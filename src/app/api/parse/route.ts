import { NextRequest } from 'next/server';
import { extractRawText } from 'mammoth';

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
      // Parse PDF using pdfjs-dist (better Chinese support)
      const arrayBuffer = await file.arrayBuffer();

      try {
        // Dynamic import to avoid build-time evaluation issues
        const pdfjs = await import('pdfjs-dist');

        // Configure the worker with CDN
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;

        const fullText: string[] = [];

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          fullText.push(pageText);
        }

        text = fullText.join('\n\n');
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return new Response(
          JSON.stringify({ error: 'Failed to parse PDF file' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else if (isDocx || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Parse DOCX on server
      const arrayBuffer = await file.arrayBuffer();
      // Convert ArrayBuffer to Buffer for Node.js
      const buffer = Buffer.from(arrayBuffer);
      const result = await extractRawText({ buffer });
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
