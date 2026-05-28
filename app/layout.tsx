import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '2026 월드컵 예측 게임',
  description: '대한민국 vs 멕시코 예측 포인트 게임',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased">
        <main className="mx-auto max-w-lg px-4 pb-16 pt-6">
          {children}
        </main>
      </body>
    </html>
  );
}
