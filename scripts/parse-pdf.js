const fs = require('fs');
const path = require('path');

// Use require for pdfjs-dist legacy build
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');

async function parsePdf(buffer) {
  // Load the PDF with CMap support for Chinese fonts
  const cmapsDir = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'cmaps');
  const loadingTask = pdfjsLib.getDocument({
    data: buffer,
    cMapUrl: cmapsDir,
    cMapPacked: true,
  });
  const pdfDocument = await loadingTask.promise;

  const fullText = [];

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

  return fullText.join('\n\n');
}

// Get file path from command line argument
const filePath = process.argv[2];

if (!filePath) {
  console.error('Error: No file path provided');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error('Error: File not found:', filePath);
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const uint8Array = new Uint8Array(buffer);

parsePdf(uint8Array)
  .then((text) => {
    if (!text || !text.trim()) {
      console.error('Error: No text could be extracted from PDF');
      process.exit(1);
    }
    console.log('PDF_TEXT_START');
    console.log(text);
    console.log('PDF_TEXT_END');
  })
  .catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
