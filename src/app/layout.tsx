import type { Metadata } from 'next';
import './globals.css';
import Analytics from './components/Analytics';

export const metadata: Metadata = {
  title: 'Indications Media AI — Web Dev, AI & Cybersecurity',
  description:
    'AI-powered assistant for web development, AI integration, and cybersecurity questions. Built by Indications Media.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Analytics />
        {children}
      </body>
    </html>
  );
}
