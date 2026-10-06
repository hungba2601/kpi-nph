import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// Chuyển đổi HTML trích xuất từ DOCX (đặc biệt là bảng biểu <table>) thành văn bản cấu trúc rõ ràng
function convertDocxHtmlToStructuredText(html: string): string {
  let text = html;

  // 1. Phân tích các hàng trong thẻ <table>
  text = text.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/gi, (_, rowContent) => {
    const cells: string[] = [];
    const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
    let match;
    while ((match = cellRegex.exec(rowContent)) !== null) {
      const cleanCell = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanCell) cells.push(cleanCell);
    }

    if (cells.length === 0) return '';

    // Bỏ qua hàng tiêu đề cột
    const isHeaderRow = cells.some(
      (c) =>
        c.toLowerCase() === 'stt' ||
        c.toLowerCase().includes('danh mục công việc') ||
        c.toLowerCase().includes('tên công việc') ||
        c.toLowerCase().includes('thời hạn hoàn thành') ||
        c.toLowerCase().includes('thời hạn')
    );
    if (isHeaderRow) {
      return '';
    }

    // Trường hợp bảng 3 cột: [STT, Danh mục công việc, Thời hạn hoàn thành]
    if (cells.length >= 3 && /^\d+$/.test(cells[0])) {
      return `\n${cells[0]}. ${cells[1]} | Hạn hoàn thành: ${cells[2]}`;
    }

    // Trường hợp bảng 2 cột: [Tên công việc, Thời hạn hoàn thành]
    if (cells.length === 2 && /\d{1,2}[\/\.-]\d{1,2}/.test(cells[1])) {
      return `\n- ${cells[0]} | Hạn hoàn thành: ${cells[1]}`;
    }

    return '\n' + cells.join(' | ');
  });

  // 2. Chuyển đổi các thẻ khối đoạn văn
  text = text.replace(/<\/p>/gi, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');

  return text;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Không tìm thấy tệp tin tải lên' }, { status: 400 });
    }

    const fileName = file.name || 'document';
    const extension = fileName.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (extension === 'docx') {
      try {
        // Dùng convertToHtml để giữ nguyên cấu trúc bảng biểu (table 3 cột: STT, Công việc, Thời hạn)
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const htmlContent = htmlResult.value || '';

        if (htmlContent.includes('<table')) {
          extractedText = convertDocxHtmlToStructuredText(htmlContent);
        } else {
          const rawResult = await mammoth.extractRawText({ buffer });
          extractedText = rawResult.value || '';
        }
      } catch (docxErr) {
        console.warn('HTML table parsing failed, falling back to raw text:', docxErr);
        const rawResult = await mammoth.extractRawText({ buffer });
        extractedText = rawResult.value || '';
      }
    } else if (extension === 'pdf') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfModule = require('pdf-parse');
        if (pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          await parser.load();
          const parsed = await parser.getText();
          await parser.destroy();
          extractedText = typeof parsed === 'string' ? parsed : (parsed?.text || '');
        } else if (typeof pdfModule === 'function') {
          const data = await pdfModule(buffer);
          extractedText = data.text || '';
        } else {
          throw new Error('Không tương thích với thư viện đọc PDF');
        }
      } catch (pdfErr: unknown) {
        console.error('Error parsing PDF:', pdfErr);
        const errMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
        return NextResponse.json(
          { error: `Không thể đọc nội dung PDF: ${errMsg}. Vui lòng thử sao chép văn bản trực tiếp.` },
          { status: 500 }
        );
      }
    } else if (extension === 'txt' || extension === 'md') {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: 'Định dạng tệp không được hỗ trợ. Vui lòng tải lên file .docx, .pdf hoặc .txt' },
        { status: 400 }
      );
    }

    // Clean up empty lines
    const cleanedText = extractedText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');

    return NextResponse.json({
      success: true,
      fileName,
      charCount: cleanedText.length,
      text: cleanedText,
    });
  } catch (error: unknown) {
    console.error('Extraction error:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Lỗi xử lý tệp tin: ${errMsg}` },
      { status: 500 }
    );
  }
}
