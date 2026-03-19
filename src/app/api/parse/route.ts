import { NextRequest } from 'next/server';
import { extractRawText } from 'mammoth';
import * as fs from 'fs';
import { randomUUID } from 'crypto';

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
        // Parse PDF using child process
        console.log('Starting PDF parsing via child process...');

        // Save file temporarily
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const tempFileName = `${randomUUID()}.pdf`;
        const tempFilePath = process.cwd() + '/temp/' + tempFileName;

        // Ensure temp directory exists
        const tempDir = process.cwd() + '/temp';
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        fs.writeFileSync(tempFilePath, buffer);
        console.log('Temp file saved:', tempFilePath);

        // Run the parsing script - use absolute path string to avoid Turbopack resolution
        const scriptPath = process.cwd() + '/scripts/parse-pdf.js';

        try {
          text = await new Promise<string>((resolve, reject) => {
            // Use eval to avoid Turbopack's static path resolution
            // eslint-disable-next-line no-eval
            const child = eval("require('child_process').spawn")('node', [scriptPath, tempFilePath], {
              cwd: process.cwd(),
              stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data: Buffer) => {
              stdout += data.toString();
            });

            child.stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            });

            child.on('close', (code: number | null) => {
              // Clean up temp file
              try {
                fs.unlinkSync(tempFilePath);
              } catch (e) {
                console.error('Failed to delete temp file:', e);
              }

              if (code !== 0) {
                console.error('PDF parsing stderr:', stderr);
                reject(new Error(stderr.split('\n').pop() || 'PDF parsing failed'));
                return;
              }

              // Extract text between markers
              const start = stdout.indexOf('PDF_TEXT_START');
              const end = stdout.indexOf('PDF_TEXT_END');

              if (start === -1 || end === -1) {
                reject(new Error('Failed to parse PDF output'));
                return;
              }

              const extractedText = stdout.substring(start + 16, end).trim();
              resolve(extractedText);
            });
          });

          console.log('PDF parsed successfully, length:', text.length);
        } catch (parseError) {
          console.error('PDF parsing error:', parseError);
          throw parseError;
        }

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
