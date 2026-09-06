import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PROCUCEV Platform Engine | AI Procurement Advisory & Analytics',
  description: 'PROCUCEV Platform Engine - Tech-Enabled Procurement Advisory, AI Analytics Engine & Real-Time Savings Suite',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230284c7' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 2 7 12 12 22 7 12 2'/><polyline points='2 17 12 22 22 17'/><polyline points='2 12 12 17 22 12'/></svg>"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#f8fafc] text-slate-800 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
