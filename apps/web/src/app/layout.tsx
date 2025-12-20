import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GitGuard Agent',
  description: 'Safe git recovery helper - reversible by design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
