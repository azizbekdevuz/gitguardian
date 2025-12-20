import type { Metadata } from "next";
import Header from "../components/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitGuard Agent",
  description: "Safe Git Recovery, Step-by-Step",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        {/* Header component - Shows on ALL pages */}
        <Header />

        {/* Main content with padding for fixed header */}
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}