import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KPI Assistant AI - Trợ Lý Khởi Tạo KPI Chuẩn Mẫu Excel',
  description:
    'Hệ thống tự động trích xuất tệp Word/PDF, phân tích và phân loại công việc vào 6 Trục kết quả trọng tâm và xuất trực tiếp file Excel mẫu mau.xlsx.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
