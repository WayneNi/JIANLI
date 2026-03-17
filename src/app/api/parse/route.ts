import { NextRequest } from 'next/server';
import { extractRawText } from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

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
      try {
        // Parse PDF using pdfjs-dist v3 (better Node.js support)
        console.log('Starting PDF parsing...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('ArrayBuffer length:', arrayBuffer.byteLength);

        // Dynamic import
        const pdfjs = await import('pdfjs-dist');

        // For server-side, we need to read the worker file and create a data URL
        // Use the legacy build which works better in Node.js
        const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.js');
        const workerCode = fs.readFileSync(workerPath);
        const workerBase64 = workerCode.toString('base64');
        pdfjs.GlobalWorkerOptions.workerSrc = `data:application/javascript;base64,${workerBase64}`;

        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;

        const fullText: string[] = [];

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => {
              if ('str' in item) {
                return item.str;
              }
              return '';
            })
            .join(' ');
          fullText.push(pageText);
        }

        text = fullText.join('\n\n');

        // Check if extracted text is empty (likely a scanned/image PDF)
        if (!text.trim()) {
          return new Response(
            JSON.stringify({
              error: '此PDF文件可能是扫描件或图片格式，无法提取文字。请尝试：\n1. 使用文字版PDF文件\n2. 将图片转换为文字PDF\n3. 手动复制粘贴简历内容'
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (pdfError: unknown) {
        console.error('PDF parsing error:', pdfError);

        const errorMessage = pdfError instanceof Error ? pdfError.message : String(pdfError);

        if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
          return new Response(
            JSON.stringify({ error: '网络连接失败，请检查网络后重试' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        if (errorMessage.includes('Invalid PDF') || errorMessage.includes('PDF')) {
          return new Response(
            JSON.stringify({ error: 'PDF文件格式无效或已损坏，请确保文件是有效的PDF文档' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }

        return new Response(
          JSON.stringify({
            error: 'PDF解析失败',
            details: errorMessage
          }),
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
        JSON.stringify({ error: '无法提取文件内容，请确保文件不是纯图片格式' }),
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
